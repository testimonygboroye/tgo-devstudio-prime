import {buildPaymentLedgerEntries} from "../ledger";
describe("payment double-entry ledger",()=>{
 it("posts balanced debit and credit entries with the same immutable source",()=>{
  const entries=buildPaymentLedgerEntries({reference:"TGO_123",paymentTransactionId:"pay1",orderId:"order1",clientId:"client1",amountMinor:250000,currency:"NGN",providerTransactionId:"ps_123"},new Date("2026-01-01T00:00:00Z"));
  expect(entries).toHaveLength(2);expect(entries[0].direction).toBe("debit");expect(entries[1].direction).toBe("credit");expect(entries[0].amountMinor).toBe(entries[1].amountMinor);expect(entries[0].currency).toBe(entries[1].currency);expect(entries[0].entryKey).not.toBe(entries[1].entryKey);expect(entries.every(x=>x.sourceReference==="TGO_123")).toBe(true);
 });
 it("rejects a zero or negative amount",()=>{expect(()=>buildPaymentLedgerEntries({reference:"TGO_456",paymentTransactionId:"pay2",orderId:"order1",clientId:"client1",amountMinor:0,currency:"NGN"})).toThrow("positive integer");});
});
