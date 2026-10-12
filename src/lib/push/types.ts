export type AdminPushCategory =
  | "messages"
  | "applications"
  | "contact"
  | "reviews"
  | "audit"
  | "analytics"
  | "system";

export interface AdminPushNotification {
  title: string;
  body: string;
  url: string;
  category: AdminPushCategory;
  tag?: string;
}
