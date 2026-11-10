import type { NextRequest, NextResponse } from "next/server";

const MAX_REMEMBERED_ACCOUNTS = 1;

export function readRememberedClientAccounts(value?: string): string[] {
  if (!value) return [];
  try {
    let parsed: unknown;
    try { parsed = JSON.parse(value); } catch { parsed = JSON.parse(decodeURIComponent(value)); }
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((item): item is string =>
      typeof item === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item)
    ).map(item => item.toLowerCase()))].slice(0, MAX_REMEMBERED_ACCOUNTS);
  } catch {
    return [];
  }
}

export function rememberClientAccount(response: NextResponse, request: NextRequest, email: string) {
  const normalized = email.trim().toLowerCase();
  const accounts = [normalized].slice(0, MAX_REMEMBERED_ACCOUNTS);
  response.cookies.set("tgo_client_accounts", encodeURIComponent(JSON.stringify(accounts)), {
    path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax",
    secure: process.env.NODE_ENV === "production", httpOnly: false,
  });
  response.cookies.set("tgo_client_account", normalized, {
    path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax",
    secure: process.env.NODE_ENV === "production", httpOnly: false,
  });
}
