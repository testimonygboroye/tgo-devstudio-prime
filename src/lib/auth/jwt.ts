import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const TEMP_2FA_SECRET = process.env.JWT_TEMP_2FA_SECRET;

if (!ACCESS_SECRET || !REFRESH_SECRET || !TEMP_2FA_SECRET) {
  throw new Error(
    "Missing JWT secret environment variables. Set JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, and JWT_TEMP_2FA_SECRET in Render's Environment settings."
  );
}

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "30d";
const TEMP_2FA_TOKEN_EXPIRY = "5m";

export interface AccessTokenPayload {
  userId: string;
  roleId: string;
  tokenVersion: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
}

export interface Temp2FATokenPayload {
  userId: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET as string, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET as string, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

export function signTemp2FAToken(payload: Temp2FATokenPayload): string {
  return jwt.sign(payload, TEMP_2FA_SECRET as string, { expiresIn: TEMP_2FA_TOKEN_EXPIRY });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, ACCESS_SECRET as string) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, REFRESH_SECRET as string) as RefreshTokenPayload;
}

export function verifyTemp2FAToken(token: string): Temp2FATokenPayload {
  return jwt.verify(token, TEMP_2FA_SECRET as string) as Temp2FATokenPayload;
}
