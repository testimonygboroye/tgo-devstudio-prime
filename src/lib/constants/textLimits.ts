export const TEXT_LIMITS = {
  team: {
    name: 100,
    jobTitle: 100,
    bio: 800,
  },
  project: {
    title: 120,
    summary: 250,
    narrativeSection: 2000,
  },
  blog: {
    title: 150,
    excerpt: 300,
    contentHtml: 50000,
  },
  job: {
    title: 120,
    summary: 250,
    responsibilities: 2000,
    requirements: 2000,
  },
} as const;
