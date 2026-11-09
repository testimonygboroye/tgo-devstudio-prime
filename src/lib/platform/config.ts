export type PlatformEnvironment = "development" | "preview" | "production" | "test";

export interface PlatformRuntimeConfig {
  environment: PlatformEnvironment;
  enabled: boolean;
  auditEnabled: boolean;
}

function resolveEnvironment(): PlatformEnvironment {
  const value = process.env.VERCEL_ENV || process.env.NODE_ENV;
  if (value === "production" || value === "preview" || value === "test") return value;
  return "development";
}

export function getPlatformRuntimeConfig(): PlatformRuntimeConfig {
  return {
    environment: resolveEnvironment(),
    enabled: process.env.TGO_BUSINESS_PLATFORM_ENABLED === "true",
    auditEnabled: process.env.TGO_PLATFORM_AUDIT_ENABLED !== "false",
  };
}
