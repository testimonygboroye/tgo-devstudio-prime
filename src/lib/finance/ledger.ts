import {Types} from "mongoose";
type PaymentLedgerSource={reference:string;paymentTransactionId:Types.ObjectId;orderId:Types.ObjectId;clientId:Types.ObjectId;amountMinor:number;currency:string;providerTransactionId?:string};
export function buildPaymentLedgerEntries(payment:PaymentLedgerSource,postedAt=new Date()){
 if(!Number.isSafeInteger(payment.amountMinor)||payment.amountMinor<1)throw new Error("Ledger entries require a positive integer minor-unit amount.");
 const common={paymentTransactionId:payment.paymentTransactionId,orderId:payment.orderId,clientId:payment.clientId,amountMinor:payment.amountMinor,currency:payment.currency,source:"paystack" as const,sourceReference:payment.reference,postedAt,metadata:{providerTransactionId:payment.providerTransactionId||""}};
 return [
  {entryKey:`${payment.reference}:cash-debit`,...common,accountCode:"cash" as const,direction:"debit" as const},
  {entryKey:`${payment.reference}:client-advance-credit`,...common,accountCode:"client_advance" as const,direction:"credit" as const}
 ];
}
