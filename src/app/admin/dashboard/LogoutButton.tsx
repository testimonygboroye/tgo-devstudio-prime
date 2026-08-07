"use client";

export default function LogoutButton() {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    const loginPath = window.location.pathname.replace(/\/dashboard\/?$/, "/login");
    window.location.href = loginPath;
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-md border border-base-800 px-4 py-2 text-sm text-neutral-100 hover:bg-base-900"
    >
      Log out
    </button>
  );
}
