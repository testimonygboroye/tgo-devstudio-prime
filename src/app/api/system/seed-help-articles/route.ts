import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import HelpArticle from "@/models/HelpArticle";
import User from "@/models/User";
import { slugify } from "@/lib/utils/slugify";

const DEFAULT_ARTICLES: {
  title: string;
  category: string;
  visibility: "public" | "preLogin" | "anyAuthenticated" | "permission";
  requiredContentType?: string;
  bodyHtml: string;
}[] = [
  {
    title: "Using the Media Library",
    category: "Admin",
    visibility: "anyAuthenticated",
    bodyHtml:
      "<p>The Media Library shows every file already uploaded to Cloudinary across the whole site \u2014 case study images, team photos, blog covers, resumes, and more \u2014 in one place. Filter by folder, copy a file.s URL, or delete files you know are no longer used.</p><p>Important: deleting a file here does not update any page still referencing it. If you delete an image still used by a team member or case study, that image will simply stop showing. Only delete files you are certain are unused.</p>",
  },
  {
    title: "Using Your Messages Page",
    category: "Getting Started",
    visibility: "anyAuthenticated",
    bodyHtml:
      "<p>Your Messages page shows notifications addressed specifically to you \u2014 role changes offered to you, account status changes, and similar personal notices. It never shows general site activity like reviews or job applications; those live in their own dedicated admin sections.</p><p>Filter by New, Unread, Read, or Archived. You can mark a message back to unread at any time, or archive it to move it out of your main view without deleting it.</p>",
  },
  {
    title: "Logging In to the Admin Panel",
    category: "Getting Started",
    visibility: "preLogin",
    bodyHtml:
      "<p>Enter your email and password on the login page. If your role requires two-factor authentication, you'll be asked for a 6-digit code from your authenticator app after your password is accepted.</p><p>There is currently no self-service password recovery — if you lose access, contact the Founder directly for a manual reset.</p>",
  },
  {
    title: "Understanding the Admin Dashboard",
    category: "Getting Started",
    visibility: "anyAuthenticated",
    bodyHtml:
      "<p>The Dashboard shows your account details and, if your role has permission to manage roles, a full list of every role in the system with their permission summary. If you don't have that permission, you'll only see your own role name.</p>",
  },
  {
    title: "Managing Case Studies",
    category: "Content",
    visibility: "permission",
    requiredContentType: "caseStudies",
    bodyHtml:
      "<p>Case Studies showcase completed projects. Each one has a title, summary, problem/approach/outcome narrative, images, tags, and a status (Live, In Progress, etc.). Mark a case study as <strong>Featured</strong> to have it appear on the homepage automatically.</p><p>Only published case studies are visible to the public; drafts are admin-only.</p>",
  },
  {
    title: "Managing Team Members",
    category: "Content",
    visibility: "permission",
    requiredContentType: "team",
    bodyHtml:
      "<p>Add team members with a name, job title, bio, photo, and optional social links. Use Display Order to control the order they appear in on the public Team page. Mark a member as <strong>Featured</strong> to prioritize them in the homepage's team preview.</p>",
  },
  {
    title: "Managing Blog Posts",
    category: "Content",
    visibility: "permission",
    requiredContentType: "blogPosts",
    bodyHtml:
      "<p>Blog posts support Draft, Scheduled, and Published states. Scheduled posts automatically become visible once their publish date arrives — no manual action needed. Use the rich text editor for formatting, images, tables, and code blocks. Mark a post as <strong>Featured</strong> to prioritize it on the homepage.</p>",
  },
  {
    title: "Managing Careers & Job Openings",
    category: "Content",
    visibility: "permission",
    requiredContentType: "jobOpenings",
    bodyHtml:
      "<p>Create job openings with a title, summary, responsibilities, and requirements. Only published openings accept applications from the public careers page. If there are no open roles, the careers page gracefully shows a 'no roles right now' message instead of an empty page.</p>",
  },
  {
    title: "Reviewing Job Applications",
    category: "Content",
    visibility: "permission",
    requiredContentType: "jobApplications",
    bodyHtml:
      "<p>Every application includes the applicant's name, email, phone (if provided), cover message, profile photo, and resume. Use the status dropdown (New, Reviewed, Shortlisted, Rejected, Hired) to track where each candidate stands. You'll receive an email notification for every new application, and applicants receive an automatic confirmation email too.</p>",
  },
  {
    title: "Managing Contact Messages",
    category: "Content",
    visibility: "permission",
    requiredContentType: "contactSubmissions",
    bodyHtml:
      "<p>Every Contact form submission lands here with a status (New, Read, Replied, Archived). You'll get an email notification for each one, and the submitter receives an automatic confirmation. Use 'Reply via Email' to respond directly from your own inbox.</p>",
  },
  {
    title: "Moderating Reviews & Feedback",
    category: "Content",
    visibility: "permission",
    requiredContentType: "reviews",
    bodyHtml:
      "<p>Reviews start as Pending and are invisible to the public until Approved. You can Approve, Reject, or Edit-then-approve a review. Two separate flags control visibility once approved: <strong>Feature (Testimonials Page)</strong> highlights a review at the top of the public Testimonials page, while <strong>Show on Homepage</strong> is a completely separate decision about whether it appears in the homepage's testimonials preview. A review can have either, both, or neither.</p><p>Reviewers can attach their feedback to something specific — a case study, team member, blog post, job opening, another review, or something custom — or leave it general.</p>",
  },
  {
    title: "Managing Services",
    category: "Content",
    visibility: "permission",
    requiredContentType: "services",
    bodyHtml:
      "<p>Each service has a title, summary, and icon chosen from a curated set. Use Display Order to control ordering on the public Services page. Featured services are prioritized (shown first) on the homepage, though non-featured ones still appear too.</p>",
  },
  {
    title: "Managing Process Steps",
    category: "Content",
    visibility: "permission",
    requiredContentType: "processSteps",
    bodyHtml:
      "<p>Process steps describe your studio's engineering approach (e.g. Discovery, Architecture, Build, Launch) in order. All published steps show in full on both the Process page and the homepage's process preview — this section intentionally does not use a 'Featured' filter, since skipping steps would make the process look incomplete.</p>",
  },
  {
    title: "Editing Site Pages (About, Privacy Policy, Terms of Service)",
    category: "Content",
    visibility: "permission",
    requiredContentType: "pageContent",
    bodyHtml:
      "<p>These three pages share one editing system. Each starts with pre-written starter content — you'll see a notice if a page hasn't been explicitly saved yet, meaning it's currently showing that starter text rather than something you've customized.</p>",
  },
  {
    title: "Editing Homepage Settings",
    category: "Content",
    visibility: "permission",
    requiredContentType: "homeSettings",
    bodyHtml:
      "<p>Every section of the homepage — the hero, and every section heading and label below it (Case Studies, Services, Process, Team, Testimonials, Blog, Careers, and the final call-to-action) — is editable here, organized into collapsible groups. The actual content shown within each section (which case studies, which team members, etc.) is controlled by each item's own Featured flag elsewhere in the admin, not from this page.</p>",
  },
  {
    title: "Setting Availability Status",
    category: "Content",
    visibility: "permission",
    requiredContentType: "availabilityStatus",
    bodyHtml:
      "<p>This controls the small status badge shown on the Homepage and Contact page (e.g. 'Currently accepting new projects'). Choose a state, or override it with a custom message like 'Booked until March.'</p>",
  },
  {
    title: "Editing Book a Call Settings",
    category: "Content",
    visibility: "permission",
    requiredContentType: "bookACallSettings",
    bodyHtml:
      "<p>Controls the heading, description, and Calendly link shown on the public Book a Call page. If you ever change your Calendly event, update the link here — no code changes needed.</p>",
  },
  {
    title: "Managing Stack Items",
    category: "Content",
    visibility: "permission",
    requiredContentType: "stackItems",
    bodyHtml:
      "<p>Each stack item belongs to a category (e.g. Framework, Database, Hosting) and has its own title and description. The public Stack page automatically groups items by category — adding a brand new category is as simple as typing a new category name on a new item; no separate setup is required.</p>",
  },
  {
    title: "Writing Help Articles",
    category: "Content",
    visibility: "permission",
    requiredContentType: "helpArticles",
    bodyHtml:
      "<p>Articles have a visibility setting: <strong>Public</strong> (everyone, everywhere), <strong>Pre-Login</strong> (shown only on the login page's limited help set), <strong>Any Logged-In Admin</strong>, or <strong>Requires Specific Permission</strong> (only visible to roles with any access to a chosen content type — e.g. an article about moderating reviews only shows to roles that can touch Reviews).</p>",
  },
  {
    title: "About TGO and TGO DevStudio",
    category: "Brand",
    visibility: "public",
    bodyHtml:
      "<p>TGO is a parent brand under which multiple ventures are built, each carrying the TGO name with its own distinct focus. TGO DevStudio is the full-stack software engineering arm — this site, TGO DevStudio Prime, is its flagship presence.</p>",
  },
  {
    title: "Submitting a Review",
    category: "Public Site",
    visibility: "public",
    bodyHtml:
      "<p>Visit the Testimonials page to leave feedback. You can attach your review to something specific (a case study, team member, blog post, job opening, another review, or something custom) or leave it general. Your email is required for accountability but is never shown publicly. Reviews are moderated before appearing on the site.</p>",
  },
  {
    title: "Applying for a Job",
    category: "Public Site",
    visibility: "public",
    bodyHtml:
      "<p>Open a published role on the Careers page and fill out the application form, including a profile photo and resume (PDF or Word). You'll receive an automatic confirmation email once submitted.</p>",
  },
  {
    title: "Using the Floating Contact Button",
    category: "Public Site",
    visibility: "public",
    bodyHtml:
      "<p>The floating button in the corner of every page gives quick access to WhatsApp, Email, GitHub, Instagram, and Facebook. Click it to open the menu, click again or click outside to close it. It can be dragged to a different position on screen if it's in your way.</p>",
  },
];

export async function GET(request: NextRequest) {
  const providedSecret = request.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ status: "error", message: "Unauthorized." }, { status: 401 });
  }

  await connectToDatabase();

  const founder = await User.findOne().sort({ createdAt: 1 });
  if (!founder) {
    return NextResponse.json({ status: "error", message: "No users found to assign as author." }, { status: 500 });
  }

  let createdCount = 0;
  let skippedCount = 0;

  for (const article of DEFAULT_ARTICLES) {
    const slug = slugify(article.title);
    const existing = await HelpArticle.findOne({ slug });
    if (existing) {
      skippedCount++;
      continue;
    }

    await HelpArticle.create({
      title: article.title,
      slug,
      bodyHtml: article.bodyHtml,
      visibility: article.visibility,
      requiredContentType: article.requiredContentType,
      category: article.category,
      createdBy: founder._id,
    });
    createdCount++;
  }

  return NextResponse.json({
    status: "ok",
    message: `Created ${createdCount} new articles, skipped ${skippedCount} already existing.`,
  });
}
