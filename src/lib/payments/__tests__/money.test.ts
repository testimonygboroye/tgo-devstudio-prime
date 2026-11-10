import {fromMinorUnits,toMinorUnits} from "../money";

describe("currency minor-unit conversion",()=>{
  it("converts two-decimal currencies without floating point drift",()=>{
    expect(toMinorUnits(1250.55,"NGN")).toBe(125055);
    expect(fromMinorUnits(125055,"NGN")).toBe(1250.55);
  });
  it("handles zero-decimal XOF values",()=>{
    expect(toMinorUnits(1250,"XOF")).toBe(125000);
    expect(fromMinorUnits(125000,"XOF")).toBe(1250);
  });
  it("rejects invalid or unsafe amounts",()=>{
    expect(()=>toMinorUnits(Number.NaN,"NGN")).toThrow();
    expect(()=>toMinorUnits(-1,"NGN")).toThrow();
    expect(()=>toMinorUnits(1.5,"XOF")).toThrow();
  });
});
