import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Role from "@/models/Role";
import { hashPassword } from "@/lib/auth/passwords";

export async function POST(request: NextRequest) {
  const setupKey = request.headers.get("x-setup-key");

  if (!setupKey || setupKey !== process.env.SETUP_SECRET_KEY) {
    return NextResponse.json({ status: "error", message: "Unauthorized." }, { status: 401 });
  }

  await connectToDatabase();

  const existingFounderRole = await Role.findOne({ isFounderRole: true });
  if (existingFounderRole) {
    return NextResponse.json(
      {
        status: "error",
        message: "A Founder account already exists. This setup route is now disabled.",
      },
      { status: 409 }
    );
  }

  const body = await request.json();
  const { name, email, password } = body as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!name || !email || !password) {
    return NextResponse.json(
      { status: "error", message: "name, email, and password are all required." },
      { status: 400 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ status: "error", message: "Invalid email format." }, { status: 400 });
  }

  if (password.length < 12) {
    return NextResponse.json(
      { status: "error", message: "Password must be at least 12 characters long." },
      { status: 400 }
    );
  }

  const founderRole = await Role.create({
    name: "Founder / Super Admin",
    slug: "founder",
    isFounderRole: true,
    isSystemRole: true,
    canManageRoles: true,
    canManageUsers: true,
    requiresTwoFactor: true,
    analyticsPermissions: {
      viewOwnContentAnalytics: true,
      viewSiteWideAnalytics: true,
      viewFormSubmissionData: true,
    },
  });

  const passwordHash = await hashPassword(password);

  const founderUser = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: founderRole._id,
  });

  return NextResponse.json(
    {
      status: "ok",
      message: "Founder account created. You can now log in and set up 2FA.",
      userId: founderUser._id,
    },
    { status: 201 }
  );
}
