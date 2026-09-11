import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Role from "@/models/Role";
import TeamMember from "@/models/TeamMember";
import Project from "@/models/Project";
import Service from "@/models/Service";
import ProcessStep from "@/models/ProcessStep";
import BlogPost from "@/models/BlogPost";
import { slugify } from "@/lib/utils/slugify";

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

  const results: Record<string, string> = {};

  try {
    // Team
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
    results.team = "ok";
  } catch (e) {
    results.team = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  try {
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
    results.primeCaseStudy = "ok";
  } catch (e) {
    results.primeCaseStudy = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  try {
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
    results.tgoFlowCaseStudy = "ok";
  } catch (e) {
    results.tgoFlowCaseStudy = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  try {
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
    results.camverseCaseStudy = "ok";
  } catch (e) {
    results.camverseCaseStudy = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  try {
    const airmarkSlug = slugify("Airmark");
    await Project.findOneAndUpdate(
      { slug: airmarkSlug },
      {
        title: "Airmark",
        slug: airmarkSlug,
        summary: "A live-production coordination and broadcast control platform built for volunteer and budget-constrained event teams — churches, conferences, weddings, and school events.",
        problemStatement: "Camera operators at live events routinely don't know whether their camera is the one currently on-air, so they reposition mid-broadcast and unknowingly show the audience unstable footage. Professional productions solve this with dedicated hardware and intercom systems that most volunteer teams simply cannot afford. Airmark replicates that same coordination discipline using only phones people already own, and layers free professional broadcast software on top for teams ready to go further — all on a genuinely zero-cost infrastructure stack.",
        approach: "Airmark was built as a modular system with a strict two-tier build order: a phone-only coordination layer was fully built and proven first, before any external broadcast-software integration began. Real-time state — camera status, signals, run-of-show, and countdowns — is driven by a live connection with explicit handling for reconnecting and catching back up after any dropped connection, since a dropped connection mid-event is the exact failure this product exists to prevent. The broadcast-software integration required solving a genuine architecture problem: a cloud-hosted backend cannot directly reach a laptop sitting behind a home or venue network, and a secure website cannot open an unencrypted connection to a local device. This was solved with a lightweight local bridge program that makes outbound-only connections to both the broadcast software and the cloud backend, turning the backend into a pure relay rather than a direct controller. Camera preview between an operator and the director uses direct phone-to-phone video, keeping video entirely off the backend, while still giving directors real visual confirmation of each operator's framing before switching to them live. Security follows a full baseline: encrypted password storage, secure refresh-token cookies, optional two-factor authentication with backup codes, dynamic per-team role-based permissions rather than fixed roles, rate limiting, and strict data separation between teams from the very first database design.",
        outcome: "The coordination layer fully covers all nine planned real-time features, including camera tally, run-of-show tracking, countdowns, discreet crew signals, director talkback, highlight marking, equipment status, pre-event checklists, and crew scheduling. The broadcast-software integration supports scene switching, transitions, overlays, audio control, stream and record control, a replay buffer, and an automatic failsafe fallback scene. The platform includes a dynamic role and permission system supporting fully custom team roles, team invite and ownership-transfer flows, a 50-plus article in-app help system with live search, and a complete account system including two-factor authentication and recovery flows. The entire backend and frontend were developed and shipped using Termux, with zero paid infrastructure. The platform is live and currently in active internal testing ahead of deployment to a real event production team.",
        images: [],
        projectUrl: "https://airmark-frontend.onrender.com",
        repoUrl: "",
        tags: ["React", "Real-Time", "Broadcast", "Event Production"],
        metrics: [
          { label: "Real-Time Features", value: "9" },
          { label: "Help Articles", value: "50+" },
          { label: "Infrastructure Cost", value: "$0" },
        ],
        techStack: ["React", "TypeScript", "Vite", "Node.js", "Express", "Socket.IO", "MongoDB", "WebRTC"],
        status: "in-progress",
        featured: false,
        publishStatus: "published",
        createdBy: founder._id,
      },
      { upsert: true, new: true }
    );
    results.airmarkCaseStudy = "ok";
  } catch (e) {
    results.airmarkCaseStudy = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  try {
    if (true) {
      const services = [
        { title: "Web Application Development", icon: "Code", summary: "Full, custom-built websites and web apps designed around exactly what your business needs — not a generic template." },
        { title: "Custom CMS & Admin Panel Development", icon: "Layers", summary: "A private dashboard built just for you, so you can update your own website's content without needing a developer every time." },
        { title: "API Development & Integration", icon: "Plug", summary: "Connecting your website or app to other tools and services it needs to talk to, such as payment systems, email providers, or other software." },
        { title: "Database Design & Architecture", icon: "Database", summary: "Organizing and structuring how your business's information is stored, so it stays fast, reliable, and easy to work with as you grow." },
        { title: "E-Commerce Solutions", icon: "ShoppingCart", summary: "Online stores built to actually sell — product listings, shopping carts, and secure checkout, built around how your business really works." },
        { title: "Authentication & Access Control", icon: "Lock", summary: "Login systems, password protection, role-based permissions, and extra security steps like two-factor authentication, built to keep your users and data safe." },
        { title: "Cloud Hosting & Deployment", icon: "Cloud", summary: "Getting your website or app online, live, and running smoothly, using reliable hosting infrastructure." },
        { title: "Website Maintenance & Support", icon: "Wrench", summary: "Ongoing care for your website after launch — fixing issues, applying updates, and making sure everything keeps running well over time." },
        { title: "Mobile-Responsive Design", icon: "Smartphone", summary: "Making sure your website looks and works great on every device, from small phones to large desktop screens." },
        { title: "Performance Optimization", icon: "Gauge", summary: "Making your website load faster and run smoother, which keeps visitors happy and helps your site rank better on search engines." },
        { title: "Third-Party Integrations", icon: "Workflow", summary: "Adding outside tools to your site, such as email newsletters, payment gateways, chat widgets, or analytics, so everything works together smoothly." },
        { title: "Technical Consulting & Architecture Planning", icon: "Terminal", summary: "Honest advice on the right technology and approach for your specific project, before any code is written." },
        { title: "Payment Gateway Integration", icon: "CreditCard", summary: "Secure, reliable checkout and billing systems connected directly to your platform, supporting the payment methods your customers actually use." },
        { title: "User Account & Membership Systems", icon: "Users", summary: "Sign-up, login, profile management, and membership tiers built to fit exactly how your platform needs users to interact with it." },
        { title: "Automated Testing & Quality Assurance", icon: "TestTube", summary: "Real automated tests that catch problems before your users do, so updates and new features don't quietly break what already works." },
        { title: "Search & Filtering Systems", icon: "Search", summary: "Fast, accurate search and filtering tools that help users find exactly what they're looking for on your platform." },
        { title: "Real-Time Features & Live Updates", icon: "Zap", summary: "Live chat, live notifications, real-time dashboards, and other features that update instantly without needing a page refresh." },
        { title: "Notification Systems", icon: "Bell", summary: "Email, SMS, or in-app notifications that keep your users informed automatically, exactly when it matters." },
        { title: "Analytics & Reporting Dashboards", icon: "BarChart", summary: "Custom dashboards that turn your platform's raw data into clear, useful insights for real business decisions." },
        { title: "Chat & Messaging Features", icon: "MessageSquare", summary: "In-app messaging, support chat, or team communication tools built directly into your platform." },
        { title: "Video & Media Handling", icon: "Video", summary: "Uploading, storing, and streaming video or media content reliably, without slowing down the rest of your platform." },
        { title: "DevOps & CI/CD Pipeline Setup", icon: "GitBranch", summary: "Automated systems that test and deploy your code safely every time a change is made, reducing human error and downtime." },
        { title: "Legacy System Modernization", icon: "RefreshCw", summary: "Upgrading or rebuilding outdated systems so they run on modern, secure, and maintainable technology, without losing what already works." },
        { title: "Custom Automation & Workflow Tools", icon: "Bot", summary: "Automating repetitive manual tasks in your business with custom-built tools, saving time and reducing human error." },
        { title: "Multi-Tenant & SaaS Platform Development", icon: "Network", summary: "Building platforms that serve multiple separate customers or organizations securely from one shared system, each with their own isolated data." },
        { title: "Mobile App Development", icon: "Smartphone", summary: "Native or cross-platform mobile apps for iOS and Android, built to work seamlessly with your existing web platform and backend." },
        { title: "Progressive Web App (PWA) Development", icon: "Monitor", summary: "Websites that behave like installable apps — working offline, sending notifications, and living on a user's home screen without an app-store download." },
        { title: "AI & Machine Learning Integration", icon: "Bot", summary: "Adding practical AI-powered features to your platform, such as smart recommendations, automated content, or intelligent data processing." },
        { title: "Data Migration & System Upgrades", icon: "RefreshCw", summary: "Safely moving your existing data and systems to new, modern infrastructure without losing information or disrupting your business." },
        { title: "Monitoring, Logging & Error Tracking", icon: "BarChart", summary: "Systems that watch your platform continuously, alerting you to problems before your users notice them, and giving you clear visibility into what's happening behind the scenes." },
        { title: "Accessibility (a11y) Implementation", icon: "Users", summary: "Making sure your website or app is genuinely usable by people with disabilities, following real accessibility standards, not just checkbox compliance." },
        { title: "Internationalization & Multi-Language Support", icon: "Globe", summary: "Building your platform to properly support multiple languages and regions from the start, so expanding to new markets doesn't require a rebuild." },
        { title: "File Storage & Document Management Systems", icon: "HardDrive", summary: "Secure, organized systems for uploading, storing, and managing documents and files at scale, built around how your team actually works." },
        { title: "Booking & Scheduling Systems", icon: "Bell", summary: "Custom appointment, reservation, or scheduling tools built around your business's exact booking rules and availability." },
        { title: "Content Migration Services", icon: "FileCode", summary: "Moving your existing website's content — pages, images, blog posts, and more — safely into a new platform without losing anything in the process." },
        { title: "White-Label & Reseller Platform Development", icon: "Layers", summary: "Building platforms designed to be rebranded and resold by other businesses, with the flexibility to support multiple brands from one system." },
        { title: "Browser Extension Development", icon: "Cpu", summary: "Custom browser extensions that add real functionality directly into a user's browsing experience, connected to your platform." },
        { title: "System Architecture Review & Audit", icon: "Search", summary: "An honest, thorough review of your existing system's structure, security, and performance, with clear recommendations for improvement." },
        { title: "Ongoing Technical Partnership", icon: "LifeBuoy", summary: "A long-term working relationship where we act as your dedicated technical team, available for new features, fixes, and strategic guidance as your business grows." },
      ];
      let servicesCreated = 0;
      let servicesSkipped = 0;
      for (let i = 0; i < services.length; i++) {
        const existing = await Service.findOne({ title: services[i].title });
        if (existing) {
          servicesSkipped++;
          continue;
        }
        await Service.create({
          ...services[i],
          displayOrder: i,
          publishStatus: "published",
          featured: servicesCreated < 3,
          createdBy: founder._id,
        });
        servicesCreated++;
      }
      results.services = `created ${servicesCreated}, skipped ${servicesSkipped}`;
    } else {
      results.services = "skipped (already exist)";
    }
  } catch (e) {
    results.services = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  try {
    if (true) {
      const steps = [
        { title: "Discovery", description: "We start by listening. We talk with you about what you need, what problem you're trying to solve, and what success looks like for your project." },
        { title: "Planning & Architecture", description: "We decide exactly how the project should be built — what tools to use, how the different parts will fit together, and what order things should be built in." },
        { title: "Design", description: "We plan how the website or app will look and feel, making sure it's easy to use and represents your brand well." },
        { title: "Development", description: "We build the real, working product — writing the actual code that makes everything function." },
        { title: "Testing", description: "We check everything carefully before launch, looking for problems and fixing them, so what you receive actually works the way it should." },
        { title: "Launch", description: "We take the finished project live, so real users and customers can start using it." },
        { title: "Support & Maintenance", description: "We stay available after launch to fix issues, make updates, and help your project keep running smoothly as time goes on." },
      ];
      let stepsCreated = 0;
      let stepsSkipped = 0;
      for (let i = 0; i < steps.length; i++) {
        const existing = await ProcessStep.findOne({ title: steps[i].title });
        if (existing) {
          stepsSkipped++;
          continue;
        }
        await ProcessStep.create({
          ...steps[i],
          displayOrder: i,
          publishStatus: "published",
          featured: true,
          createdBy: founder._id,
        });
        stepsCreated++;
      }
      results.process = `created ${stepsCreated}, skipped ${stepsSkipped}`;
    } else {
      results.process = "skipped (already exist)";
    }
  } catch (e) {
    results.process = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  try {
    const blogPosts = [
      { title: "What Is Full-Stack Development? A Simple Explanation", excerpt: "If you've ever wondered what 'full-stack' means, here's a simple, no-jargon explanation anyone can understand.", content: "<p>You may have seen the term 'full-stack developer' and wondered what it actually means. Let's break it down in the simplest way possible.</p><h2>Two Sides of Every Website</h2><p>Every website or app has two main sides. The first side is what you see and touch. This is called the 'front end.' The second side is what happens behind the scenes. This is called the 'back end.'</p><h2>What 'Full-Stack' Means</h2><p>A full-stack developer is someone who can build both sides. Think of a restaurant. The front end is like the dining area. The back end is like the kitchen. A full-stack developer can work in both.</p><h2>Why This Matters to You</h2><p>If you hire a full-stack developer or studio, one person or team can handle your entire project from start to finish, instead of needing to hire separate people for each part.</p>", tags: ["Beginner Guide", "Full-Stack"] },
      { title: "How We Built This Website Using Termux", excerpt: "Here's the real story of how TGO DevStudio Prime was engineered, and the tool that made it possible.", content: "<p>Most websites are built using traditional development setups. This one had an added technical challenge built into the project on purpose: engineering it entirely using Termux.</p><h2>The Tool That Made It Possible</h2><p>Termux is an app that turns a terminal environment into a real coding workspace.</p><h2>Why This Was a Meaningful Challenge</h2><p>Many tools that developers usually rely on don't work exactly the same way in this kind of environment, so workarounds had to be found for several steps of the process.</p><h2>Why It Was Worth It</h2><p>This project proves that having a traditional setup is not always necessary to build something real and useful.</p>", tags: ["Behind the Scenes", "Termux"] },
      { title: "Why Website Security Matters, Even for Small Businesses", excerpt: "Think your business is too small to be a target? Here's why every website needs real security.", content: "<p>A common mistake business owners make is thinking their business is too small to be attacked. Unfortunately, this isn't true.</p><h2>Attacks Aren't Always Personal</h2><p>Many attacks on websites are automated, constantly scanning for weak security everywhere, not specifically targeting famous businesses.</p><h2>What's at Risk</h2><p>If a website isn't properly secured, customer information and passwords could be exposed, damaging trust and reputation.</p><h2>What Real Security Looks Like</h2><p>Good security includes encrypting passwords, protecting login pages from repeated guessing, and using extra steps like two-factor authentication.</p>", tags: ["Security", "Business Advice"] },
      { title: "What Is a CMS, and Why Does Your Business Need One?", excerpt: "Tired of calling a developer every time you need to change a sentence on your website? A CMS solves that.", content: "<p>CMS stands for 'Content Management System.' It's a private dashboard that lets you update your own website without knowing how to code.</p><h2>Life Without a CMS</h2><p>Without a CMS, every small change usually means contacting a developer and waiting.</p><h2>Life With a CMS</h2><p>With a CMS, you make the change yourself, in minutes.</p><h2>Why This Matters</h2><p>A CMS gives you control over your own website and saves time and money in the long run.</p>", tags: ["CMS", "Business Advice"] },
      { title: "Front End vs Back End: What's the Difference?", excerpt: "These two terms come up constantly in web development. Here's what they actually mean.", content: "<p>If you're new to websites and apps, you've probably heard these terms often. Let's make them simple.</p><h2>Front End: What You See</h2><p>Everything you can see and interact with — layout, colors, buttons, text.</p><h2>Back End: What You Don't See</h2><p>Everything behind the scenes that makes the front end work — where information is stored and processed.</p><h2>Working Together</h2><p>Neither side functions well without the other. Good websites need both.</p>", tags: ["Beginner Guide"] },
      { title: "How to Choose the Right Technology for Your Project", excerpt: "There are hundreds of tools and technologies out there. Here's how to think about choosing the right ones.", content: "<p>One of the first big decisions in any software project is choosing which technologies to build it with.</p><h2>Start With the Goal, Not the Tool</h2><p>The right technology depends on what you're actually trying to build, not which tool sounds most impressive.</p><h2>Consider Long-Term Costs</h2><p>Some technologies are free upfront but cost more in hosting or maintenance over time.</p><h2>Trust Experience Over Trends</h2><p>A good partner recommends technology based on what genuinely works best for your project.</p>", tags: ["Business Advice", "Technology"] },
      { title: "Why a Fast-Loading Website Matters More Than You Think", excerpt: "A slow website isn't just annoying. It can cost you visitors, customers, and search engine rankings.", content: "<p>Website speed is often overlooked, but it has a real impact on performance.</p><h2>Visitors Don't Wait Long</h2><p>Most people leave a website that takes too long to load, often within seconds.</p><h2>Search Engines Notice Speed</h2><p>Search engines consider loading speed when ranking websites.</p><h2>What Affects Speed</h2><p>Image handling and code organization both matter, and good practices from the start make a lasting difference.</p>", tags: ["Performance", "SEO"] },
      { title: "What Happens After Your Website Launches?", excerpt: "Launching your website isn't the finish line. Here's what comes next, and why it matters.", content: "<p>Many people assume the work is done once a website goes live. In reality, launch day is just the beginning.</p><h2>Software Needs Ongoing Care</h2><p>A website needs ongoing attention, just like a car needs regular maintenance.</p><h2>Businesses Change, and Websites Should Too</h2><p>As your business grows, your website often needs to change with it.</p><h2>Why Ongoing Support Matters</h2><p>A maintenance plan means small issues get caught early, before they become bigger problems.</p>", tags: ["Business Advice", "Maintenance"] },
      { title: "Understanding APIs in Simple Terms", excerpt: "APIs sound complicated, but the core idea is actually very simple. Here's how to think about them.", content: "<p>The word 'API' comes up constantly and can sound intimidating, but the basic idea is simple.</p><h2>A Simple Way to Think About It</h2><p>At a restaurant, you don't walk into the kitchen — you tell the waiter, and the waiter brings your order. An API works the same way for software.</p><h2>Where You See APIs in Real Life</h2><p>Every weather forecast or payment in an app is powered by an API working behind the scenes.</p><h2>Why APIs Matter</h2><p>APIs let different tools work together instead of everything being built from scratch.</p>", tags: ["Beginner Guide", "APIs"] },
      { title: "Why Good Software Takes Time — and Why That's a Good Thing", excerpt: "Rushed software often causes more problems than it solves. Here's why taking time actually saves time.", content: "<p>It's tempting to want everything built fast. But rushing software often leads to bigger problems later.</p><h2>Shortcuts Come With Hidden Costs</h2><p>Skipping proper planning or testing to save time upfront often means those issues return later, at a worse moment.</p><h2>What Careful Building Looks Like</h2><p>Real planning, careful testing, and honest attention to details that aren't always visible.</p><h2>The Real Payoff</h2><p>A project built with care runs more smoothly and is easier to grow over time.</p>", tags: ["Business Advice", "Process"] },
      { title: "What Does Responsive Design Actually Mean?", excerpt: "You've heard the term everywhere. Here's what it really means for how your website behaves.", content: "<p>Responsive design is one of those phrases used constantly, but rarely explained clearly.</p><h2>The Simple Idea</h2><p>A responsive website automatically adjusts its layout depending on screen size, without needing separate versions.</p><h2>Why It Matters</h2><p>More people browse on phones today than computers. A non-responsive site frustrates most visitors.</p><h2>What Happens Without It</h2><p>Visitors are forced to zoom constantly, or see broken layouts, driving them away quickly.</p>", tags: ["Beginner Guide", "Design"] },
      { title: "Why Your Website Needs a Privacy Policy", excerpt: "It might feel like a formality, but a privacy policy protects both you and your visitors.", content: "<p>Many business owners see a privacy policy as just paperwork. In reality, it serves a real, practical purpose.</p><h2>What It Actually Does</h2><p>It tells visitors what information your website collects and how it is used.</p><h2>Why It Protects You</h2><p>Being upfront builds trust, and in many places, it's legally required, not just a good idea.</p><h2>Keeping It Honest</h2><p>It should genuinely reflect what your website does, and be updated as your site changes.</p>", tags: ["Business Advice", "Legal"] },
      { title: "The Difference Between a Website and a Web Application", excerpt: "These terms are often used interchangeably, but they describe genuinely different things.", content: "<p>People often use these terms as if they mean the same thing, but they describe different levels of interaction.</p><h2>A Website: Mostly Information</h2><p>Focused on presenting information — visitors mostly read and browse.</p><h2>A Web Application: Mostly Interaction</h2><p>Lets users actively do something — manage data, complete tasks, interact in real time.</p><h2>Why the Difference Matters</h2><p>Knowing which one you need affects how a project should be planned and priced.</p>", tags: ["Beginner Guide", "Technology"] },
      { title: "How to Know If Your Business Actually Needs Custom Software", excerpt: "Not every business needs a custom-built system. Here's how to think clearly about when it's worth it.", content: "<p>Custom software can be powerful, but isn't always right for every business or stage.</p><h2>When Off-the-Shelf Tools Make Sense</h2><p>If your needs are fairly standard, building something custom may cost more than it's worth right now.</p><h2>When Custom Software Becomes Worth It</h2><p>When generic tools can't support your specific processes, or you're constantly working around their limits.</p><h2>Making the Decision</h2><p>A good partner is honest about whether custom software is the right investment for you right now.</p>", tags: ["Business Advice", "Technology"] },
      { title: "Why Backups Matter More Than Most People Realize", excerpt: "Nobody thinks about backups until something goes wrong. Here's why that's a mistake.", content: "<p>Backups feel unnecessary right up until the moment they're desperately needed.</p><h2>What Can Go Wrong</h2><p>Accidental deletion, technical failure, or errors during updates can cause permanent data loss without backups.</p><h2>What Good Backup Practices Look Like</h2><p>Automatic, regular, stored separately, and actually tested occasionally.</p><h2>Peace of Mind, Not Paranoia</h2><p>Proper backups mean a problem doesn't mean starting over from nothing.</p>", tags: ["Security", "Business Advice"] },
      { title: "What Is Uptime, and Why Should You Care?", excerpt: "You'll see this word on every hosting provider's website. Here's what it actually means for your business.", content: "<p>Uptime refers to how consistently a website stays accessible, without unexpected outages.</p><h2>Why It's Shown as a Percentage</h2><p>Providers advertise uptime as a percentage representing expected availability over time.</p><h2>Why Small Differences Matter</h2><p>A small percentage difference can mean meaningful actual downtime over a year.</p><h2>What Affects Uptime</h2><p>Hosting quality, how well the site is built, and how quickly problems are fixed.</p>", tags: ["Technology", "Business Advice"] },
      { title: "Why 'It Works on My Computer' Isn't Good Enough", excerpt: "This phrase is a running joke among developers, but it points to something genuinely important.", content: "<p>Developers joke about software working on their own computer but breaking elsewhere. This points to a real challenge.</p><h2>Why This Happens</h2><p>Different devices and browsers behave differently. Software not tested across these can fail unexpectedly.</p><h2>What Proper Testing Looks Like</h2><p>Testing across different browsers, devices, and real-world conditions, not just one setup.</p><h2>Why This Matters to You</h2><p>Part of what you pay for is the discipline to make sure your product genuinely works for real users.</p>", tags: ["Process", "Technology"] },
      { title: "Understanding the Real Cost of a Website", excerpt: "The price of a website isn't just about the build. Here's the true, ongoing cost.", content: "<p>People often only think about the upfront price of building a website. The real picture is bigger.</p><h2>The Build Cost</h2><p>Planning, designing, and building the website itself.</p><h2>Ongoing Costs</h2><p>Hosting, domain renewal, and any third-party services the site depends on.</p><h2>The Cost of Neglect</h2><p>Outdated content and growing security risk from not maintaining a site properly over time.</p>", tags: ["Business Advice"] },
      { title: "Why Simple Design Often Wins", excerpt: "It's tempting to add every feature possible. Here's why restraint often produces a better result.", content: "<p>There's often a temptation to include as many features as possible. Simpler design usually serves visitors better.</p><h2>Clarity Over Complexity</h2><p>A clean, focused design helps visitors quickly understand what you do.</p><h2>Speed and Reliability</h2><p>Simpler websites load faster and have fewer things that can go wrong.</p><h2>Design With Purpose</h2><p>Every element should have a clear reason for being there.</p>", tags: ["Design", "Business Advice"] },
      { title: "What Scalability Really Means for Your Project", excerpt: "This word gets used constantly in tech. Here's what it concretely means for something you're building.", content: "<p>Scalability is thrown around often, but has a very concrete, practical meaning.</p><h2>The Core Idea</h2><p>A scalable system handles growth without needing to be rebuilt from scratch.</p><h2>Why This Matters Early On</h2><p>Some decisions are much cheaper to make early than to fix later, once real users depend on the system.</p><h2>Balancing Today and Tomorrow</h2><p>Build for realistic near-term needs while avoiding an expensive future rebuild.</p>", tags: ["Technology", "Business Advice"] },
    ];

    let blogCreated = 0;
    let blogSkipped = 0;

    for (const post of blogPosts) {
      const slug = slugify(post.title);
      const existing = await BlogPost.findOne({ slug });
      if (existing) {
        blogSkipped++;
        continue;
      }
      await BlogPost.create({
        title: post.title,
        slug,
        excerpt: post.excerpt,
        contentHtml: post.content,
        tags: post.tags,
        publishStatus: "published",
        featured: blogCreated === 0,
        createdBy: founder._id,
      });
      blogCreated++;
    }
    results.blog = `created ${blogCreated}, skipped ${blogSkipped}`;
  } catch (e) {
    results.blog = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json({ status: "ok", results });
}
