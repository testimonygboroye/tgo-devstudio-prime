export function tierForLifetimePoints(points: number): "starter" | "silver" | "gold" | "platinum" {
  if (points >= 10000) return "platinum";
  if (points >= 5000) return "gold";
  if (points >= 1500) return "silver";
  return "starter";
}
export const ENGAGEMENT_ACTION_POINTS: Record<string, number> = {
  profile_completed: 100, first_project_completed: 500, invoice_paid: 100,
  review_submitted: 75, referral_qualified: 300, support_feedback: 25,
};
