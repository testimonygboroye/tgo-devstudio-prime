export type ReviewTargetType =
  | "general"
  | "brand"
  | "siteExperience"
  | "caseStudy"
  | "teamMember"
  | "blogPost"
  | "jobOpening"
  | "review"
  | "custom";

export const REVIEW_TARGET_TYPES: ReviewTargetType[] = [
  "general",
  "brand",
  "siteExperience",
  "caseStudy",
  "teamMember",
  "blogPost",
  "jobOpening",
  "review",
  "custom",
];

export const REVIEW_TARGET_LABELS: Record<ReviewTargetType, string> = {
  general: "General Feedback",
  brand: "Our Brand",
  siteExperience: "This Website (Design/Usability)",
  caseStudy: "A Case Study",
  teamMember: "A Team Member",
  blogPost: "A Blog Post",
  jobOpening: "A Job Opening",
  review: "Another Review",
  custom: "Something Else (Describe Below)",
};

export const REVIEW_TARGET_MODEL: Record<ReviewTargetType, string | null> = {
  general: null,
  brand: null,
  siteExperience: null,
  caseStudy: "Project",
  teamMember: "TeamMember",
  blogPost: "BlogPost",
  jobOpening: "JobOpening",
  review: "Review",
  custom: null,
};

export function targetRequiresId(type: ReviewTargetType): boolean {
  return REVIEW_TARGET_MODEL[type] !== null;
}

export function targetRequiresCustomLabel(type: ReviewTargetType): boolean {
  return type === "custom";
}
