import crypto from "crypto";
import bcrypt from "bcryptjs";

const BACKUP_CODE_COUNT = 6;
const SALT_ROUNDS = 10;

export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    const raw = crypto.randomBytes(5).toString("hex").toUpperCase();
    codes.push(`${raw.slice(0, 5)}-${raw.slice(5, 10)}`);
  }
  return codes;
}

export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map((c) => bcrypt.hash(c, SALT_ROUNDS)));
}

export async function verifyAndConsumeBackupCode(
  inputCode: string,
  hashes: string[]
): Promise<{ valid: boolean; remainingHashes: string[] }> {
  const normalized = inputCode.trim().toUpperCase();
  for (let i = 0; i < hashes.length; i++) {
    const match = await bcrypt.compare(normalized, hashes[i]);
    if (match) {
      const remaining = [...hashes];
      remaining.splice(i, 1);
      return { valid: true, remainingHashes: remaining };
    }
  }
  return { valid: false, remainingHashes: hashes };
}
