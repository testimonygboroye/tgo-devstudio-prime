import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import FaqItem from "@/models/FaqItem";
import User from "@/models/User";

const DEFAULT_FAQS = [
  {
    category: "General",
    question: "What does TGO DevStudio do?",
    answer: "TGO DevStudio is a full-stack software engineering studio building production-grade websites, apps, and platforms from first conversation to launch and beyond.",
  },
  {
    category: "General",
    question: "Who is behind TGO DevStudio?",
    answer: "TGO DevStudio is the engineering arm of TGO, a parent brand building a family of ventures. Learn more on our About page.",
  },
  {
    category: "Working Together",
    question: "How do I start a project with TGO DevStudio?",
    answer: "The easiest way is to book a discovery call or send a message through the Contact page. From there, we'll talk through your project and next steps.",
  },
  {
    category: "Working Together",
    question: "Do you take on projects of any size?",
    answer: "Yes — every project gets the same standard of care and craftsmanship, regardless of size or budget.",
  },
  {
    category: "Careers",
    question: "How do I apply for a role?",
    answer: "Visit the Careers page to see current openings. If nothing's open right now, check back — we're always building our team.",
  },
];

export async function GET(request: NextRequest) {
  const providedSecret = request.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ status: "error", message: "Unauthorized." }, { status: 401 });
  }

  await connectToDatabase();

  const existingCount = await FaqItem.countDocuments();
  if (existingCount > 0) {
    return NextResponse.json({ status: "ok", message: `Skipped — ${existingCount} FAQ items already exist.` });
  }

  const founder = await User.findOne().sort({ createdAt: 1 });
  if (!founder) {
    return NextResponse.json({ status: "error", message: "No users found to assign as creator." }, { status: 500 });
  }

  const items = await FaqItem.insertMany(
    DEFAULT_FAQS.map((faq, index) => ({
      ...faq,
      displayOrder: index,
      publishStatus: "published",
      createdBy: founder._id,
    }))
  );

  return NextResponse.json({ status: "ok", message: `Seeded ${items.length} FAQ items.` });
}
