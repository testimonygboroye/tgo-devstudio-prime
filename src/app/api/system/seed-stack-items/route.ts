import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import StackItem from "@/models/StackItem";
import User from "@/models/User";

const DEFAULT_STACK_ITEMS = [
  {
    category: "Framework",
    title: "Next.js",
    description:
      "Chosen specifically for server-side rendering and static generation, which directly support fast page loads and strong SEO for a public-facing site.",
    displayOrder: 0,
  },
  {
    category: "Database",
    title: "MongoDB Atlas",
    description:
      "A flexible, document-based database well suited to a content-heavy site with evolving data shapes across case studies, blog posts, and more.",
    displayOrder: 0,
  },
  {
    category: "Media & Assets",
    title: "Cloudinary",
    description: "Handles all image, resume, and document uploads with automatic optimization and delivery.",
    displayOrder: 0,
  },
  {
    category: "Email",
    title: "Brevo",
    description: "Powers every transactional email on the site, from contact confirmations to admin notifications.",
    displayOrder: 0,
  },
  {
    category: "Security",
    title: "Cloudflare Turnstile",
    description:
      "Protects every public form from bots without forcing visitors through annoying puzzle challenges.",
    displayOrder: 0,
  },
  {
    category: "Hosting",
    title: "Render",
    description: "Auto-deploys directly from GitHub on every push, keeping the path from code to production simple and fast.",
    displayOrder: 0,
  },
  {
    category: "Version Control",
    title: "GitHub",
    description: "Every change to this site is tracked, reviewed, and deployed from a single source of truth.",
    displayOrder: 0,
  },
];

export async function GET(request: NextRequest) {
  const providedSecret = request.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ status: "error", message: "Unauthorized." }, { status: 401 });
  }

  await connectToDatabase();

  const existingCount = await StackItem.countDocuments();
  if (existingCount > 0) {
    return NextResponse.json({
      status: "ok",
      message: `Skipped — ${existingCount} stack items already exist.`,
    });
  }

  const founder = await User.findOne().sort({ createdAt: 1 });
  if (!founder) {
    return NextResponse.json({ status: "error", message: "No users found to assign as creator." }, { status: 500 });
  }

  const items = await StackItem.insertMany(
    DEFAULT_STACK_ITEMS.map((item) => ({
      ...item,
      publishStatus: "published",
      createdBy: founder._id,
    }))
  );

  return NextResponse.json({ status: "ok", message: `Seeded ${items.length} stack items.` });
}
