export const TEXT_LIMITS = {
  team: {
    name: 100,
    jobTitle: 100,
    bio: 400,
  },
  project: {
    title: 120,
    summary: 250,
    narrativeSection: 1500,
  },
  blog: {
    title: 150,
    excerpt: 300,
    contentHtml: 50000,
  },
} as const;
