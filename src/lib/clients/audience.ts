export type AuthenticationAudience = "client" | "staff";

export function getUserAudienceFilter(email: string, audience: AuthenticationAudience) {
  const normalizedEmail = email.trim().toLowerCase();
  return audience === "client"
    ? { email: normalizedEmail, accountType: "client" as const }
    : { email: normalizedEmail, accountType: { $ne: "client" as const } };
}
