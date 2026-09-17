import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Role from "@/models/Role";
import StackItem from "@/models/StackItem";

const stackItems = [
  { category: "Frontend", title: "Next.js", description: "The core framework powering this site's pages, chosen for its server-side rendering, which directly supports fast load times and strong SEO." },
  { category: "Frontend", title: "React", description: "The underlying library Next.js is built on, used for building interactive, component-based user interfaces." },
  { category: "Frontend", title: "TypeScript", description: "Adds strict type-checking to our code, catching a real class of bugs before they ever reach production." },
  { category: "Frontend", title: "Tailwind CSS", description: "A utility-first styling approach that keeps our design system consistent and our styling code maintainable as the site grows." },
  { category: "Frontend", title: "Tiptap", description: "Powers the rich-text editor used throughout the admin panel for writing blog posts and help articles." },
  { category: "Backend", title: "Node.js", description: "The JavaScript runtime powering our server-side logic, chosen for its strong ecosystem and consistency with our frontend language." },
  { category: "Backend", title: "MongoDB Atlas", description: "Our database service, chosen for its flexibility with evolving data structures as the platform's features grow." },
  { category: "Backend", title: "Mongoose", description: "The library we use to interact with MongoDB in a structured, validated way from our Node.js code." },
  { category: "Authentication & Security", title: "JWT (JSON Web Tokens)", description: "Used to securely manage login sessions, with separate access and refresh tokens for improved security." },
  { category: "Authentication & Security", title: "bcrypt", description: "Used to securely hash passwords, so real passwords are never stored in readable form, even internally." },
  { category: "Authentication & Security", title: "TOTP Two-Factor Authentication", description: "Adds an optional extra layer of login security using time-based codes from an authenticator app." },
  { category: "Authentication & Security", title: "Cloudflare Turnstile", description: "Protects our public forms from automated spam and bot abuse without frustrating real human visitors." },
  { category: "Infrastructure", title: "Render", description: "Our primary hosting provider, running both the website and its backend logic on a genuinely free tier." },
  { category: "Infrastructure", title: "Vercel", description: "An additional hosting deployment of this same project, built by the same team behind Next.js itself." },
  { category: "Infrastructure", title: "Cloudinary", description: "Handles storage and delivery of all uploaded images and files across the site, including automatic optimization." },
  { category: "Infrastructure", title: "Brevo", description: "Powers our transactional email system — contact form notifications, newsletter delivery, and account-related emails." },
  { category: "Infrastructure", title: "GitHub", description: "Hosts our source code and version history, and triggers automatic deployments whenever new code is pushed." },
  { category: "Testing & Quality", title: "Jest", description: "Our automated testing framework, used to verify that core pieces of logic keep working correctly as the codebase grows." },
  { category: "Testing & Quality", title: "GitHub Actions", description: "Automatically checks that our code builds successfully on every push, catching mistakes before they reach production." },
];

export async function GET(request: NextRequest) {
  const providedSecret = request.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ status: "error", message: "Unauthorized." }, { status: 401 });
  }

  await connectToDatabase();
  const founderRole = await Role.findOne({ isFounderRole: true });
  const founder = founderRole ? await User.findOne({ role: founderRole._id }) : null;
  if (!founder) {
    return NextResponse.json({ status: "error", message: "No founder account found." }, { status: 500 });
  }

  let created = 0;
  let skipped = 0;

  for (let i = 0; i < stackItems.length; i++) {
    const existing = await StackItem.findOne({ title: stackItems[i].title });
    if (existing) {
      skipped++;
      continue;
    }
    await StackItem.create({ ...stackItems[i], displayOrder: i, publishStatus: "published", createdBy: founder._id });
    created++;
  }

  return NextResponse.json({ status: "ok", created, skipped });
}
