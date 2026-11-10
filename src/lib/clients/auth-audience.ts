export function canUseAuthenticationAudience(accountType: string | undefined, audience: string | undefined): boolean {
  if (audience === "client") return accountType === "client";
  if (accountType === "client") return false;
  return true;
}
