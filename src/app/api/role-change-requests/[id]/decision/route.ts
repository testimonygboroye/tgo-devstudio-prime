import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import RoleChangeRequest from "@/models/RoleChangeRequest";
import User from "@/models/User";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse } from "@/lib/auth/authorize";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedSession(request);
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  const body = await request.json();
  const { decision } = body as { decision?: "accept" | "reject" };

  if (decision !== "accept" && decision !== "reject") {
    return NextResponse.json({ status: "error", message: "Invalid decision." }, { status: 400 });
  }

  await connectToDatabase();

  const changeRequest = await RoleChangeRequest.findById(id);
  if (!changeRequest) {
    return NextResponse.json({ status: "error", message: "Request not found." }, { status: 404 });
  }
  if (changeRequest.user.toString() !== session.user._id.toString()) {
    return forbiddenResponse("This request is not addressed to you.");
  }
  if (changeRequest.status !== "pending") {
    return NextResponse.json({ status: "error", message: "This request has already been decided." }, { status: 400 });
  }

  changeRequest.status = decision === "accept" ? "accepted" : "rejected";
  changeRequest.decidedAt = new Date();
  await changeRequest.save();

  if (decision === "accept") {
    const user = await User.findById(changeRequest.user);
    if (user) {
      user.role = changeRequest.requestedRole;
      await user.save();
    }
  }

  return NextResponse.json({ status: "ok", message: `Request ${decision}ed.` });
}
