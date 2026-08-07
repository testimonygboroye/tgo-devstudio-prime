export function getAdminBasePath(): string {
  const adminPath = process.env.ADMIN_PATH;

  if (!adminPath) {
    throw new Error("Missing ADMIN_PATH environment variable.");
  }

  return adminPath.startsWith("/") ? adminPath : `/${adminPath}`;
}
