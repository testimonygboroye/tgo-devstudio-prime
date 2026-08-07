import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Role from "@/models/Role";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { unauthorizedResponse, forbiddenResponse, requireCanManageUsers } from "@/lib/auth/authorize";
import { hashPassword } from "@/lib/auth/passwords";

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireCanManageUsers(session)) {
    return forbiddenResponse("Only roles with user-management permission can view users.");
  }

  await connectToDatabase();
  const users = await User.find().select("-passwordHash -twoFactorSecret -twoFactorTempSecret").populate("role", "name slug");

  return NextResponse.json({ status: "ok", users });
}

export async function POST(request: NextRequest) {
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return unauthorizedResponse();
  }

  if (!requireCanManageUsers(session)) {
    return forbiddenResponse("Only roles with user-management permission can create users.");
  }

  const body = await request.json();
  const { name, email, password, roleId } = body as {
    name?: string;
    email?: string;
    password?: string;
    roleId?: string;
  };

  if (!name || !email || !password || !roleId) {
    return NextResponse.json(
      { status: "error", message: "name, email, password, and roleId are all required." },
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

  await connectToDatabase();

  const targetRole = await Role.findById(roleId);
  if (!targetRole) {
    return NextResponse.json({ status: "error", message: "Role not found." }, { status: 404 });
  }

  if (targetRole.isFounderRole) {
    return forbiddenResponse("Cannot assign the Founder role through this endpoint.");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return NextResponse.json(
      { status: "error", message: "A user with this email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);

  const newUser = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: targetRole._id,
  });

  return NextResponse.json(
    {
      status: "ok",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: targetRole.name,
      },
    },
    { status: 201 }
  );
}
