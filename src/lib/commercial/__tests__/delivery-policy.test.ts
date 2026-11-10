import {evaluateDeliveryRelease} from "../delivery-policy";
const base={deliverableStatus:"approved",hasMilestone:true,hasPassedQa:true,clientApproved:true,milestonePaymentStatus:"paid",milestoneClientApprovalStatus:"approved"};
describe("progressive delivery release gates",()=>{
 it("allows release only when QA, payment and client approval are satisfied",()=>expect(evaluateDeliveryRelease(base)).toEqual({allowed:true,reason:null}));
 it("blocks release before QA",()=>expect(evaluateDeliveryRelease({...base,hasPassedQa:false}).allowed).toBe(false));
 it("blocks release before client approval",()=>expect(evaluateDeliveryRelease({...base,clientApproved:false}).allowed).toBe(false));
 it("blocks release when payment is not verified",()=>expect(evaluateDeliveryRelease({...base,milestonePaymentStatus:"unconfigured"}).reason).toMatch(/payment has not been verified/i));
 it("allows a zero-value milestone without payment",()=>expect(evaluateDeliveryRelease({...base,milestonePaymentStatus:"not_required",milestoneClientApprovalStatus:"not_required"}).allowed).toBe(true));
 it("requires milestone assignment",()=>expect(evaluateDeliveryRelease({...base,hasMilestone:false}).allowed).toBe(false));
});
