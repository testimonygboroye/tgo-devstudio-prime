import {NextRequest,NextResponse} from "next/server";
import mongoose,{Types} from "mongoose";
import {randomUUID} from "node:crypto";
import {getServerSession} from "@/lib/auth/serverSession";
import {connectToDatabase} from "@/lib/db";
import FinanceSettings from "@/models/FinanceSettings";
import FinanceInvoice from "@/models/FinanceInvoice";
import FinanceInstallmentPlan from "@/models/FinanceInstallmentPlan";
import ClientCreditAccount from "@/models/ClientCreditAccount";
import FinanceReceipt from "@/models/FinanceReceipt";
import PaymentTransaction from "@/models/PaymentTransaction";
import CommercialOrder from "@/models/CommercialOrder";
import DeliveryProject from "@/models/DeliveryProject";
import DeliveryMilestone from "@/models/DeliveryMilestone";
import FinancialLedgerEntry from "@/models/FinancialLedgerEntry";
import {toMinorUnits} from "@/lib/payments/money";
import {buildPaymentLedgerEntries} from "@/lib/finance/ledger";
import {ensureFinanceReceipt} from "@/lib/finance/receipts";
import {writePlatformAuditEvent} from "@/lib/platform/audit";

export const dynamic="force-dynamic";
function fail(message:string,status=400){return NextResponse.json({ok:false,error:message},{status});}
function validId(value:unknown):value is string{return typeof value==="string"&&Types.ObjectId.isValid(value);}
async function clientSession(){const session=await getServerSession();if(!session||session.user.accountType!=="client"||!session.user.isEmailVerified)return null;return session;}
type ClientFinanceSession=NonNullable<Awaited<ReturnType<typeof getServerSession>>>;
type InstallmentPlanDocument=NonNullable<Awaited<ReturnType<typeof FinanceInstallmentPlan.findOne>>>;
type InstallmentDocument=InstallmentPlanDocument["installments"][number];
async function log(session:ClientFinanceSession,action:string,type:string,id:string,metadata:Record<string,unknown>={}){await writePlatformAuditEvent({actorType:"human",actorId:String(session.user._id),actorLabel:session.user.name,action,module:"finance",targetType:type,targetId:id,outcome:"success",metadata});}
function ref(prefix:string){return `TGO_${prefix}_${randomUUID().replace(/-/g,"").slice(0,20).toUpperCase()}`;}

export async function GET(){
 const session=await clientSession();if(!session)return fail("Verified client sign-in required.",401);
 await connectToDatabase();
 await FinanceInvoice.updateMany({status:{$in:["issued","partially_paid"]},dueAt:{$lt:new Date()},balanceMinor:{$gt:0}},{$set:{status:"overdue"}});
 await FinanceInstallmentPlan.updateMany({status:"active",installments:{$elemMatch:{status:{$in:["pending","partially_paid"]},dueAt:{$lt:new Date()}}}},{$set:{"installments.$[due].status":"overdue"}},{arrayFilters:[{"due.status":{$in:["pending","partially_paid"]},"due.dueAt":{$lt:new Date()}}]});
 const [settings,invoices,credits,payments,installmentPlans,orders,receipts]=await Promise.all([
  FinanceSettings.findOne({key:"global"}).lean(),
  FinanceInvoice.find({clientId:session.user._id,status:{$nin:["draft","void"]}}).sort({createdAt:-1}).lean(),
  ClientCreditAccount.find({clientId:session.user._id}).lean(),
  PaymentTransaction.find({clientId:session.user._id}).select("-accessCode -authorizationUrl").sort({createdAt:-1}).limit(100).lean(),
  FinanceInstallmentPlan.find({clientId:session.user._id,status:"active"}).sort({createdAt:-1}).lean(),
  CommercialOrder.find({clientId:session.user._id}).sort({createdAt:-1}).lean(),
  FinanceReceipt.find({clientId:session.user._id}).sort({issuedAt:-1}).limit(100).lean(),
 ]);
 return NextResponse.json({ok:true,bankTransfer:settings?.bankTransferEnabled?{enabled:true,bankName:settings.bankName,accountName:settings.bankAccountName,accountNumber:settings.bankAccountNumber,bankCode:settings.bankCode,instructions:settings.bankTransferInstructions}: {enabled:false},invoices,credits,payments,installmentPlans,orders,receipts,paymentConfigured:Boolean(settings?.paystackEnabled&&process.env.PAYSTACK_SECRET_KEY)},{headers:{"Cache-Control":"private, no-store"}});
}

export async function POST(request:NextRequest){
 const session=await clientSession();if(!session)return fail("Verified client sign-in required.",401);
 let body:Record<string,unknown>;try{body=await request.json();}catch{return fail("Invalid finance request.");}
 if(!validId(body.orderId))return fail("A valid order id is required.");
 await connectToDatabase();
 const [user,order,settings]=await Promise.all([
  (await import("@/models/User")).default.findOne({_id:session.user._id,accountType:"client",isEmailVerified:true}),
  CommercialOrder.findOne({_id:body.orderId,clientId:session.user._id}),
  FinanceSettings.findOne({key:"global"}),
 ]);
 if(!user||!order)return fail("Order not found in your client account.",404);
 if(["cancelled","refunded","completed"].includes(order.status))return fail("This order is not eligible for payment.");
 const currency=String(order.currency||"NGN").toUpperCase();
 const totalMinor=toMinorUnits(order.amount,currency);
 let milestone:Awaited<ReturnType<typeof DeliveryMilestone.findOne>>=null;let installmentPlan:InstallmentPlanDocument|null=null;let installment:InstallmentDocument|null=null;
 if(typeof body.milestoneId==="string"){
  if(!validId(body.milestoneId))return fail("Invalid milestone id.");
  const project=await DeliveryProject.findOne({orderId:order._id,clientId:user._id});if(!project)return fail("Delivery project not found.",404);
  milestone=await DeliveryMilestone.findOne({_id:body.milestoneId,projectId:project._id});if(!milestone)return fail("Milestone not found.",404);
  if(milestone.paymentStatus==="paid")return fail("This milestone has already been paid.");
 }
 if(typeof body.installmentId==="string"){if(!validId(body.installmentId)||body.milestoneId)return fail("Invalid installment payment request.");installmentPlan=await FinanceInstallmentPlan.findOne({orderId:order._id,clientId:user._id,status:"active"});installment=installmentPlan?.installments.find(item=>String(item._id)===body.installmentId);if(!installment)return fail("Installment not found in your payment schedule.",404);if(installment.status==="paid")return fail("This installment has already been paid.");if(body.amount!==undefined)return fail("Installment payments use the configured scheduled amount.");}
 if(!milestone&&!installment&&await FinanceInstallmentPlan.findOne({orderId:order._id,clientId:user._id,status:"active"}))return fail("This order has an installment schedule. Submit a payment against a scheduled installment.");
 if(!milestone&&!installment){const project=await DeliveryProject.findOne({orderId:order._id,clientId:user._id});if(project&&await DeliveryMilestone.countDocuments({projectId:project._id,amount:{$gt:0}})>0)return fail("This order uses milestone billing. Submit payment for each milestone from the project delivery section.");}
 const paid=await PaymentTransaction.aggregate([{$match:{orderId:order._id,status:"paid",...(milestone?{milestoneId:milestone._id}:{milestoneId:{$exists:false}})}},{$group:{_id:null,total:{$sum:"$amountMinor"}}}]);
 const paidMinor=installment?Number(installment.paidMinor||0):Number(paid[0]?.total||0);
 const targetMinor=installment?Number(installment.amountMinor):milestone?toMinorUnits(milestone.amount,currency):totalMinor;
 const remainingMinor=targetMinor-paidMinor;
 if(remainingMinor<=0)return fail("There is no outstanding balance for this payment.");
 let amountMinor=remainingMinor;
 if(body.amount!==undefined){
  if(typeof body.amount!=="number"||!Number.isFinite(body.amount)||body.amount<=0)return fail("Enter a valid positive payment amount.");
  amountMinor=toMinorUnits(body.amount,currency);
  if(amountMinor<1||amountMinor>remainingMinor)return fail("Payment amount must not exceed the outstanding balance.");
 }
 if(installment&&amountMinor!==remainingMinor)return fail("Installments must be paid at their configured scheduled amount.");
 if(milestone&&amountMinor!==remainingMinor)return fail("Milestone payments must be paid in full. Partial payments are available for order balances.");
 const amount=fromMinorUnits(amountMinor,currency);
 const transactionReference=ref("PAY");

 if(body.action==="bank_transfer.submit"){
  if(!settings?.bankTransferEnabled)return fail("Bank transfer is not currently enabled. Contact TGO DevStudio for payment options.",503);
  const transferReference=String(body.transferReference||"").trim();
  if(transferReference.length<4||transferReference.length>160)return fail("Enter the bank transfer reference or narration from your bank receipt.");
  if(await PaymentTransaction.exists({provider:"bank_transfer",bankTransferReference:transferReference}))return fail("This bank transfer reference has already been submitted.",409);
  const payment=await PaymentTransaction.create({reference:transactionReference,provider:"bank_transfer",paymentMethod:"bank_transfer",clientId:user._id,orderId:order._id,milestoneId:milestone?._id,installmentId:installment?._id,amount,amountMinor,currency,status:"pending_review",bankTransferReference:transferReference,proofUrl:typeof body.proofUrl==="string"?body.proofUrl:undefined});
  if(order.paymentStatus!=="partially_paid"){order.paymentStatus="pending";await order.save();}
  await log(session,"finance.bank_transfer_submitted","payment_transaction",String(payment._id),{reference:payment.reference,amountMinor,currency,transferReference});
  return NextResponse.json({ok:true,item:payment,message:"Bank transfer details submitted. Your payment remains pending until TGO verifies the funds."},{status:201});
 }

 if(body.action==="account_credit.apply"){
  const account=await ClientCreditAccount.findOne({clientId:user._id,currency});
  if(!account||account.balanceMinor<amountMinor)return fail("Your available account credit is not enough to cover this payment.");
  const dbSession=await mongoose.startSession();let paymentId:Types.ObjectId|null=null;
  try{
   await dbSession.withTransaction(async()=>{
    const currentAccount=await ClientCreditAccount.findOne({clientId:user._id,currency}).session(dbSession);
    if(!currentAccount||currentAccount.balanceMinor<amountMinor)throw new Error("Available account credit changed. Refresh and try again.");
    currentAccount.balanceMinor-=amountMinor;await currentAccount.save({session:dbSession});
    const created=await PaymentTransaction.create([{reference:transactionReference,provider:"account_credit",paymentMethod:"account_credit",clientId:user._id,orderId:order._id,milestoneId:milestone?._id,installmentId:installment?._id,amount,amountMinor,currency,status:"paid",verifiedAt:new Date(),providerTransactionId:"account-credit"}],{session:dbSession});
    const currentPayment=created[0];paymentId=currentPayment._id;
    await ensureFinanceReceipt(currentPayment,dbSession);
    const entries=buildPaymentLedgerEntries({reference:currentPayment.reference,paymentTransactionId:String(currentPayment._id),orderId:String(order._id),clientId:String(user._id),amountMinor,currency,source:"account_credit"});
    await FinancialLedgerEntry.insertMany(entries as Parameters<typeof FinancialLedgerEntry.insertMany>[0],{session:dbSession});
    if(milestone){const current=await DeliveryMilestone.findById(milestone._id).session(dbSession);if(!current)throw new Error("Milestone no longer exists.");current.paymentStatus="paid";await current.save({session:dbSession});}
    if(installment){const plan=await FinanceInstallmentPlan.findById(installmentPlan._id).session(dbSession);const item=plan?.installments.find(entry=>String(entry._id)===String(installment._id));if(!plan||!item)throw new Error("Installment schedule no longer exists.");item.paidMinor=Math.min(item.amountMinor,item.paidMinor+amountMinor);item.status=item.paidMinor>=item.amountMinor?"paid":"partially_paid";if(plan.installments.every(entry=>entry.status==="paid"))plan.status="completed";await plan.save({session:dbSession});}
    const allPaid=await PaymentTransaction.aggregate([{$match:{orderId:order._id,status:"paid"}},{$group:{_id:null,total:{$sum:"$amountMinor"}}}]).session(dbSession);
    const orderDoc=await CommercialOrder.findById(order._id).session(dbSession);if(!orderDoc)throw new Error("Order no longer exists.");
    orderDoc.paymentStatus=Number(allPaid[0]?.total||0)>=totalMinor?"paid":"partially_paid";if(orderDoc.paymentStatus==="paid")orderDoc.status="confirmed";await orderDoc.save({session:dbSession});
    const invoice=await FinanceInvoice.findOne({orderId:order._id,status:{$nin:["void","draft"]}}).session(dbSession);
    if(invoice){invoice.amountPaidMinor=Math.min(invoice.totalMinor,Number(allPaid[0]?.total||0));invoice.balanceMinor=Math.max(0,invoice.totalMinor-invoice.amountPaidMinor);invoice.status=invoice.balanceMinor===0?"paid":invoice.amountPaidMinor>0?"partially_paid":"issued";await invoice.save({session:dbSession});}
   });
  }finally{await dbSession.endSession();}
  if(!paymentId)return fail("The account-credit payment could not be recorded.",500);
  await log(session,"finance.account_credit_applied","payment_transaction",String(paymentId),{reference:transactionReference,amountMinor,currency,orderId:String(order._id)});
  return NextResponse.json({ok:true,message:"Account credit applied to your order.",reference:transactionReference});
 }
 return fail("Unsupported client finance action.");
}
