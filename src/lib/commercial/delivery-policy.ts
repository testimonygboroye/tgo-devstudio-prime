export type DeliveryReleaseCheck={
  deliverableStatus:string;
  hasMilestone:boolean;
  hasPassedQa:boolean;
  clientApproved:boolean;
  milestonePaymentStatus:string;
  milestoneClientApprovalStatus:string;
};
export function evaluateDeliveryRelease(input:DeliveryReleaseCheck):{allowed:true;reason:null}|{allowed:false;reason:string}{
 if(input.deliverableStatus!=="approved")return {allowed:false,reason:"The client has not approved this deliverable."};
 if(!input.hasMilestone)return {allowed:false,reason:"The deliverable must be assigned to a milestone."};
 if(!input.hasPassedQa)return {allowed:false,reason:"The deliverable has not passed quality assurance."};
 if(!input.clientApproved||!["approved","not_required"].includes(input.milestoneClientApprovalStatus))return {allowed:false,reason:"Required client approval is outstanding."};
 if(!["paid","not_required"].includes(input.milestonePaymentStatus))return {allowed:false,reason:"Payment has not been verified by a configured payment provider."};
 return {allowed:true,reason:null};
}
