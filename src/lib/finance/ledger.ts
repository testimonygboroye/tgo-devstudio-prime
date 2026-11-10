type PaymentLedgerSource={
 reference:string;paymentTransactionId:string;orderId:string;clientId:string;amountMinor:number;currency:string;
 providerTransactionId?:string;source?:"paystack"|"bank_transfer"|"account_credit";
};
function assertAmount(amountMinor:number){if(!Number.isSafeInteger(amountMinor)||amountMinor<1)throw new Error("Ledger entries require a positive integer minor-unit amount.");}

export function buildPaymentLedgerEntries(payment:PaymentLedgerSource,postedAt=new Date()){
 assertAmount(payment.amountMinor);
 const source=payment.source||"paystack";
 const common={paymentTransactionId:payment.paymentTransactionId,orderId:payment.orderId,clientId:payment.clientId,amountMinor:payment.amountMinor,currency:payment.currency,source,sourceReference:payment.reference,postedAt,metadata:{providerTransactionId:payment.providerTransactionId||""}};
 const debitAccount=source==="account_credit"?"client_credit":"cash";
 return [
  {entryKey:`${payment.reference}:${debitAccount}-debit`,...common,accountCode:debitAccount,direction:"debit" as const},
  {entryKey:`${payment.reference}:client-advance-credit`,...common,accountCode:"client_advance" as const,direction:"credit" as const},
 ];
}

export function buildExpenseLedgerEntries(expense:{reference:string;expenseId:string;amountMinor:number;currency:string},postedAt=new Date()){
 assertAmount(expense.amountMinor);
 const common={expenseId:expense.expenseId,amountMinor:expense.amountMinor,currency:expense.currency,source:"expense" as const,sourceReference:expense.reference,postedAt,metadata:{}};
 return [
  {entryKey:`${expense.reference}:expense-debit`,...common,accountCode:"expense" as const,direction:"debit" as const},
  {entryKey:`${expense.reference}:cash-credit`,...common,accountCode:"cash" as const,direction:"credit" as const},
 ];
}

export function buildRefundLedgerEntries(refund:{reference:string;refundId:string;paymentTransactionId:string;orderId:string;clientId:string;amountMinor:number;currency:string},postedAt=new Date()){
 assertAmount(refund.amountMinor);
 const common={refundId:refund.refundId,paymentTransactionId:refund.paymentTransactionId,orderId:refund.orderId,clientId:refund.clientId,amountMinor:refund.amountMinor,currency:refund.currency,source:"refund" as const,sourceReference:refund.reference,postedAt,metadata:{}};
 return [
  {entryKey:`${refund.reference}:client-advance-debit`,...common,accountCode:"client_advance" as const,direction:"debit" as const},
  {entryKey:`${refund.reference}:cash-credit`,...common,accountCode:"cash" as const,direction:"credit" as const},
 ];
}

export function buildCreditAdjustmentEntries(input:{reference:string;clientId:string;amountMinor:number;currency:string;reason:string},postedAt=new Date()){
 assertAmount(input.amountMinor);
 const common={clientId:input.clientId,amountMinor:input.amountMinor,currency:input.currency,source:"manual_adjustment" as const,sourceReference:input.reference,postedAt,metadata:{reason:input.reason}};
 return [
  {entryKey:`${input.reference}:credit-expense-debit`,...common,accountCode:"expense" as const,direction:"debit" as const},
  {entryKey:`${input.reference}:client-credit-credit`,...common,accountCode:"client_credit" as const,direction:"credit" as const},
 ];
}
