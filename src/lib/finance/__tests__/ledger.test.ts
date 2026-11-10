import {buildCreditAdjustmentEntries,buildCreditRestorationEntries,buildExpenseLedgerEntries,buildPaymentLedgerEntries,buildRefundLedgerEntries} from "../ledger";

function expectBalanced(entries:Array<{direction:string;amountMinor:number}>){
 const debits=entries.filter(x=>x.direction==="debit").reduce((sum,x)=>sum+x.amountMinor,0);
 const credits=entries.filter(x=>x.direction==="credit").reduce((sum,x)=>sum+x.amountMinor,0);
 expect(debits).toBe(credits);
}

describe("immutable finance ledger posting helpers",()=>{
 const postedAt=new Date("2026-11-10T00:00:00.000Z");
 it("balances a verified payment",()=>{const entries=buildPaymentLedgerEntries({reference:"TGO_PAYMENT_1",paymentTransactionId:"507f1f77bcf86cd799439011",orderId:"507f1f77bcf86cd799439012",clientId:"507f1f77bcf86cd799439013",amountMinor:125000,currency:"NGN"},postedAt);expect(entries).toHaveLength(2);expectBalanced(entries);});
 it("balances a bank or provider refund",()=>{const entries=buildRefundLedgerEntries({reference:"TGO_REFUND_1",refundId:"507f1f77bcf86cd799439014",paymentTransactionId:"507f1f77bcf86cd799439011",orderId:"507f1f77bcf86cd799439012",clientId:"507f1f77bcf86cd799439013",amountMinor:25000,currency:"NGN"},postedAt);expect(entries).toHaveLength(2);expectBalanced(entries);});
 it("balances a client-credit restoration",()=>{const entries=buildCreditRestorationEntries({reference:"TGO_REFUND_2",paymentTransactionId:"507f1f77bcf86cd799439011",orderId:"507f1f77bcf86cd799439012",clientId:"507f1f77bcf86cd799439013",amountMinor:25000,currency:"NGN"},postedAt);expect(entries).toHaveLength(2);expectBalanced(entries);});
 it("balances an approved expense",()=>{const entries=buildExpenseLedgerEntries({reference:"TGO_EXP_1",expenseId:"507f1f77bcf86cd799439015",amountMinor:10000,currency:"NGN"},postedAt);expect(entries).toHaveLength(2);expectBalanced(entries);});
 it("balances an account-credit issuance",()=>{const entries=buildCreditAdjustmentEntries({reference:"TGO_CREDIT_1",clientId:"507f1f77bcf86cd799439013",amountMinor:10000,currency:"NGN",reason:"Approved goodwill credit"},postedAt);expect(entries).toHaveLength(2);expectBalanced(entries);});
 it("rejects zero, negative and non-integer minor-unit amounts",()=>{expect(()=>buildPaymentLedgerEntries({reference:"x",paymentTransactionId:"p",orderId:"o",clientId:"c",amountMinor:0,currency:"NGN"})).toThrow();expect(()=>buildPaymentLedgerEntries({reference:"x",paymentTransactionId:"p",orderId:"o",clientId:"c",amountMinor:-1,currency:"NGN"})).toThrow();expect(()=>buildPaymentLedgerEntries({reference:"x",paymentTransactionId:"p",orderId:"o",clientId:"c",amountMinor:1.2,currency:"NGN"})).toThrow();});
});
