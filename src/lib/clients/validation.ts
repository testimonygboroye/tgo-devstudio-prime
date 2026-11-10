export interface ClientRegistrationInput { name?: unknown; email?: unknown; password?: unknown }
export type ClientRegistrationResult =
  | { ok: true; value: { name: string; email: string; password: string } }
  | { ok: false; error: string };

export function validateClientRegistration(input: ClientRegistrationInput): ClientRegistrationResult {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (name.length < 2 || name.length > 120) return { ok: false, error: "Enter your name (2–120 characters)." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return { ok: false, error: "Enter a valid email address." };
  if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return { ok: false, error: "Use 12–72 UTF-8 bytes with uppercase, lowercase and a number." };
  }
  return { ok: true, value: { name, email, password } };
}
