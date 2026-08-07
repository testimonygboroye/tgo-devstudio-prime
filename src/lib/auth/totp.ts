import { authenticator } from "otplib";
import QRCode from "qrcode";

const TOTP_ISSUER = "TGO DevStudio Prime";

export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

export function verifyTotpToken(token: string, secret: string): boolean {
  return authenticator.verify({ token, secret });
}

export async function generateTotpQrCodeDataUrl(
  email: string,
  secret: string
): Promise<string> {
  const otpauthUrl = authenticator.keyuri(email, TOTP_ISSUER, secret);
  return QRCode.toDataURL(otpauthUrl);
}
