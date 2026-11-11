import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Invite from "@/models/Invite";
import User from "@/models/User";
import EmployeeProfile from "@/models/EmployeeProfile";
import Department from "@/models/Department";
import Position from "@/models/Position";
import BusinessMembership from "@/models/BusinessMembership";
import { hashToken } from "@/lib/auth/tokens";
import { hashPassword } from "@/lib/auth/passwords";
import { writePlatformAuditEvent } from "@/lib/platform/audit";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ status: "error", message: "Invalid request body." }, { status: 400 });
  }
  const token = typeof body.token === "string" ? body.token : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";
  if (!token || !name || !password || !confirmPassword) return NextResponse.json({ status: "error", message: "All fields are required." }, { status: 400 });
  if (name.length > 120) return NextResponse.json({ status: "error", message: "Name must be 120 characters or fewer." }, { status: 400 });
  if (password !== confirmPassword) return NextResponse.json({ status: "error", message: "Passwords do not match." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ status: "error", message: "Password must be at least 8 characters." }, { status: 400 });

  await connectToDatabase();
  const invite = await Invite.findOne({ tokenHash: hashToken(token) });
  if (!invite) return NextResponse.json({ status: "error", message: "Invite not found or invalid." }, { status: 404 });
  if (invite.approvalStatus !== "approved") return NextResponse.json({ status: "error", message: "This invite has not been approved yet." }, { status: 403 });
  if (invite.usedAt) return NextResponse.json({ status: "error", message: "This invite has already been used." }, { status: 410 });
  if (invite.expiresAt.getTime() < Date.now()) return NextResponse.json({ status: "error", message: "This invite has expired." }, { status: 410 });
  if (await User.exists({ email: invite.email, accountType: { $ne: "client" } })) return NextResponse.json({ status: "error", message: "An account with this email already exists." }, { status: 409 });

  const claimed = await Invite.findOneAndUpdate(
    { _id: invite._id, usedAt: { $exists: false }, approvalStatus: "approved", expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
    { new: true }
  );
  if (!claimed) return NextResponse.json({ status: "error", message: "This invitation has already been claimed or has expired." }, { status: 409 });

  let createdUserId = "";
  try {
    const user = await User.create({
      name,
      email: invite.email,
      passwordHash: await hashPassword(password),
      role: invite.role,
      accountType: "staff",
    });
    createdUserId = String(user._id);

    if (invite.recruitmentApplicationId && invite.onboardingDepartmentId && invite.onboardingPositionId) {
      const department = await Department.findOne({ _id: invite.onboardingDepartmentId, status: "active" });
      const position = await Position.findOne({ _id: invite.onboardingPositionId, departmentId: invite.onboardingDepartmentId, status: "active" });
      if (!department || !position) throw new Error("The hiring department or position is no longer active.");
      const employeeCode = "TGO-" + new Date().getFullYear() + "-" + String(Date.now()).slice(-6);
      const profile = await EmployeeProfile.create({
        userId: user._id,
        employeeCode,
        departmentId: department._id,
        positionId: position._id,
        employmentType: invite.onboardingEmploymentType || "full_time",
        employmentStatus: "onboarding",
        startDate: invite.onboardingStartDate || new Date(),
        timezone: "Africa/Lagos",
        workLocation: invite.onboardingWorkLocation || "remote",
        createdBy: invite.invitedBy,
        onboardingChecklist: [
          { key: "profile", label: "Complete employee profile" },
          { key: "security", label: "Review account security" },
          { key: "policies", label: "Acknowledge company policies" },
          { key: "orientation", label: "Complete company orientation" },
        ],
      });
      await BusinessMembership.findOneAndUpdate(
        { userId: user._id },
        { $set: { departmentIds: [String(department._id)], teamIds: [], status: "active" } },
        { upsert: true, setDefaultsOnInsert: true }
      );
      await writePlatformAuditEvent({
        actorType: "system",
        actorId: String(user._id),
        actorLabel: name,
        action: "recruitment.employee_onboarding_created",
        module: "recruitment",
        targetType: "employee",
        targetId: String(profile._id),
        outcome: "success",
        metadata: { applicationId: String(invite.recruitmentApplicationId), departmentId: String(department._id), positionId: String(position._id) },
      });
    }

    return NextResponse.json({ status: "ok", message: invite.recruitmentApplicationId ? "Staff account created and employee onboarding profile started. You can now log in." : "Account created. You can now log in." }, { status: 201 });
  } catch (error) {
    if (createdUserId) {
      await EmployeeProfile.deleteOne({ userId: createdUserId });
      await BusinessMembership.deleteOne({ userId: createdUserId });
      await User.deleteOne({ _id: createdUserId });
    }
    await Invite.updateOne({ _id: invite._id }, { $unset: { usedAt: 1 } });
    console.error("[signup-via-invite] account creation failed", error);
    return NextResponse.json({ status: "error", message: error instanceof Error ? error.message : "Could not create the invited account." }, { status: 500 });
  }
}
