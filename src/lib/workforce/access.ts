import { getServerSession } from "@/lib/auth/serverSession";
import { connectToDatabase } from "@/lib/db";
import EmployeeProfile from "@/models/EmployeeProfile";
import BusinessMembership from "@/models/BusinessMembership";
export async function getActiveEmployeeContext() {
 const session=await getServerSession();
 if(!session||session.user.accountType==="client"||session.user.isBanned)return null;
 await connectToDatabase();
 const employee=await EmployeeProfile.findOne({userId:session.user._id,employmentStatus:{$in:["active","onboarding","on_leave"]}}).lean();
 if(!employee)return null;
 const membership=await BusinessMembership.findOne({userId:session.user._id,status:"active"}).populate("roleIds").lean();
 return {session,employee,membership};
}
export async function isWorkforceFounder(){const session=await getServerSession();return Boolean(session?.role?.isFounderRole);}
