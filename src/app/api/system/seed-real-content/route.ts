import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import TeamMember from "@/models/TeamMember";
import Project from "@/models/Project";
import { slugify } from "@/lib/utils/slugify";

export async function GET(request: NextRequest) {
  const providedSecret = request.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ status: "error", message: "Unauthorized." }, { status: 401 });
  }

  await connectToDatabase();

  const founder = await User.findOne().sort({ createdAt: 1 });
  if (!founder) {
    return NextResponse.json({ status: "error", message: "No users found." }, { status: 500 });
  }

  const results: Record<string, string> = {};

  // Corrected team bio — Termux only, no phone/device wording
  const teamSlug = slugify("Testimony Oluwatimilehin Gboroye");
  await TeamMember.findOneAndUpdate(
    { slug: teamSlug },
    {
      name: "Testimony Oluwatimilehin Gboroye",
      slug: teamSlug,
      jobTitle: "Founder, TGO DevStudio",
      bio: "Testimony is the founder of TGO DevStudio. He built TGO DevStudio Prime — this entire website, including its content management system, admin dashboard, and every feature on it — using Termux, a tool that lets real code be written and run in a terminal environment. Testimony believes that good software should be built with care, honesty, and attention to detail. He focuses on writing clean, secure, and well-organized code, and on making sure every feature actually works well before it is called finished. He is based in Akure, Ondo State, Nigeria, and continues to build and improve TGO DevStudio Prime and future TGO DevStudio projects.",
      linkedinUrl: "",
      githubUrl: "https://github.com/testimonygboroye",
      twitterUrl: "",
      displayOrder: 0,
      publishStatus: "published",
      featured: true,
      createdBy: founder._id,
    },
    { upsert: true, new: true }
  );
  results.team = "created or updated";

  // TGO DevStudio Prime — phone mention allowed here, reframed as deliberate proof, not limitation
  const primeSlug = slugify("TGO DevStudio Prime");
  await Project.findOneAndUpdate(
    { slug: primeSlug },
    {
      title: "TGO DevStudio Prime",
      slug: primeSlug,
      summary: "The flagship website and content management system for TGO DevStudio — and a deliberate technical proof that a production-grade website can be engineered entirely using Termux on a mobile device.",
      problemStatement: "TGO DevStudio needed a website that could do two things at once: show off the studio's work to the world, and give the founder an easy way to manage everything on the site — blog posts, case studies, team members, job openings, messages from visitors, and more — without needing to touch code every time something small needed to change.",
      approach: "The site was built using Next.js, combined with MongoDB for storing data and Cloudinary for storing images and files. Every part of the site — from the public pages visitors see, to the private admin dashboard where the founder manages content — was coded using Termux, a tool that turns a terminal environment into a full development workspace. As a deliberate technical experiment within this project, the entire build was carried out using only a mobile device running Termux, rather than a laptop or desktop — even though TGO DevStudio's work more broadly is done across a range of devices. This was done specifically to prove that with the right tools, discipline, and problem-solving, a serious, production-quality website and CMS could be engineered end-to-end from a genuinely constrained development environment. Security was treated as a top priority throughout: passwords are encrypted, admin accounts can require two-factor authentication, and every public form is protected against spam and abuse.",
      outcome: "TGO DevStudio Prime now runs as a full, working website and admin system. The founder can add or edit blog posts, showcase new projects, manage job openings and applications, moderate customer reviews, send newsletters, and track site visitors — all from a simple admin dashboard, without writing new code for routine updates. The project also successfully proved its underlying technical premise: that a serious website and CMS can be built entirely using Termux, from the first line of code to final live deployment.",
      images: [],
      projectUrl: "https://tgo-devstudio-prime.onrender.com",
      repoUrl: "https://github.com/testimonygboroye/tgo-devstudio-prime",
      tags: ["Next.js", "MongoDB", "CMS", "Full-Stack"],
      metrics: [
        { label: "Admin Features", value: "30+" },
        { label: "Built Using", value: "Termux" },
        { label: "Content Types", value: "15+" },
      ],
      techStack: ["Next.js", "TypeScript", "MongoDB", "Cloudinary", "Tailwind CSS", "Brevo", "Render"],
      status: "live",
      featured: true,
      publishStatus: "published",
      createdBy: founder._id,
    },
    { upsert: true, new: true }
  );
  results.primeCaseStudy = "created or updated";

  // TGO Flow — no phone mention, Termux only
  const flowSlug = slugify("TGO Flow");
  await Project.findOneAndUpdate(
    { slug: flowSlug },
    {
      title: "TGO Flow",
      slug: flowSlug,
      summary: "A real-time, multi-tenant project and task management platform — a visual tool that lets teams organize work across isolated workspaces with live updates.",
      problemStatement: "Small teams and agencies juggling multiple clients often default to a patchwork of informal tools to track who is doing what. These tools don't scale well: there is no visual status at a glance, no accountability trail, and no real separation between different clients' work. TGO Flow solves this by giving each team or client a fully isolated workspace with structured, visual task tracking and a permission system that mirrors how real organizations delegate work.",
      approach: "The build followed a deliberate, phased engineering discipline. The foundation — project structure, environment configuration, and automated deployment — was set up before any feature code was written, including working through several toolchain compatibility issues specific to building with Termux. Authentication, workspace permissions, and the core task-board data model were built and verified through the API before any visual interface existed, ensuring the permission logic was correct at its source. Real-time functionality was built in from the start of the task and board features, using authenticated live connections scoped so a user can only receive updates for boards they are actually a member of. Once the feature set stabilized, a dedicated pass focused purely on security and reliability: rate limiting, security headers, and closing a genuine cross-tenant data-isolation issue, fixed and confirmed with an automated test proving the isolation. The product then went through structured review cycles, with real reported issues root-caused and fixed, often with accompanying automated tests.",
      outcome: "The platform now runs 24 backend automated tests and 18 frontend automated tests, all enforced automatically on every code change. Real-time updates arrive in under 1 to 2 seconds across separate users viewing the same board, confirmed through live testing. Through code-splitting, the login page's file size was reduced from roughly 525KB to about 3KB, with the heaviest part of the app — the drag-and-drop board — now loading only when a user actually opens a board. Two real production incidents occurred during development and were both caught, understood, and resolved without any data loss, thanks to a safety net of automated tests and an isolated test database. The platform is fully deployed and independently running, with separate services for the application and its API, a live database, and automated transactional email for password resets, invitations, and feedback notifications.",
      images: [],
      projectUrl: "https://tgo-flow.onrender.com",
      repoUrl: "",
      tags: ["React", "Real-Time", "SaaS", "Project Management"],
      metrics: [
        { label: "Automated Tests", value: "42" },
        { label: "Real-Time Updates", value: "<2s" },
        { label: "Bundle Size Cut", value: "99%" },
      ],
      techStack: ["React", "TypeScript", "Vite", "Node.js", "Express", "MongoDB", "Socket.IO", "Tailwind CSS"],
      status: "live",
      featured: true,
      publishStatus: "published",
      createdBy: founder._id,
    },
    { upsert: true, new: true }
  );
  results.tgoFlowCaseStudy = "created or updated";

  // Camverse — no phone mention, no named third-party apps, Termux only
  const camverseSlug = slugify("Camverse");
  await Project.findOneAndUpdate(
    { slug: camverseSlug },
    {
      title: "Camverse",
      slug: camverseSlug,
      summary: "A connected campus operating system — a single platform replacing scattered messaging groups, physical noticeboards, and word-of-mouth for everyday university campus life.",
      problemStatement: "University students currently manage nearly every part of campus life through fragmented, unreliable informal channels: important deadlines get buried in crowded chat groups, lost items rarely make it back to their owners, students have no reliable way to confirm whether a utility outage is localized or campus-wide, and past exam materials get passed down informally, if at all. Camverse consolidates these recurring, unsolved problems into one coherent, purpose-built platform, rather than forcing students to repurpose general-use tools that were never designed for these specific needs.",
      approach: "Camverse was designed as a modular system: a permanent shared foundation (authentication, dynamic role-based permissions, navigation, notifications, and design system) with independently addable feature modules, so new functionality can be added without touching existing, working code. Every role in the system — such as a class representative or department leader — is a database record with configurable scope and permissions, fully manageable through an admin panel, so the platform can adapt to any institution's actual student-government structure without needing new code. The data model was built to be multi-school-ready from the very first line of code, with every record scoped by school, faculty, and department. Trust and safety were treated as first-class concerns: the platform's peer-support module uses genuine pseudonymity, with identities never exposed even internally, along with automatic detection of crisis-related language that immediately surfaces real support resources, and a tightly scope-restricted escalation process so only someone explicitly assigned and qualified for a specific department can ever request a poster's real identity, and only for one flagged case at a time. Account registration requires real document verification, captured live and reviewed by an admin before an account becomes active, rather than relying on email and password alone. The entire project was built using Termux, including working around genuine platform-level constraints unique to that environment.",
      outcome: "Camverse launched with 11 fully functional modules, each shipped end-to-end across backend, frontend, and admin tooling. Seed data covers the pilot institution's actual academic structure — 12 faculties and 61 departments, individually verified against real institutional data. The platform runs entirely on genuinely free-tier infrastructure, a deliberate constraint maintained throughout the build, with automated recurring jobs handling routine maintenance tasks with zero manual intervention. The platform is currently in active internal testing ahead of its full student rollout.",
      images: [],
      projectUrl: "https://camverse-client.onrender.com",
      repoUrl: "",
      tags: ["React", "PWA", "Campus Platform", "Multi-Tenant"],
      metrics: [
        { label: "Modules Shipped", value: "11" },
        { label: "Departments Seeded", value: "61" },
        { label: "Infrastructure Cost", value: "$0" },
      ],
      techStack: ["React", "TypeScript", "Vite", "Node.js", "Express", "MongoDB", "Cloudinary", "Brevo"],
      status: "in-progress",
      featured: false,
      publishStatus: "published",
      createdBy: founder._id,
    },
    { upsert: true, new: true }
  );
  results.camverseCaseStudy = "created or updated";

  return NextResponse.json({ status: "ok", results });
}
