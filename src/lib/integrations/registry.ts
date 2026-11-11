export type CredentialField = { key: string; label: string; hint: string };
export type IntegrationProvider = {
  id: string; name: string; category: "email" | "payments" | "analytics" | "search" | "development" | "sms";
  description: string; fields: CredentialField[]; testable: boolean; testLabel: string;
};
export const INTEGRATION_REGISTRY: IntegrationProvider[] = [
  { id: "brevo", name: "Brevo", category: "email", description: "Transactional email and campaign delivery. Existing application email helpers can use the same provider credentials once configured.", fields: [{ key: "apiKey", label: "API key", hint: "Brevo v3 API key" }], testable: true, testLabel: "Verify account access" },
  { id: "paystack", name: "Paystack", category: "payments", description: "Payment initialization, verification, refunds and webhook reconciliation. The existing Paystack payment module remains the transaction source of truth.", fields: [{ key: "secretKey", label: "Secret key", hint: "Secret key; never use a public key here" }], testable: true, testLabel: "Verify balance access" },
  { id: "github", name: "GitHub", category: "development", description: "Repository and release metadata for deployment operations.", fields: [{ key: "token", label: "Personal access token", hint: "Fine-grained token with only required repository read permissions" }], testable: true, testLabel: "Verify token identity" },
  { id: "vercel", name: "Vercel", category: "development", description: "Deployment and project metadata. Deployment actions should be separately permissioned.", fields: [{ key: "token", label: "Access token", hint: "Vercel token scoped to the required team and projects" }], testable: true, testLabel: "Verify token identity" },
  { id: "twilio", name: "Twilio", category: "sms", description: "SMS provider account connection. Sending remains disabled until sender identity, consent and delivery callbacks are configured.", fields: [{ key: "accountSid", label: "Account SID", hint: "AC… account identifier" }, { key: "authToken", label: "Auth token", hint: "Twilio account auth token" }], testable: true, testLabel: "Verify account access" },
  { id: "google_search_console", name: "Google Search Console", category: "search", description: "OAuth-based property and search performance access. Requires a Google OAuth flow; credentials are not accepted in this form.", fields: [], testable: false, testLabel: "OAuth setup required" },
  { id: "google_analytics", name: "Google Analytics 4", category: "analytics", description: "GA4 reporting integration. Requires a Google OAuth/service-account flow and explicit property selection.", fields: [], testable: false, testLabel: "OAuth setup required" },
];
export function getIntegrationProvider(id: string) { return INTEGRATION_REGISTRY.find((item) => item.id === id); }
