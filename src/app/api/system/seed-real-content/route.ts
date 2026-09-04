import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
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

  const founder = await User.findOne().sort({ createdAt: 1 });
  if (!founder) {
    return NextResponse.json({ status: "error", message: "No users found." }, { status: 500 });
  }

  const results: Record<string, string> = {};

  // Team member
  const teamSlug = slugify("Testimony Oluwatimilehin Gboroye");
  const existingTeam = await TeamMember.findOne({ slug: teamSlug });
  if (!existingTeam) {
    await TeamMember.create({
      name: "Testimony Oluwatimilehin Gboroye",
      slug: teamSlug,
      jobTitle: "Founder, TGO DevStudio",
      bio: "Testimony is the founder of TGO DevStudio. He built TGO DevStudio Prime — this entire website, including its content management system, admin dashboard, and every feature on it — completely by himself, using only an Android phone. He did not use a computer at any point. He used an app called Termux, which turns a phone into a small coding computer, to write every line of code, connect every service, and launch every page you see on this site. Testimony believes that good software should be built with care, honesty, and attention to detail, no matter what tools are used to build it. He focuses on writing clean, secure, and well-organized code, and on making sure every feature actually works well before it is called finished. He is based in Akure, Ondo State, Nigeria, and continues to build and improve TGO DevStudio Prime and future TGO DevStudio projects.",
      linkedinUrl: "",
      githubUrl: "https://github.com/testimonygboroye",
      twitterUrl: "",
      displayOrder: 0,
      publishStatus: "published",
      featured: true,
      createdBy: founder._id,
    });
    results.team = "created";
  } else {
    results.team = "skipped (already exists)";
  }

  // Case study: TGO DevStudio Prime
  const caseSlug = slugify("TGO DevStudio Prime");
  const existingCase = await Project.findOne({ slug: caseSlug });
  if (!existingCase) {
    await Project.create({
      title: "TGO DevStudio Prime",
      slug: caseSlug,
      summary: "The flagship website and content management system for TGO DevStudio, built entirely from an Android phone using Termux — no computer involved at any stage.",
      problemStatement: "TGO DevStudio needed a website that could do two things at once: show off the studio's work to the world, and give the founder an easy way to manage everything on the site — blog posts, case studies, team members, job openings, messages from visitors, and more — without needing to touch code every time something small needed to change. On top of that, there was a much bigger challenge: the entire project had to be built using only a phone, since that was the only device available. Most website-building tools and guides assume you have a laptop or desktop computer.",
      approach: "The site was built using Next.js, a modern web framework, combined with MongoDB for storing data and Cloudinary for storing images and files. Every part of the site — from the public pages visitors see, to the private admin dashboard where the founder manages content — was coded directly on the phone using Termux, a terminal app that lets a phone run real developer tools. Code was written, saved, and pushed to GitHub directly from the phone, and then automatically deployed live using Render, a free hosting service. Security was treated as a top priority from the start: passwords are encrypted, admin accounts can require two-factor authentication (an extra login step using a phone app), and every public form (like the contact form) is protected against spam and abuse.",
      outcome: "TGO DevStudio Prime now runs as a full, working website and admin system. The founder can add or edit blog posts, showcase new projects, manage job openings and applications, moderate customer reviews, send newsletters, and track site visitors — all from a simple admin dashboard, without writing new code for routine updates. The project also proved something important: that a serious, production-quality website and CMS can be built entirely from a mobile phone, from the very first line of code to the final live deployment.",
      images: [],
      projectUrl: "https://tgo-devstudio-prime.onrender.com",
      repoUrl: "https://github.com/testimonygboroye/tgo-devstudio-prime",
      tags: ["Next.js", "MongoDB", "CMS", "Full-Stack"],
      metrics: [
        { label: "Built From", value: "A Phone" },
        { label: "Admin Features", value: "30+" },
        { label: "Coding Tool Used", value: "Termux" },
      ],
      techStack: ["Next.js", "TypeScript", "MongoDB", "Cloudinary", "Tailwind CSS", "Brevo", "Render"],
      status: "live",
      featured: true,
      publishStatus: "published",
      createdBy: founder._id,
    });
    results.caseStudy = "created";
  } else {
    results.caseStudy = "skipped (already exists)";
  }

  // Services
  const existingServicesCount = await Service.countDocuments();
  if (existingServicesCount === 0) {
    const services = [
      { title: "Web Application Development", icon: "Code", summary: "Full, custom-built websites and web apps designed around exactly what your business needs — not a generic template." },
      { title: "Custom CMS & Admin Panel Development", icon: "Layers", summary: "A private dashboard built just for you, so you can update your own website's content without needing a developer every time." },
      { title: "API Development & Integration", icon: "Cloud", summary: "Connecting your website or app to other tools and services it needs to talk to, such as payment systems, email providers, or other software." },
      { title: "Database Design", icon: "Database", summary: "Organizing and structuring how your business's information is stored, so it stays fast, reliable, and easy to work with as you grow." },
      { title: "E-Commerce Solutions", icon: "Boxes", summary: "Online stores built to actually sell — product listings, shopping carts, and secure checkout, built around how your business really works." },
      { title: "Authentication & Security Implementation", icon: "ShieldCheck", summary: "Login systems, password protection, and extra security steps like two-factor authentication, built to keep your users and data safe." },
      { title: "Cloud Hosting & Deployment", icon: "Server", summary: "Getting your website or app online, live, and running smoothly, using reliable hosting services." },
      { title: "Website Maintenance & Support", icon: "Gauge", summary: "Ongoing care for your website after launch — fixing issues, applying updates, and making sure everything keeps running well over time." },
      { title: "Mobile-Responsive Design", icon: "Smartphone", summary: "Making sure your website looks and works great on every device, from small phones to large desktop screens." },
      { title: "Performance Optimization", icon: "Gauge", summary: "Making your website load faster and run smoother, which keeps visitors happy and helps your site rank better on search engines." },
      { title: "Third-Party Integrations", icon: "Workflow", summary: "Adding outside tools to your site, such as email newsletters, payment gateways, chat widgets, or analytics, so everything works together smoothly." },
      { title: "Technical Consulting", icon: "Palette", summary: "Honest advice on the right technology and approach for your specific project, before any code is written." },
    ];
    await Service.insertMany(
      services.map((s, i) => ({ ...s, displayOrder: i, publishStatus: "published", featured: i < 3, createdBy: founder._id }))
    );
    results.services = `created ${services.length}`;
  } else {
    results.services = "skipped (already exist)";
  }

  // Process steps
  const existingStepsCount = await ProcessStep.countDocuments();
  if (existingStepsCount === 0) {
    const steps = [
      { title: "Discovery", description: "We start by listening. We talk with you about what you need, what problem you're trying to solve, and what success looks like for your project." },
      { title: "Planning & Architecture", description: "We decide exactly how the project should be built — what tools to use, how the different parts will fit together, and what order things should be built in." },
      { title: "Design", description: "We plan how the website or app will look and feel, making sure it's easy to use and represents your brand well." },
      { title: "Development", description: "We build the real, working product — writing the actual code that makes everything function." },
      { title: "Testing", description: "We check everything carefully before launch, looking for problems and fixing them, so what you receive actually works the way it should." },
      { title: "Launch", description: "We take the finished project live, so real users and customers can start using it." },
      { title: "Support & Maintenance", description: "We stay available after launch to fix issues, make updates, and help your project keep running smoothly as time goes on." },
    ];
    await ProcessStep.insertMany(
      steps.map((s, i) => ({ ...s, displayOrder: i, publishStatus: "published", featured: true, createdBy: founder._id }))
    );
    results.process = `created ${steps.length}`;
  } else {
    results.process = "skipped (already exist)";
  }

  // Blog posts
  const blogPosts = [
    {
      title: "What Is Full-Stack Development? A Simple Explanation",
      excerpt: "If you've ever wondered what 'full-stack' means, here's a simple, no-jargon explanation anyone can understand.",
      content: "<p>You may have seen the term 'full-stack developer' and wondered what it actually means. Let's break it down in the simplest way possible.</p><h2>Two Sides of Every Website</h2><p>Every website or app has two main sides. The first side is what you see and touch — the buttons, the colors, the text, the layout. This is called the 'front end.' The second side is what happens behind the scenes — where information is stored, checked, and processed. This is called the 'back end.'</p><h2>What 'Full-Stack' Means</h2><p>A full-stack developer is someone who can build both sides — the part you see, and the part working behind the scenes. Think of a restaurant. The front end is like the dining area, where customers sit and are served. The back end is like the kitchen, where the food is actually prepared. A full-stack developer can work in both the dining area and the kitchen.</p><h2>Why This Matters to You</h2><p>If you hire a full-stack developer or studio, it means one person or team can handle your entire project from start to finish, instead of needing to hire separate people for each part. This often makes projects faster, more consistent, and easier to manage.</p>",
      tags: ["Beginner Guide", "Full-Stack"],
    },
    {
      title: "How We Built This Website Entirely From a Phone",
      excerpt: "No laptop. No desktop computer. Just a phone. Here's the real story of how TGO DevStudio Prime was built.",
      content: "<p>Most websites are built using a laptop or desktop computer. This one wasn't. Every part of TGO DevStudio Prime — the website you're reading this on right now — was built using only an Android phone.</p><h2>The Tool That Made It Possible</h2><p>The phone ran an app called Termux. Termux turns a regular phone into a small coding computer. It lets you type real code, save files, and even connect to the internet to publish your work — all from your phone's screen.</p><h2>Why This Was Hard</h2><p>Typing code on a small phone screen is slower and more difficult than typing on a full keyboard. Many tools that developers usually rely on don't work properly on a phone, so workarounds had to be found for almost every step of the process.</p><h2>Why It Was Worth It</h2><p>This project proves that having the 'right' equipment is not always necessary to build something real and useful. What matters most is patience, problem-solving, and a genuine commitment to doing quality work, no matter what tools you have available.</p>",
      tags: ["Behind the Scenes", "Termux"],
    },
    {
      title: "Why Website Security Matters, Even for Small Businesses",
      excerpt: "Think your business is too small to be a target? Here's why every website — big or small — needs real security.",
      content: "<p>A common mistake business owners make is thinking, 'My business is small, so no one would bother attacking my website.' Unfortunately, this isn't true.</p><h2>Attacks Aren't Always Personal</h2><p>Many attacks on websites are automated. This means computer programs are constantly scanning the internet looking for any website with weak security — not specifically targeting big or famous businesses. A small business website can be just as likely to be tested as a large one.</p><h2>What's at Risk</h2><p>If a website isn't properly secured, customer information, passwords, and even payment details could be exposed. Beyond the direct harm to customers, this can seriously damage a business's reputation and trust.</p><h2>What Real Security Looks Like</h2><p>Good security includes things like encrypting passwords so they can never be read directly, protecting login pages from repeated guessing attempts, and using extra login steps like two-factor authentication for important accounts. These aren't extra luxuries — they are basic requirements for any serious website today.</p>",
      tags: ["Security", "Business Advice"],
    },
    {
      title: "What Is a CMS, and Why Does Your Business Need One?",
      excerpt: "Tired of calling a developer every time you need to change a sentence on your website? A CMS solves that.",
      content: "<p>CMS stands for 'Content Management System.' In simple terms, it's a private dashboard that lets you update your own website without needing to know how to code.</p><h2>Life Without a CMS</h2><p>Without a CMS, every small change to your website — even fixing a typo — usually means contacting a developer, waiting for them to make the change, and paying for their time. This can be slow and expensive for something as simple as updating your business hours.</p><h2>Life With a CMS</h2><p>With a CMS, you log into your own private admin area and make the change yourself, in minutes. Want to add a new product, publish a blog post, or update your team page? You can do it yourself, anytime, without waiting on anyone.</p><h2>Why This Matters</h2><p>A CMS gives you control over your own website. It saves time, saves money in the long run, and means your website can stay current and accurate without constant back-and-forth with a developer.</p>",
      tags: ["CMS", "Business Advice"],
    },
    {
      title: "Front End vs Back End: What's the Difference?",
      excerpt: "These two terms come up constantly in web development. Here's what they actually mean, explained simply.",
      content: "<p>If you're new to the world of websites and apps, you've probably heard the terms 'front end' and 'back end' many times. Let's make them simple.</p><h2>Front End: What You See</h2><p>The front end is everything you can see and interact with on a website — the layout, the colors, the buttons, the text, and how things move when you click or scroll. If you can see it or touch it on your screen, it's part of the front end.</p><h2>Back End: What You Don't See</h2><p>The back end is everything happening behind the scenes that makes the front end actually work. This includes where your information is stored, how passwords are checked, and how data gets sent and received. You never see the back end directly, but without it, the front end wouldn't be able to do anything real.</p><h2>Working Together</h2><p>Neither side can function well without the other. A beautiful front end with no back end is just a picture — it can't actually save your information or respond to your actions. A powerful back end with no front end has no way for real people to use it. Good websites need both, working well together.</p>",
      tags: ["Beginner Guide"],
    },
    {
      title: "How to Choose the Right Technology for Your Project",
      excerpt: "There are hundreds of tools and technologies out there. Here's how to think about choosing the right ones.",
      content: "<p>One of the first big decisions in any software project is choosing which technologies to build it with. This can feel overwhelming, especially with so many options available.</p><h2>Start With the Goal, Not the Tool</h2><p>The right technology depends on what you're actually trying to build and who will use it. A tool that's perfect for one type of project might be the wrong choice for another. The starting point should always be your actual goal, not which tool sounds the most impressive.</p><h2>Consider Long-Term Costs</h2><p>Some technologies are free to use but may cost more in hosting or maintenance over time. Others might cost more upfront but save money later. It's important to think beyond just the initial build and consider what the project will need months or years down the line.</p><h2>Trust Experience Over Trends</h2><p>New tools and frameworks appear constantly, and it's easy to get distracted by whatever is currently popular. A good development partner should recommend technology based on what will genuinely work best for your specific project, not just what's trending at the moment.</p>",
      tags: ["Business Advice", "Technology"],
    },
    {
      title: "Why a Fast-Loading Website Matters More Than You Think",
      excerpt: "A slow website isn't just annoying — it can cost you visitors, customers, and search engine rankings.",
      content: "<p>Website speed is often overlooked, but it has a real impact on how well a website performs — both for visitors and for search engines like Google.</p><h2>Visitors Don't Wait Long</h2><p>Most people will leave a website if it takes too long to load, often within just a few seconds. This means a slow website can lose visitors before they even see what you have to offer.</p><h2>Search Engines Notice Speed</h2><p>Search engines like Google consider a website's loading speed when deciding how high to rank it in search results. A faster website has a real advantage in being found by new visitors searching online.</p><h2>What Affects Speed</h2><p>Many things affect how fast a website loads, including how images are handled, how the website's code is organized, and where the website is hosted. Good development practices from the very beginning can make a lasting difference in speed, rather than trying to fix it after the fact.</p>",
      tags: ["Performance", "SEO"],
    },
    {
      title: "What Happens After Your Website Launches?",
      excerpt: "Launching your website isn't the finish line — it's the starting point. Here's what comes next, and why it matters.",
      content: "<p>Many people assume that once a website goes live, the work is done. In reality, launch day is just the beginning of a website's life.</p><h2>Software Needs Ongoing Care</h2><p>Just like a car needs regular maintenance to keep running well, a website needs ongoing attention too. This includes keeping software up to date, checking that everything still works correctly, and fixing any issues that come up over time.</p><h2>Businesses Change, and Websites Should Too</h2><p>As your business grows and changes, your website often needs to change with it — new services, new team members, new content. A website that never gets updated after launch can quickly become outdated.</p><h2>Why Ongoing Support Matters</h2><p>Having a plan for maintenance and support after launch means small issues get caught and fixed early, before they become bigger problems. It also means your website can keep growing and improving alongside your business, instead of staying frozen at launch day.</p>",
      tags: ["Business Advice", "Maintenance"],
    },
    {
      title: "Understanding APIs in Simple Terms",
      excerpt: "APIs sound technical and complicated, but the core idea behind them is actually very simple. Here's how to think about them.",
      content: "<p>The word 'API' comes up constantly in the tech world, and it can sound intimidating. But the basic idea behind an API is actually simple once you break it down.</p><h2>A Simple Way to Think About It</h2><p>Imagine you're at a restaurant. You don't walk into the kitchen yourself to get your food — instead, you tell the waiter what you want, and the waiter brings your order from the kitchen. An API works in a similar way for software: it's a messenger that lets one piece of software ask another piece of software for information or action, without needing to know exactly how that other software works internally.</p><h2>Where You See APIs in Real Life</h2><p>Every time an app shows you a weather forecast, processes a payment, or lets you log in using your Google account, an API is quietly working behind the scenes to make that connection happen.</p><h2>Why APIs Matter for Your Project</h2><p>APIs allow different tools and services to work together, instead of everything needing to be built completely from scratch. This often saves significant time and lets a project use trusted, existing services for things like payments or email, rather than reinventing them.</p>",
      tags: ["Beginner Guide", "APIs"],
    },
    {
      title: "Why Good Software Takes Time — and Why That's a Good Thing",
      excerpt: "Rushed software often causes more problems than it solves. Here's why taking the time to do it properly actually saves you time in the end.",
      content: "<p>It's tempting to want everything built as fast as possible. But when it comes to software, rushing often leads to bigger problems later.</p><h2>Shortcuts Come With Hidden Costs</h2><p>Skipping proper planning, testing, or security to save time upfront often means those same issues come back later — usually at a worse moment, and often more expensive to fix than if they had been handled properly from the start.</p><h2>What Careful Building Looks Like</h2><p>Good software development includes real planning before writing code, careful testing before launch, and honest attention to details that aren't always visible to the average user, like security and long-term reliability.</p><h2>The Real Payoff</h2><p>A project built with care tends to run more smoothly, need fewer emergency fixes, and be easier to grow and improve over time. Taking the time to do things properly at the start isn't slower in the long run — it's actually the faster path to something that truly works.</p>",
      tags: ["Business Advice", "Process"],
    },
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

  return NextResponse.json({ status: "ok", results });
}
