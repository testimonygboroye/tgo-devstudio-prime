import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Role from "@/models/Role";
import FaqItem from "@/models/FaqItem";

const faqs = [
  { category: "General", question: "What does TGO DevStudio do?", answer: "TGO DevStudio is a full-stack software engineering studio. We design, build, and maintain custom websites, web applications, and admin systems for businesses and individuals, handling everything from the visual design to the underlying technical infrastructure." },
  { category: "General", question: "Who is behind TGO DevStudio?", answer: "TGO DevStudio is the engineering arm of TGO, a parent brand building a family of ventures. You can learn more about the founder on our About page." },
  { category: "General", question: "Where is TGO DevStudio based?", answer: "TGO DevStudio is based in Akure, Ondo State, Nigeria, though we work with clients regardless of location." },
  { category: "General", question: "What industries do you work with?", answer: "We work across a wide range of industries. Our engineering approach is built around real, careful problem-solving, which applies regardless of what sector a business is in." },
  { category: "Working Together", question: "How do I start a project with TGO DevStudio?", answer: "The easiest way is to book a discovery call or send a message through our Contact page. From there, we'll talk through your project and figure out the right next steps together." },
  { category: "Working Together", question: "Do you take on projects of any size?", answer: "Yes. Every project gets the same standard of care and attention, regardless of its size or budget." },
  { category: "Working Together", question: "How long does a typical project take?", answer: "This depends entirely on the scope of what's being built. A simple website might take a few weeks, while a full custom platform can take several months. We give a realistic timeline estimate after understanding your actual requirements." },
  { category: "Working Together", question: "Do you offer fixed pricing or hourly billing?", answer: "We discuss the right pricing approach based on your specific project during the initial conversation, since different projects suit different arrangements." },
  { category: "Working Together", question: "Can you work with an existing codebase, or only build from scratch?", answer: "We can do both. We regularly take over, improve, and extend existing projects, not just build entirely new ones." },
  { category: "Working Together", question: "Do you sign contracts or agreements before starting work?", answer: "Yes, having clear, agreed expectations in writing before work begins is standard practice and protects both sides." },
  { category: "Technical", question: "What technologies does TGO DevStudio use?", answer: "We primarily build with Next.js, Node.js, and MongoDB, among other modern tools, choosing the right technology for each specific project's actual needs rather than a one-size-fits-all approach. You can see more detail on our Stack page." },
  { category: "Technical", question: "Will I own the code and website you build for me?", answer: "Yes. Once a project is completed and paid for, you own what was built for you." },
  { category: "Technical", question: "Can you help with an already-built website that has problems?", answer: "Yes, we take on maintenance, fixes, and improvements for existing websites and applications, not just new builds." },
  { category: "Technical", question: "Do you handle hosting and domain setup too?", answer: "Yes, we can handle the full technical setup, including hosting and domain configuration, as part of a project." },
  { category: "Technical", question: "What if I need ongoing support after launch?", answer: "We offer ongoing maintenance and support arrangements for clients who want continued help after their project goes live." },
  { category: "Careers", question: "How do I apply for a job at TGO DevStudio?", answer: "Visit our Careers page to see current openings. If nothing is open right now, check back later, or reach out directly if you believe you'd be a strong fit." },
  { category: "Careers", question: "Do you hire remote team members?", answer: "This depends on the specific role — check the listing details on our Careers page, which specifies whether a role is remote, onsite, or hybrid." },
  { category: "Careers", question: "Do you offer internships?", answer: "This depends on current openings. Check our Careers page for any active internship listings." },
  { category: "Site & Privacy", question: "How do you handle my personal information?", answer: "We take privacy seriously. Full details are available on our Privacy Policy page." },
  { category: "Site & Privacy", question: "Can I unsubscribe from your newsletter at any time?", answer: "Yes, every newsletter email includes an unsubscribe link that immediately removes you from future emails." },
  { category: "Site & Privacy", question: "Is this website accessible for people with disabilities?", answer: "We take accessibility seriously and continue improving it as the site grows. Full details are on our Accessibility Statement page." },
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

  for (let i = 0; i < faqs.length; i++) {
    const existing = await FaqItem.findOne({ question: faqs[i].question });
    if (existing) {
      skipped++;
      continue;
    }
    await FaqItem.create({ ...faqs[i], displayOrder: i, publishStatus: "published", createdBy: founder._id });
    created++;
  }

  return NextResponse.json({ status: "ok", created, skipped });
}
