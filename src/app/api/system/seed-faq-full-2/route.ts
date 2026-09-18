import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Role from "@/models/Role";
import FaqItem from "@/models/FaqItem";

const faqs = [
  { category: "Pricing & Payment", question: "How much does a project with TGO DevStudio cost?", answer: "Cost depends entirely on the scope, complexity, and features of your specific project. We provide a clear estimate after understanding your actual requirements during an initial conversation." },
  { category: "Pricing & Payment", question: "Do you require payment upfront?", answer: "Payment structure is discussed and agreed upon before work begins, often involving a deposit followed by milestone or completion payments, depending on the project." },
  { category: "Pricing & Payment", question: "What payment methods do you accept?", answer: "We can discuss the most convenient payment method for your specific situation during our initial conversation." },
  { category: "Pricing & Payment", question: "Are there any hidden costs I should know about?", answer: "We aim for full transparency. Any potential additional costs, such as third-party service fees, are discussed clearly upfront, not hidden or discovered later." },
  { category: "Pricing & Payment", question: "Do you offer refunds?", answer: "Refund terms depend on the specific agreement made for your project and the stage of work completed, and are discussed clearly before work begins." },
  { category: "Process", question: "What does your development process actually look like?", answer: "Our process moves through discovery, planning, design, development, testing, launch, and ongoing support. You can see the full breakdown on our Process page." },
  { category: "Process", question: "Will I be able to see progress while the project is being built?", answer: "Yes, we believe in transparent communication throughout a project, with regular updates and opportunities for your feedback along the way." },
  { category: "Process", question: "How involved do I need to be during the project?", answer: "Your involvement is most critical early on, during discovery and review stages. We handle the technical execution, but your feedback at key checkpoints genuinely shapes the outcome." },
  { category: "Process", question: "What happens if I want to change something mid-project?", answer: "Reasonable changes and refinements are a normal part of most projects. Significant scope changes are discussed openly regarding their impact on timeline and cost." },
  { category: "Process", question: "Do you provide documentation after a project is finished?", answer: "Yes, we provide clear documentation explaining how your finished system works, so you and your team genuinely understand what you now own." },
  { category: "Technical", question: "Can you build a mobile app, not just a website?", answer: "Yes, mobile app development is one of our listed services. Reach out to discuss your specific needs." },
  { category: "Technical", question: "Do you build e-commerce websites?", answer: "Yes, e-commerce solutions are one of our core services, including product listings, secure checkout, and payment processing." },
  { category: "Technical", question: "Can you integrate my website with other software I already use?", answer: "Yes, third-party integrations are a core part of what we do, connecting your platform to the other tools your business relies on." },
  { category: "Technical", question: "Will my website work well on mobile phones?", answer: "Yes, every project we build is designed to work properly across phones, tablets, and desktops from the start, not as an afterthought." },
  { category: "Technical", question: "How do you handle website security?", answer: "Security is treated as a core requirement from the start of every project, not an optional extra. This includes encrypted passwords, secure data handling, and protection against common attacks." },
  { category: "Technical", question: "What happens if my website goes down after launch?", answer: "We offer maintenance and monitoring arrangements specifically to catch and resolve this kind of issue quickly, minimizing real impact on your business." },
  { category: "Technical", question: "Can you migrate my existing website to a new platform?", answer: "Yes, we handle content and system migrations, carefully moving your existing website's content and functionality to new, modern infrastructure." },
  { category: "Technical", question: "Do you build custom admin dashboards?", answer: "Yes, custom admin dashboards and content management systems are one of our specialties, giving you real control over your own platform." },
  { category: "Technical", question: "Can you help improve my website's search engine ranking?", answer: "Yes, we build with SEO best practices in mind from the start, and can also review and improve an existing site's SEO." },
  { category: "Technical", question: "Do you offer website speed and performance improvements?", answer: "Yes, performance optimization is one of our core services, whether for a new build or an existing slow website." },
  { category: "Support", question: "What kind of ongoing support do you offer after launch?", answer: "We offer maintenance arrangements covering updates, bug fixes, monitoring, and continued improvements based on your business's evolving needs." },
  { category: "Support", question: "How quickly do you respond to support requests?", answer: "Response times depend on the specific support arrangement in place, which is discussed and agreed upon as part of any ongoing support agreement." },
  { category: "Support", question: "What if something breaks on my site outside of business hours?", answer: "This depends on your specific support arrangement. Discuss urgent-response needs with us directly when setting up ongoing support." },
  { category: "Support", question: "Can I request new features after my project is finished?", answer: "Yes, we regularly continue working with clients on new features and improvements well after initial launch." },
  { category: "Communication", question: "How do I communicate with the team during a project?", answer: "We use clear, direct communication channels agreed upon at the start of a project, which may include email, calls, or messaging platforms depending on your preference." },
  { category: "Communication", question: "Who will I actually be working with?", answer: "You'll have clear points of contact throughout your project, discussed and confirmed at the outset." },
  { category: "Communication", question: "How often will I hear updates on my project's progress?", answer: "Update frequency is agreed upon at the start of a project, ensuring you're never left wondering about progress." },
  { category: "About This Site", question: "Is this website itself an example of your work?", answer: "Yes. TGO DevStudio Prime, the very site you're browsing, is itself a real, live example of our engineering and design work." },
  { category: "About This Site", question: "Can I see other examples of your work?", answer: "Yes, visit our Portfolio page for real case studies of projects we've built." },
  { category: "About This Site", question: "Do you have client testimonials I can read?", answer: "Yes, visit our Testimonials page to read real feedback from people we've worked with." },
  { category: "Legal", question: "Who owns the intellectual property of a project you build for me?", answer: "Once a project is completed and fully paid for, you own the resulting work, as detailed in our project agreements." },
  { category: "Legal", question: "Do you sign non-disclosure agreements (NDAs)?", answer: "Yes, we're open to signing reasonable confidentiality agreements when a project's nature calls for it." },
  { category: "Legal", question: "What happens to my data if I stop working with TGO DevStudio?", answer: "Your data and any deliverables you've paid for remain yours. Specific data handling upon project end is discussed as part of our agreement." },
  { category: "Getting Started", question: "I'm not sure exactly what I need — can you still help?", answer: "Yes, absolutely. Many clients start with just a rough idea. Our discovery process is specifically designed to help clarify exactly what you actually need." },
  { category: "Getting Started", question: "Do I need to have my branding and content ready before we start?", answer: "It helps, but it's not required. We can guide you through figuring out branding and content needs as part of the process if you don't have them ready yet." },
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
    await FaqItem.create({ ...faqs[i], displayOrder: i + 100, publishStatus: "published", createdBy: founder._id });
    created++;
  }

  return NextResponse.json({ status: "ok", created, skipped });
}
