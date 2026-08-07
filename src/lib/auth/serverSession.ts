import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db";
import User, { IUser } from "@/models/User";
import Role, { IRole } from "@/models/Role";
import { verifyAccessToken } from "@/lib/auth/jwt";

export interface ServerSession {
  user: IUser;
  role: IRole;
}

export async function getServerSession(): Promise<ServerSession | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return null;
  }

  let payload;
  try {
    payload = verifyAccessToken(accessToken);
  } catch {
    return null;
  }

  await connectToDatabase();

  const user = await User.findById(payload.userId);
  if (!user || user.refreshTokenVersion !== payload.tokenVersion) {
    return null;
  }

  const role = await Role.findById(user.role);
  if (!role) {
    return null;
  }

  return { user, role };
}
