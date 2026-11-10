import {NextRequest,NextResponse} from "next/server";
import {randomUUID} from "node:crypto";
import mongoose,{Types} from "mongoose";
import {getServerSession} from "@/lib/auth/serverSession";
import {connectToDatabase} from "@/lib/db";
import {writePlatformAuditEvent} from "@/lib/platform/audit";
import FinanceSettings from "@/models/FinanceSettings";
import FinanceInvoice from "@/models/FinanceInvoice";
import FinanceExpense from "@/models/FinanceExpense";
import FinanceRefund from "@/models/FinanceRefund";
import FinanceInstallmentPlan from "@/models/FinanceInstallmentPlan";
import FinanceApproval from "@/models/FinanceApproval";
import FinanceReconciliation from "@/models/FinanceReconciliation";
import {ensureFinanceReceipt} from "@/lib/finance/receipts";
import ClientCreditAccount from "@/models/ClientCreditAccount";
import PaymentTransaction from "@/models/PaymentTransaction";
import CommercialOrder from "@/models/CommercialOrder";
import CommercialQuote from "@/models/CommercialQuote";
import DeliveryProject from "@/models/DeliveryProject";
import DeliveryMilestone from "@/models/DeliveryMilestone";
import User from "@/models/User";
import FinancialLedgerEntry from "@/models/FinancialLedgerEntry";
import {toMinorUnits,fromMinorUnits} from "@/lib/payments/money";
import {buildCreditAdjustmentEntries,buildExpenseLedgerEntries,buildPaymentLedgerEntries,buildRefundLedgerEntries,buildCreditRestorationEntries} from "@/lib/finance/ledger";
import {verifyAndRecordPaystackPayment} from "@/lib/payments/paystack";
import {getPaymentProvider} from "@/lib/payments/provider";
import {sendNotificationEmail} from "@/lib/email/sendEmail";
import {getPublicSiteUrl} from "@/lib/site-url";

export const dynamic="force-dynamic";
function fail(message:string,status=400){return NextResponse.json({ok:false,error:message},{status});}
function validId(value:unknown):value is string{return typeof value==="string"&&Types.ObjectId.isValid(value);}
function escapeHtml(value:string){return value.replace(/[&<>"\']/g,(character)=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","\'":"&#39;"}[character]||character));}
function ref(prefix:string){return `${prefix}-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${randomUUID().slice(0,8).toUpperCase()}`;}
async function requireFounder(){const session=await getServerSession();if(!session)return {session:null,response:fail("Authentication required.",401)};if(!session.role?.isFounderRole)return {session:null,response:fail("Founder finance permissions are required.",403)};await connectToDatabase();return {session,response:null};}
async function audit(session:any,action:string,type:string,id:string,metadata:Record<string,unknown>={}){await writePlatformAuditEvent({actorType:"human",actorId:String(session.user._id),actorLabel:session.user.name,action,module:"finance",targetType:type,targetId:id,outcome:"success",metadata});}

export async function GET(request:NextRequest){
 const auth=await requireFounder();if(auth.response)return auth.response;
 await FinanceInvoice.updateMany({status:{$in:["issued","partially_paid"]},dueAt:{$lt:new Date()},balanceMinor:{$gt:0}},{$set:{status:"overdue"}});
 await FinanceInstallmentPlan.updateMany({status:"active",installments:{$elemMatch:{status:{$in:["pending","partially_paid"]},dueAt:{$lt:new Date()}}}},{$set:{"installments.$[due].status":"overdue"}},{arrayFilters:[{"due.status":{$in:["pending","partially_paid"]},"due.dueAt":{$lt:new Date()}}]});
 const [settings,invoices,expenses,refunds,installments,approvals,reconciliations,credits,payments,ledger,orders,clients]=await Promise.all([
  FinanceSettings.findOne({key:"global"}).lean(),
  FinanceInvoice.find({}).sort({createdAt:-1}).limit(100).lean(),
  FinanceExpense.find({}).sort({createdAt:-1}).limit(100).lean(),
  FinanceRefund.find({}).sort({createdAt:-1}).limit(100).lean(),
  FinanceInstallmentPlan.find({}).sort({createdAt:-1}).limit(100).lean(),
  FinanceApproval.find({status:"pending"}).sort({createdAt:-1}).limit(100).lean(),
  FinanceReconciliation.find({}).sort({createdAt:-1}).limit(30).lean(),
  ClientCreditAccount.find({balanceMinor:{$gt:0}}).sort({updatedAt:-1}).limit(100).lean(),
  PaymentTransaction.find({}).select("-accessCode -authorizationUrl").sort({createdAt:-1}).limit(100).lean(),
  FinancialLedgerEntry.find({}).sort({postedAt:-1}).limit(500).lean(),
  CommercialOrder.find({}).sort({createdAt:-1}).limit(100).lean(),
  User.find({accountType:"client"}).select("_id name email").sort({createdAt:-1}).limit(200).lean(),
 ]);
 const summary=await FinancialLedgerEntry.aggregate([
  {$group:{_id:{currency:"$currency",accountCode:"$accountCode",direction:"$direction"},total:{$sum:"$amountMinor"},entries:{$sum:1}}},
 ]);
 return NextResponse.json({ok:true,settings:settings||null,invoices,expenses,refunds,installments,approvals,reconciliations,credits,payments,ledger,orders,clients,summary},{headers:{"Cache-Control":"private, no-store"}});
}

export async function POST(request:NextRequest){
 const auth=await requireFounder();if(auth.response)return auth.response;const session=auth.session!;
 let body:Record<string,any>;try{body=await request.json();}catch{return fail("Invalid finance request body.");}
 const action=String(body.action||"");
 try{
  if(action==="settings.update"){
   const baseCurrency=String(body.baseCurrency||"NGN").toUpperCase();
   const enabledCurrencies=Array.isArray(body.enabledCurrencies)?[...new Set(body.enabledCurrencies.map((x:unknown)=>String(x).toUpperCase()))]:[baseCurrency];
   if(!/^[A-Z]{3}$/.test(baseCurrency)||enabledCurrencies.some((x:string)=>!/^[A-Z]{3}$/.test(x)))return fail("Use valid three-letter ISO currency codes.");if(!enabledCurrencies.includes(baseCurrency))return fail("The base currency must also be included in enabled currencies.");
   const taxRateBps=Number(body.taxRateBps||0);if(!Number.isInteger(taxRateBps)||taxRateBps<0||taxRateBps>10000)return fail("Tax rate must be between 0 and 10000 basis points.");
   const bankTransferEnabled=body.bankTransferEnabled===true;
   if(bankTransferEnabled&&(!String(body.bankName||"").trim()||!String(body.bankAccountName||"").trim()||!String(body.bankAccountNumber||"").trim()))return fail("Bank name, account name and account number are required before enabling bank transfer.");
   const settings=await FinanceSettings.findOneAndUpdate({key:"global"},{$set:{
    baseCurrency,enabledCurrencies,invoicePrefix:String(body.invoicePrefix||"TGO-INV").trim().slice(0,20),allowPartialPayments:body.allowPartialPayments!==false,
    taxEnabled:body.taxEnabled===true,taxName:String(body.taxName||"VAT").trim().slice(0,40),taxRateBps,taxRegistrationNumber:String(body.taxRegistrationNumber||"").trim(),
    paystackEnabled:body.paystackEnabled===true,bankTransferEnabled,bankName:String(body.bankName||"").trim(),bankAccountName:String(body.bankAccountName||"").trim(),
    bankAccountNumber:String(body.bankAccountNumber||"").trim(),bankCode:String(body.bankCode||"").trim(),bankTransferInstructions:String(body.bankTransferInstructions||"").trim(),
   }}, {upsert:true,new:true,setDefaultsOnInsert:true});
   await audit(session,"finance.settings_updated","finance_settings",String(settings._id),{baseCurrency,enabledCurrencies,taxEnabled:settings.taxEnabled,paystackEnabled:settings.paystackEnabled,bankTransferEnabled});
   return NextResponse.json({ok:true,item:settings,message:"Finance settings saved."});
  }
  if(action==="invoice.create"){
   if(!validId(body.orderId))return fail("A valid commercial order is required.");
   const order=await CommercialOrder.findById(body.orderId);if(!order)return fail("Order not found.",404);
   const existing=await FinanceInvoice.findOne({orderId:order._id});if(existing)return fail("An invoice already exists for this order.",409);
   const settings=await FinanceSettings.findOne({key:"global"});
   const numbering=await FinanceSettings.findOneAndUpdate({key:"global"},{$inc:{nextInvoiceNumber:1}},{new:true,upsert:true,setDefaultsOnInsert:true});
   const invoiceNumber=(settings?.invoicePrefix||"TGO-INV")+"-"+String(Math.max(1,Number(numbering?.nextInvoiceNumber||1))).padStart(6,"0");
   const currency=String(order.currency||settings?.baseCurrency||"NGN").toUpperCase();
   const quote=await CommercialQuote.findById(order.quoteId).lean();
   const totalMinor=toMinorUnits(order.amount,currency);
   const subtotalMinor=quote?toMinorUnits(quote.subtotal,currency):totalMinor;
   const discountMinor=quote?toMinorUnits(quote.discount,currency):0;
   let taxMinor=quote?toMinorUnits(quote.tax,currency):Math.max(0,totalMinor-subtotalMinor+discountMinor);
   if(subtotalMinor-discountMinor+taxMinor!==totalMinor)taxMinor=Math.max(0,totalMinor-subtotalMinor+discountMinor);
   const invoiceItems=quote?.lineItems?.length?quote.lineItems.map((line:any)=>({description:line.description,quantity:line.quantity,unitAmountMinor:toMinorUnits(line.unitPrice,currency),lineTotalMinor:toMinorUnits(line.amount,currency)})):[{description:order.title,quantity:1,unitAmountMinor:totalMinor,lineTotalMinor:totalMinor}];
   const invoice=await FinanceInvoice.create({
    reference:invoiceNumber,clientId:order.clientId,orderId:order._id,currency,
    items:invoiceItems,
    subtotalMinor,discountMinor,taxMinor,taxName:settings?.taxName,taxRateBps:settings?.taxRateBps,taxRegistrationNumber:settings?.taxRegistrationNumber,totalMinor,amountPaidMinor:0,balanceMinor:totalMinor,
    status:"draft",dueAt:body.dueAt?new Date(body.dueAt):undefined,terms:String(body.terms||"Payment is due by the invoice due date."),
    createdBy:session.user._id,
   });
   await audit(session,"finance.invoice_created","finance_invoice",String(invoice._id),{reference:invoice.reference,orderId:String(order._id),totalMinor});
   return NextResponse.json({ok:true,item:invoice},{status:201});
  }
  if(action==="invoice.issue"){
   if(!validId(body.id))return fail("Valid invoice id required.");
   const invoice=await FinanceInvoice.findById(body.id);if(!invoice)return fail("Invoice not found.",404);
   if(invoice.status!=="draft")return fail("Only draft invoices can be issued.");
   invoice.status=invoice.amountPaidMinor>=invoice.totalMinor?"paid":invoice.amountPaidMinor>0?"partially_paid":"issued";invoice.issuedAt=new Date();if(body.dueAt)invoice.dueAt=new Date(body.dueAt);await invoice.save();
   const client=await User.findOne({_id:invoice.clientId,accountType:"client"}).select("name email");
   if(client&&process.env.BREVO_API_KEY&&process.env.BREVO_SENDER_EMAIL){
    try{const site=getPublicSiteUrl();await sendNotificationEmail({toEmail:client.email,toName:client.name,subject:`TGO DevStudio invoice ${invoice.reference}`,htmlContent:`<div style="font-family:Arial,sans-serif;color:#172033"><h2>Your TGO DevStudio invoice is ready</h2><p>Hello ${escapeHtml(client.name)},</p><p>Invoice <strong>${invoice.reference}</strong> for ${invoice.currency} ${fromMinorUnits(invoice.totalMinor,invoice.currency).toLocaleString()} is available in your client portal.</p><p><a href="${site}/client/services">Open your client portal</a></p></div>`});}catch(emailError){console.error("Invoice notification email failed",emailError);}
   }
   await audit(session,"finance.invoice_issued","finance_invoice",String(invoice._id),{reference:invoice.reference});
   return NextResponse.json({ok:true,item:invoice,message:"Invoice issued. The client portal now shows the invoice."});
  }
  if(action==="expense.create"){
   const amount=Number(body.amount);const currency=String(body.currency||"NGN").toUpperCase();
   if(typeof body.category!=="string"||!body.category.trim()||typeof body.vendor!=="string"||!body.vendor.trim()||typeof body.description!=="string"||body.description.trim().length<5||!Number.isFinite(amount)||amount<=0||!body.incurredAt)return fail("Category, vendor, description, positive amount and incurred date are required.");
   const expense=await FinanceExpense.create({reference:ref("EXP"),category:body.category.trim(),vendor:body.vendor.trim(),description:body.description.trim(),amountMinor:toMinorUnits(amount,currency),currency,incurredAt:new Date(body.incurredAt),status:"submitted",receiptUrl:typeof body.receiptUrl==="string"?body.receiptUrl:undefined,requestedBy:session.user._id});
   const approval=await FinanceApproval.create({action:"expense_payment",targetId:expense._id,amountMinor:expense.amountMinor,currency,requestedBy:session.user._id,status:"pending"});
   await audit(session,"finance.expense_submitted","finance_expense",String(expense._id),{reference:expense.reference,approvalId:String(approval._id)});
   return NextResponse.json({ok:true,item:expense,approval},{status:201});
  }
  if(action==="expense.decide"){
   if(!validId(body.id)||!["approved","rejected"].includes(body.status))return fail("Expense and approval decision are required.");
   const expense=await FinanceExpense.findById(body.id);if(!expense||expense.status!=="submitted")return fail("Only submitted expenses can be reviewed.",404);
   expense.status=body.status;expense.approvedBy=session.user._id;expense.approvedAt=new Date();await expense.save();
   await FinanceApproval.updateOne({targetId:expense._id,action:"expense_payment",status:"pending"},{$set:{status:body.status,decidedBy:session.user._id,decidedAt:new Date(),decisionNote:String(body.note||"")}});
   await audit(session,`finance.expense_${body.status}`,"finance_expense",String(expense._id),{reference:expense.reference});
   return NextResponse.json({ok:true,item:expense});
  }
  if(action==="expense.mark_paid"){
   if(!validId(body.id))return fail("Valid expense id required.");
   const expense=await FinanceExpense.findById(body.id);if(!expense||expense.status!=="approved")return fail("Only approved expenses can be paid.",409);
   const dbSession=await mongoose.startSession();
   try{await dbSession.withTransaction(async()=>{const current=await FinanceExpense.findOne({_id:expense._id,status:"approved"}).session(dbSession);if(!current)throw new Error("Expense is no longer approved.");const entries=buildExpenseLedgerEntries({reference:current.reference,expenseId:String(current._id),amountMinor:current.amountMinor,currency:current.currency});await FinancialLedgerEntry.insertMany(entries as any,{session:dbSession});current.status="paid";current.paidAt=new Date();current.paymentReference=String(body.paymentReference||"");await current.save({session:dbSession});});}finally{await dbSession.endSession();}
   await audit(session,"finance.expense_paid","finance_expense",String(expense._id),{reference:expense.reference});
   return NextResponse.json({ok:true,message:"Expense payment recorded and posted to the immutable ledger."});
  }
  if(action==="bank_transfer.decide"){
   if(!validId(body.id)||!["verified","rejected"].includes(body.decision))return fail("Choose a bank transfer and confirm whether it was verified or rejected.");
   const payment=await PaymentTransaction.findOne({_id:body.id,provider:"bank_transfer",status:"pending_review"});if(!payment)return fail("Pending bank transfer was not found.",404);
   if(body.decision==="rejected"){payment.status="failed";payment.failureReason=String(body.note||"Bank transfer could not be verified.");await payment.save();await audit(session,"finance.bank_transfer_rejected","payment_transaction",String(payment._id),{reference:payment.reference});return NextResponse.json({ok:true,item:payment,message:"Bank transfer rejected. The order remains unpaid."});}
   const dbSession=await mongoose.startSession();
   try{await dbSession.withTransaction(async()=>{
    const current=await PaymentTransaction.findOne({_id:payment._id,provider:"bank_transfer",status:"pending_review"}).session(dbSession);if(!current)throw new Error("Bank transfer has already been reviewed.");
    current.status="paid";current.verifiedAt=new Date();current.providerTransactionId=current.bankTransferReference||"";await current.save({session:dbSession});
    await ensureFinanceReceipt(current,dbSession);
    const entries=buildPaymentLedgerEntries({reference:current.reference,paymentTransactionId:String(current._id),orderId:String(current.orderId),clientId:String(current.clientId),amountMinor:current.amountMinor,currency:current.currency,source:"bank_transfer"});await FinancialLedgerEntry.insertMany(entries as any,{session:dbSession});
    if(current.milestoneId){const project=await DeliveryProject.findOne({orderId:current.orderId,clientId:current.clientId}).session(dbSession);if(!project)throw new Error("Linked delivery project was not found.");const milestone=await DeliveryMilestone.findOne({_id:current.milestoneId,projectId:project._id}).session(dbSession);if(!milestone)throw new Error("Linked milestone was not found.");milestone.paymentStatus="paid";await milestone.save({session:dbSession});}
    if(current.installmentId){const plan=await FinanceInstallmentPlan.findOne({orderId:current.orderId,clientId:current.clientId,"installments._id":current.installmentId}).session(dbSession);const item=plan?.installments.find((entry:any)=>String(entry._id)===String(current.installmentId));if(!plan||!item)throw new Error("Linked installment schedule was not found.");item.paidMinor=Math.min(item.amountMinor,item.paidMinor+current.amountMinor);item.status=item.paidMinor>=item.amountMinor?"paid":"partially_paid";if(plan.installments.every((entry:any)=>entry.status==="paid"))plan.status="completed";await plan.save({session:dbSession});}
    const paid=await PaymentTransaction.aggregate([{$match:{orderId:current.orderId,status:"paid"}},{$group:{_id:null,total:{$sum:"$amountMinor"}}}]).session(dbSession);
    const order=await CommercialOrder.findById(current.orderId).session(dbSession);if(!order)throw new Error("Linked order was not found.");
    order.paymentStatus=Number(paid[0]?.total||0)>=toMinorUnits(order.amount,order.currency)?"paid":"partially_paid";if(order.paymentStatus==="paid")order.status="confirmed";order.paymentProviderReference=current.reference;order.paymentVerifiedAt=new Date();await order.save({session:dbSession});
    const invoice=await FinanceInvoice.findOne({orderId:order._id,clientId:current.clientId,status:{$nin:["draft","void"]}}).session(dbSession);if(invoice){const invoicePaid=await PaymentTransaction.aggregate([{$match:{orderId:order._id,status:"paid"}},{$group:{_id:null,total:{$sum:"$amountMinor"}}}]).session(dbSession);invoice.amountPaidMinor=Math.min(invoice.totalMinor,Number(invoicePaid[0]?.total||0));invoice.balanceMinor=Math.max(0,invoice.totalMinor-invoice.amountPaidMinor);invoice.status=invoice.balanceMinor===0?"paid":invoice.amountPaidMinor>0?"partially_paid":"issued";await invoice.save({session:dbSession});}
   });}finally{await dbSession.endSession();}
   await audit(session,"finance.bank_transfer_verified","payment_transaction",String(payment._id),{reference:payment.reference,amountMinor:payment.amountMinor,currency:payment.currency,bankReference:payment.bankTransferReference});
   return NextResponse.json({ok:true,message:"Bank transfer verified and posted to the immutable ledger."});
  }
  if(action==="credit.issue"){
   if(!validId(body.clientId))return fail("Valid client id required.");
   const client=await User.findOne({_id:body.clientId,accountType:"client"});if(!client)return fail("Client account not found.",404);
   const amount=Number(body.amount);const currency=String(body.currency||"NGN").toUpperCase();if(!Number.isFinite(amount)||amount<=0||typeof body.reason!=="string"||body.reason.trim().length<4)return fail("Positive credit amount and reason are required.");
   const amountMinor=toMinorUnits(amount,currency);const reference=ref("CRD");const dbSession=await mongoose.startSession();
   try{await dbSession.withTransaction(async()=>{const account=await ClientCreditAccount.findOneAndUpdate({clientId:client._id,currency},{$inc:{balanceMinor:amountMinor}},{upsert:true,new:true,setDefaultsOnInsert:true,session:dbSession});const entries=buildCreditAdjustmentEntries({reference,clientId:String(client._id),amountMinor,currency,reason:body.reason.trim()});await FinancialLedgerEntry.insertMany(entries as any,{session:dbSession});});}finally{await dbSession.endSession();}
   await audit(session,"finance.client_credit_issued","client_credit_account",String(client._id),{reference,amountMinor,currency,reason:body.reason.trim()});
   return NextResponse.json({ok:true,message:"Client credit issued and recorded in the ledger.",reference});
  }
  if(action==="refund.request"){
   if(!validId(body.paymentTransactionId))return fail("Valid payment transaction id required.");
   const payment=await PaymentTransaction.findById(body.paymentTransactionId);if(!payment||!["paid","partially_refunded"].includes(payment.status))return fail("Only verified payments with a refundable balance can be refunded.",409);
   const prior=await FinanceRefund.aggregate([{$match:{paymentTransactionId:payment._id,status:{$nin:["failed"]}}},{$group:{_id:null,total:{$sum:"$amountMinor"}}}]);
   const remainingMinor=payment.amountMinor-Number(prior[0]?.total||0);if(remainingMinor<1)return fail("This payment has no refundable balance.",409);
   const amountMinor=body.amount===undefined?remainingMinor:toMinorUnits(Number(body.amount),payment.currency);if(amountMinor<1||amountMinor>remainingMinor)return fail("Refund amount exceeds the remaining refundable balance.",409);
   if(amountMinor>payment.amountMinor-Number(prior[0]?.total||0))return fail("Refund amount exceeds the unrefunded captured payment.",409);
   if(typeof body.reason!=="string"||body.reason.trim().length<5)return fail("Provide a reason for the refund.");
   const refund=await FinanceRefund.create({reference:ref("RFD"),paymentTransactionId:payment._id,clientId:payment.clientId,orderId:payment.orderId,amountMinor,currency:payment.currency,reason:body.reason.trim(),status:"requested",requestedBy:session.user._id});
   const approval=await FinanceApproval.create({action:"refund",targetId:refund._id,amountMinor,currency:payment.currency,requestedBy:session.user._id,status:"pending"});
   await audit(session,"finance.refund_requested","finance_refund",String(refund._id),{reference:refund.reference,amountMinor});
   return NextResponse.json({ok:true,item:refund,approval},{status:201});
  }
  if(action==="refund.decide"){
   if(!validId(body.id)||!["approved","rejected"].includes(body.status))return fail("Refund and approval decision are required.");
   const refund=await FinanceRefund.findById(body.id);if(!refund||refund.status!=="requested")return fail("Only requested refunds can be reviewed.",404);
   if(body.status==="rejected"){refund.status="failed";refund.failureReason=String(body.note||"Refund request rejected.");}else{refund.status="approved";refund.approvedBy=session.user._id;refund.approvedAt=new Date();}
   await refund.save();await FinanceApproval.updateOne({targetId:refund._id,action:"refund",status:"pending"},{$set:{status:body.status,decidedBy:session.user._id,decidedAt:new Date(),decisionNote:String(body.note||"")}});
   await audit(session,`finance.refund_${body.status}`,"finance_refund",String(refund._id),{reference:refund.reference});
   return NextResponse.json({ok:true,item:refund});
  }
  if(action==="refund.process"){
   if(!validId(body.id))return fail("Valid refund id required.");
   const refund=await FinanceRefund.findById(body.id);if(!refund||refund.status!=="approved")return fail("Only approved refunds can be processed.",409);
   const payment=await PaymentTransaction.findById(refund.paymentTransactionId);if(!payment)return fail("Original payment record was not found.",404);
   if(payment.provider==="paystack"){
    if(!payment.providerTransactionId)return fail("The original Paystack transaction id is unavailable.",409);
    const secret=process.env.PAYSTACK_SECRET_KEY;if(!secret)return fail("PAYSTACK_SECRET_KEY is not configured.",503);
    const response=await fetch("https://api.paystack.co/refund",{method:"POST",headers:{Authorization:`Bearer ${secret}`,"Content-Type":"application/json"},body:JSON.stringify({transaction:payment.providerTransactionId,amount:refund.amountMinor,currency:refund.currency}),cache:"no-store"});
    const data=await response.json() as {status?:boolean;message?:string;data?:{id?:number;status?:string}};
    if(!response.ok||!data.status||!data.data)throw new Error(data.message||"Paystack did not accept the refund request.");
    refund.status="processing";refund.providerReference=String(data.data.id||"");await refund.save();
    await audit(session,"finance.refund_submitted_to_provider","finance_refund",String(refund._id),{providerReference:refund.providerReference});
    return NextResponse.json({ok:true,item:refund,message:"Refund submitted. The payment remains unchanged until Paystack confirms the signed refund webhook."});
   }
   let bankReference="";
   if(payment.provider==="bank_transfer"){bankReference=String(body.bankReference||"").trim();if(bankReference.length<4||bankReference.length>160)return fail("Enter the bank statement reference for the outgoing refund transfer.");}
   const dbSession=await mongoose.startSession();
   try{
    await dbSession.withTransaction(async()=>{
     const currentRefund=await FinanceRefund.findOne({_id:refund._id,status:"approved"}).session(dbSession);if(!currentRefund)throw new Error("Refund request has already been processed.");
     const currentPayment=await PaymentTransaction.findById(payment._id).session(dbSession);if(!currentPayment)throw new Error("Original payment record was not found.");
     currentRefund.status="processed";currentRefund.processedAt=new Date();currentRefund.providerReference=payment.provider==="account_credit"?"account-credit-restored":bankReference;await currentRefund.save({session:dbSession});
     currentPayment.refundAmountMinor=Number(currentPayment.refundAmountMinor||0)+currentRefund.amountMinor;
     currentPayment.status=currentPayment.refundAmountMinor>=currentPayment.amountMinor?"refunded":"partially_refunded";await currentPayment.save({session:dbSession});
     if(payment.provider==="account_credit"){
      await ClientCreditAccount.findOneAndUpdate({clientId:currentPayment.clientId,currency:currentPayment.currency},{$inc:{balanceMinor:currentRefund.amountMinor}},{upsert:true,new:true,setDefaultsOnInsert:true,session:dbSession});
      const entries=buildCreditRestorationEntries({reference:currentRefund.reference,paymentTransactionId:String(currentPayment._id),orderId:String(currentPayment.orderId),clientId:String(currentPayment.clientId),amountMinor:currentRefund.amountMinor,currency:currentRefund.currency});
      await FinancialLedgerEntry.insertMany(entries as any,{session:dbSession});
     }else{
      const entries=buildRefundLedgerEntries({reference:currentRefund.reference,refundId:String(currentRefund._id),paymentTransactionId:String(currentPayment._id),orderId:String(currentPayment.orderId),clientId:String(currentPayment.clientId),amountMinor:currentRefund.amountMinor,currency:currentRefund.currency});
      await FinancialLedgerEntry.insertMany(entries as any,{session:dbSession});
     }
     const order=await CommercialOrder.findById(currentPayment.orderId).session(dbSession);
     if(order){
      const totals=await PaymentTransaction.aggregate([{$match:{orderId:order._id,status:{$in:["paid","partially_refunded","refunded"]}}},{$group:{_id:null,captured:{$sum:"$amountMinor"},refunded:{$sum:"$refundAmountMinor"}}}]).session(dbSession);
      const captured=Number(totals[0]?.captured||0),refunded=Number(totals[0]?.refunded||0);
      order.paymentStatus=refunded>=captured&&captured>0?"refunded":refunded>0?"partially_paid":order.paymentStatus;await order.save({session:dbSession});
      const invoice=await FinanceInvoice.findOne({orderId:order._id,clientId:currentPayment.clientId,status:{$nin:["draft","void"]}}).session(dbSession);
      if(invoice){invoice.amountPaidMinor=Math.max(0,Math.min(invoice.totalMinor,captured-refunded));invoice.balanceMinor=Math.max(0,invoice.totalMinor-invoice.amountPaidMinor);invoice.status=invoice.amountPaidMinor===0?"issued":invoice.balanceMinor===0?"paid":"partially_paid";await invoice.save({session:dbSession});}
     }
    });
   }finally{await dbSession.endSession();}
   await audit(session,"finance.refund_processed","finance_refund",String(refund._id),{reference:refund.reference,provider:payment.provider,bankReference:bankReference||null});
   return NextResponse.json({ok:true,message:payment.provider==="account_credit"?"Refund restored as client account credit.":"Bank refund recorded and posted to the immutable ledger."});
  }
  if(action==="installments.create"){
   if(!validId(body.orderId)||!Array.isArray(body.installments)||body.installments.length<2||body.installments.length>24)return fail("Choose an order and provide between 2 and 24 installments.");
   const order=await CommercialOrder.findById(body.orderId);if(!order)return fail("Order not found.",404);
   const existing=await FinanceInstallmentPlan.findOne({orderId:order._id});if(existing)return fail("An installment plan already exists for this order.",409);
   const currency=order.currency;const totalMinor=toMinorUnits(order.amount,currency);
   const installments=body.installments.map((item:any,index:number)=>({sequence:index+1,dueAt:new Date(item.dueAt),amountMinor:Number(item.amountMinor),paidMinor:0,status:"pending"}));
   if(installments.some((x:any)=>!Number.isFinite(x.dueAt.getTime())||!Number.isSafeInteger(x.amountMinor)||x.amountMinor<1)||installments.reduce((sum:number,x:any)=>sum+x.amountMinor,0)!==totalMinor)return fail("Installment dates and amounts must be valid, and installment amounts must exactly equal the order total in minor currency units.");
   const plan=await FinanceInstallmentPlan.create({orderId:order._id,clientId:order.clientId,currency,totalMinor,installments,status:"active",createdBy:session.user._id});
   await audit(session,"finance.installment_plan_created","finance_installment_plan",String(plan._id),{orderId:String(order._id),installmentCount:installments.length,totalMinor});
   return NextResponse.json({ok:true,item:plan},{status:201});
  }
  if(action==="reconciliation.run"){
   const fromDate=new Date(String(body.fromDate));const toDate=new Date(String(body.toDate)+"T23:59:59.999Z");const currency=String(body.currency||"NGN").toUpperCase();
   if(!Number.isFinite(fromDate.getTime())||!Number.isFinite(toDate.getTime())||toDate<=fromDate)return fail("Choose a valid reconciliation date range.");
   if(!process.env.PAYSTACK_SECRET_KEY)return fail("PAYSTACK_SECRET_KEY is required to reconcile Paystack transactions.",503);
   const payments=await PaymentTransaction.find({provider:"paystack",currency,createdAt:{$gte:fromDate,$lte:toDate}}).sort({createdAt:1}).limit(500);
   const details:Array<{paymentId:Types.ObjectId;reference:string;status:string;localAmountMinor:number;providerAmountMinor?:number;note?:string}>=[];
   let verifiedCount=0,totalLocalMinor=0,totalProviderMinor=0;
   const provider=getPaymentProvider("paystack");
   for(const payment of payments){
    try{
     const result=await provider.verify(payment.reference);
     if(result.reference!==payment.reference||result.amountMinor!==payment.amountMinor||result.currency!==payment.currency||result.status!=="success"){
      details.push({paymentId:payment._id,reference:payment.reference,status:"discrepancy",localAmountMinor:payment.amountMinor,providerAmountMinor:result.amountMinor,note:"Provider reference, amount, currency or status did not match."});continue;
     }
     if(payment.status!=="paid")await verifyAndRecordPaystackPayment(payment.reference);
     verifiedCount++;totalProviderMinor+=result.amountMinor;
     details.push({paymentId:payment._id,reference:payment.reference,status:"verified",localAmountMinor:payment.amountMinor,providerAmountMinor:result.amountMinor});
    }catch(error){details.push({paymentId:payment._id,reference:payment.reference,status:"unverified",localAmountMinor:payment.amountMinor,note:error instanceof Error?error.message:"Provider verification failed."});}
   }
   const localTotals=await PaymentTransaction.aggregate([{$match:{provider:"paystack",currency,createdAt:{$gte:fromDate,$lte:toDate},status:"paid"}},{$group:{_id:null,total:{$sum:"$amountMinor"}}}]);
   totalLocalMinor=Number(localTotals[0]?.total||0);
   const discrepancyCount=details.filter(x=>x.status!=="verified").length;
   const reconciliation=await FinanceReconciliation.create({reference:ref("REC"),provider:"paystack",currency,fromDate,toDate,scannedCount:payments.length,verifiedCount,discrepancyCount,totalLocalMinor,totalProviderMinor,status:discrepancyCount?"completed_with_discrepancies":"completed",details,createdBy:session.user._id});
   await audit(session,"finance.reconciliation_completed","finance_reconciliation",String(reconciliation._id),{reference:reconciliation.reference,scannedCount:payments.length,verifiedCount,discrepancyCount});
   return NextResponse.json({ok:true,item:reconciliation});
  }
  return fail("Unsupported finance action.");
 }catch(error){return fail(error instanceof Error?error.message:"Finance operation failed.",400);}
}
