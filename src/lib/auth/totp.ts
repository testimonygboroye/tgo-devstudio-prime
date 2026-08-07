import { generateSecret, verify, generateURI } from "otplib";
import QRCode from "qrcode";

const TOTP_ISSUER = "TGO DevStudio Prime";

export function generateTotpSecret(): string {
  return generateSecret();
}

export async function verifyTotpToken(token: string, secret: string): Promise<boolean> {
  const result = await verify({ secret, token });
  return result.valid;
}

export async function generateTotpQrCodeDataUrl(
  email: string,
  secret: string
): Promise<string> {
  const otpauthUrl = generateURI({
    issuer: TOTP_ISSUER,
    label: email,
    secret,
  });
  return QRCode.toDataURL(otpauthUrl);
}
