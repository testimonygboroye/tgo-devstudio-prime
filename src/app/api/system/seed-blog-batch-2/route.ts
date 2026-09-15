import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Role from "@/models/Role";
import BlogPost from "@/models/BlogPost";
import { slugify } from "@/lib/utils/slugify";

const posts = [
  {
    title: "What Is an API? A Real Example, Not Just an Analogy",
    excerpt: "You've heard APIs compared to waiters at a restaurant. Here's an actual, real API you've probably used today.",
    content: "<p>APIs are often explained using the restaurant analogy — you tell the waiter what you want, and the waiter brings it from the kitchen. That's a helpful starting picture, but here's a real, concrete example.</p><h2>A Real Example: Checking the Weather</h2><p>When a weather app on your phone shows you today's forecast, it doesn't calculate the weather itself. Instead, it sends a request to a weather service's API — for example, a request that essentially says 'give me the weather for Lagos, Nigeria.' The weather service's API responds with data like temperature, humidity, and forecast, and the app displays it to you.</p><h2>What That Request Actually Looks Like</h2><p>Behind the scenes, this often happens as a simple web address the app sends a request to, such as api.weatherservice.com/forecast?city=lagos. The API sends back the answer in a structured format the app can read and display neatly.</p><h2>Why This Matters</h2><p>Without APIs, every weather app would need to build and maintain its own network of weather sensors and satellites, which is unrealistic. APIs let businesses build on top of specialized services that already exist, instead of reinventing them.</p>",
    tags: ["APIs", "Beginner Guide"],
  },
  {
    title: "What Is a Database, With a Real Example",
    excerpt: "Databases are often described abstractly. Here's a real, concrete example of what one actually holds.",
    content: "<p>A database is where a website or app permanently stores its information. Rather than describing this abstractly, here's a real example.</p><h2>A Real Example: An Online Store</h2><p>Imagine an online clothing store. Its database holds real records such as: a product named 'Blue Cotton Shirt' priced at $25 with 40 units in stock, and a customer record with a name, email, and order history. When you search for 'blue shirt' on the site, the website asks the database for any product matching that description, and the database returns the matching real records.</p><h2>Why Not Just Use a Spreadsheet?</h2><p>A spreadsheet works fine for small amounts of data handled by one person. A real database is built to handle thousands or millions of records, multiple people reading and writing to it at the same time, and strict rules that prevent things like accidentally selling the same last item to two different customers at once.</p><h2>Why This Matters for Your Business</h2><p>Choosing the right database structure early affects how fast your site runs and how reliably your data stays accurate as your business grows.</p>",
    tags: ["Databases", "Beginner Guide"],
  },
  {
    title: "What Is Cloud Hosting, With a Real Example",
    excerpt: "Everyone says 'the cloud,' but what does that actually mean in practice? Here's a concrete example.",
    content: "<p>'The cloud' can sound abstract or even mysterious. In reality, it's simpler than it sounds.</p><h2>A Real Example</h2><p>Instead of a business buying and maintaining its own physical computer in an office to run its website, it rents space on someone else's powerful computer, located in a large data center. For example, a company called Render (which TGO DevStudio Prime itself runs on) owns real physical servers in data centers, and businesses pay to run their websites on those servers instead of buying their own.</p><h2>Why This Is Usually Better</h2><p>Buying, maintaining, and securing your own physical server is expensive and requires specialized expertise. Renting space on a cloud provider's servers means professionals handle the physical hardware, power, and network reliability, while you focus on your actual website or app.</p><h2>What 'Scaling in the Cloud' Really Means</h2><p>If your website suddenly gets a lot more visitors, a cloud provider can usually give your site access to more computing power quickly, without you needing to physically install new hardware.</p>",
    tags: ["Technology", "Beginner Guide"],
  },
  {
    title: "What Does 'Deploying' a Website Actually Mean?",
    excerpt: "You'll hear developers say a site has been 'deployed.' Here's exactly what that means, with a real example.",
    content: "<p>'Deploying' simply means taking a finished piece of code and making it live on the internet for real visitors to use.</p><h2>A Real Example</h2><p>A developer writes and tests code for a new 'Contact Us' page on their own computer first, where only they can see it. Once it's ready, they deploy it — meaning the code is copied onto the live server that powers the real, public website. After deployment, anyone visiting the website can now see and use the new Contact page.</p><h2>Why Deployment Isn't Instant Magic</h2><p>A responsible deployment process usually includes testing the code first, checking it doesn't break anything else on the site, and having a way to quickly undo the change if something unexpected goes wrong after it goes live.</p><h2>Why This Matters to You</h2><p>If your development team deploys carelessly, without proper testing, your live website can break unexpectedly, right in front of real customers. Asking how a team handles deployment is a fair, useful question to ask before hiring them.</p>",
    tags: ["Process", "Beginner Guide"],
  },
  {
    title: "What Is Two-Factor Authentication, With a Real Example",
    excerpt: "You've likely used this before without knowing its name. Here's what it is and why it matters.",
    content: "<p>Two-factor authentication, often shortened to 2FA, adds a second proof of identity beyond just a password.</p><h2>A Real Example</h2><p>When you log into your bank's app, you enter your password first. Then, the app asks for a 6-digit code, either sent to your phone by text message or generated by an authenticator app on your phone. Only after entering both the password and the code are you let in.</p><h2>Why This Extra Step Matters</h2><p>If someone steals or guesses your password, they still cannot get into your account without also having your physical phone to get the second code. This one extra step blocks the vast majority of real-world account break-ins.</p><h2>Where You've Likely Used This Already</h2><p>Many email providers, banking apps, and social media platforms now offer or require this. If you've ever been asked for a code after your password, you've already used 2FA.</p>",
    tags: ["Security", "Beginner Guide"],
  },
  {
    title: "What Is SSL/HTTPS, With a Real Example You See Daily",
    excerpt: "That little padlock icon in your browser isn't decoration. Here's what it actually does.",
    content: "<p>You've likely seen a small padlock icon next to a website's address in your browser. This represents something called HTTPS, powered by something called SSL.</p><h2>A Real Example</h2><p>When you type your card details into an online checkout page, HTTPS scrambles that information as it travels from your device to the website's server, so that if someone intercepted the data mid-transfer, they would only see meaningless scrambled text, not your actual card number.</p><h2>Why the Padlock Matters</h2><p>If a website's address starts with 'http' instead of 'https,' and shows no padlock, any information you type into it could potentially be seen by someone else on the same network. Legitimate websites handling any sensitive information should always show the padlock.</p><h2>Why This Matters for Your Own Website</h2><p>Search engines like Google actively favor and rank HTTPS websites higher, and browsers now warn visitors when a site lacks it. This is a basic requirement for any modern website, not an optional extra.</p>",
    tags: ["Security", "Beginner Guide"],
  },
  {
    title: "What Is a Domain Name, With a Real Example",
    excerpt: "You use domain names every day. Here's what's actually happening when you type one in.",
    content: "<p>A domain name is the readable web address you type into a browser, like google.com or tgo-devstudio-prime.onrender.com.</p><h2>A Real Example</h2><p>Every website actually lives at a numeric address called an IP address, something like 192.0.2.1, which is very hard for humans to remember. A domain name acts as a readable nickname that automatically points to that harder-to-remember numeric address behind the scenes.</p><h2>Why This Matters for Your Business</h2><p>A domain name is part of your brand identity. A domain like yourbusiness.com looks far more professional and is far easier for customers to remember and trust than a long, generic, free web address.</p><h2>What Happens When You Buy One</h2><p>You're essentially renting the exclusive right to use that specific readable name for a set period, usually renewed yearly, through a domain registrar.</p>",
    tags: ["Beginner Guide", "Business Advice"],
  },
  {
    title: "What Is Server-Side vs Client-Side Rendering?",
    excerpt: "This affects how fast your website feels to real visitors. Here's a simple, real explanation.",
    content: "<p>When a webpage loads, the actual visual content can be prepared in two different places: on the server, or on your own device.</p><h2>A Real Example: Server-Side Rendering</h2><p>Imagine ordering a fully cooked meal from a restaurant kitchen — it arrives ready to eat immediately. With server-side rendering, the website's server fully prepares the finished webpage and sends it to your browser ready to display right away.</p><h2>A Real Example: Client-Side Rendering</h2><p>Imagine instead being handed raw ingredients and a recipe, and having to cook the meal yourself before eating. With client-side rendering, your browser receives a smaller starting file and has to do extra work itself to build the final page you see.</p><h2>Why This Actually Matters</h2><p>Server-side rendering usually means visitors see meaningful content faster, especially on slower devices or connections, and it also tends to help search engines understand your page better.</p>",
    tags: ["Technology", "Performance"],
  },
  {
    title: "What Does 'Open Source' Software Actually Mean?",
    excerpt: "You've probably used open-source software without realizing it. Here's what the term really means.",
    content: "<p>Open-source software is software whose actual underlying code is made publicly available for anyone to see, use, and even modify.</p><h2>A Real Example</h2><p>WordPress, one of the most widely used website-building tools in the world, is open source. Anyone can view its actual code, and thousands of independent developers around the world contribute improvements to it.</p><h2>Why This Matters</h2><p>Open-source tools are often free to use, benefit from large communities finding and fixing problems, and give businesses more flexibility since they aren't locked into one company's private, closed system.</p><h2>The Trade-Off Worth Knowing</h2><p>Because anyone can see open-source code, security researchers can find and report weaknesses, but so could someone with bad intentions. Reputable open-source projects handle this through active maintenance and quick security fixes.</p>",
    tags: ["Technology", "Beginner Guide"],
  },
  {
    title: "What Is a Content Delivery Network (CDN)?",
    excerpt: "This is one reason big websites load fast worldwide. Here's a real explanation with an example.",
    content: "<p>A Content Delivery Network, or CDN, is a system of servers placed in many different physical locations around the world.</p><h2>A Real Example</h2><p>Imagine your website's server is physically located in the United States. Without a CDN, someone visiting your site from Nigeria has to wait for data to travel all the way across the ocean. With a CDN, a copy of your website's images and files is also stored on servers closer to Nigeria, so that visitor gets served from a nearby copy instead, loading much faster.</p><h2>Why This Matters</h2><p>If your customers are spread across different countries, a CDN can make a real, noticeable difference in how fast your site feels to each of them, regardless of where your main server is located.</p><h2>Who This Benefits Most</h2><p>Any business with visitors spread across different regions or countries benefits from this — not just large global companies.</p>",
    tags: ["Performance", "Technology"],
  },
  {
    title: "What Is Version Control, With a Real Example",
    excerpt: "This is one of the most important habits in professional software development. Here's what it actually does.",
    content: "<p>Version control is a system that tracks every change made to a project's code over time, like a detailed history log.</p><h2>A Real Example</h2><p>Imagine a developer accidentally breaks a working website while adding a new feature. With proper version control (commonly done using a tool called Git), they can look back through the exact history of every change made, find precisely which change caused the problem, and safely reverse just that one change, without losing any other work.</p><h2>Why This Matters Beyond Just 'Undo'</h2><p>Version control also allows multiple developers to work on the same project at the same time without overwriting each other's work, since every change is tracked and can be properly combined.</p><h2>Why This Matters to You as a Business Owner</h2><p>A development team using proper version control has a real safety net and audit trail. A team without it is taking unnecessary risks with your project.</p>",
    tags: ["Process", "Technology"],
  },
  {
    title: "What Is A/B Testing, With a Real Example",
    excerpt: "Big companies use this constantly to improve their websites. Here's how it actually works.",
    content: "<p>A/B testing means showing two slightly different versions of something to different visitors, then measuring which version performs better.</p><h2>A Real Example</h2><p>Imagine an online store wants to know if a green 'Buy Now' button gets more clicks than a blue one. They show the green button to half of their visitors, and the blue button to the other half, at the same time. After enough visitors, they compare the results and see which color actually led to more purchases.</p><h2>Why Guessing Isn't Enough</h2><p>People are often wrong about what they assume customers will prefer. A/B testing replaces guesswork with real evidence from real visitor behavior.</p><h2>Where This Applies Beyond Buttons</h2><p>Businesses commonly A/B test headlines, page layouts, pricing displays, and email subject lines, using real data to make decisions instead of opinions alone.</p>",
    tags: ["Business Advice", "Design"],
  },
  {
    title: "What Is a Webhook, With a Real Example",
    excerpt: "Webhooks quietly power a lot of automation you rely on. Here's a concrete explanation.",
    content: "<p>A webhook is a way for one system to automatically notify another system the instant something specific happens, instead of that other system having to constantly check for updates.</p><h2>A Real Example</h2><p>When a customer completes a payment through a payment provider like Stripe, Stripe can automatically send a webhook — essentially an instant notification — to the business's own system, saying 'payment received for order #4521.' The business's system can then immediately mark that order as paid and start preparing it for shipping, without any human needing to manually check.</p><h2>Why This Beats the Alternative</h2><p>Without webhooks, a system would have to repeatedly ask 'has anything changed yet?' every few seconds, which wastes resources and introduces delay. Webhooks let updates happen instantly, only when something real actually occurs.</p><h2>Where This Shows Up in Real Businesses</h2><p>Automated order confirmations, instant shipping updates, and real-time inventory syncing between systems are commonly powered by webhooks working quietly behind the scenes.</p>",
    tags: ["APIs", "Technology"],
  },
  {
    title: "What Is Load Testing, With a Real Example",
    excerpt: "This is how serious platforms avoid crashing under real-world pressure. Here's how it works.",
    content: "<p>Load testing means deliberately simulating a large number of visitors using a website or app at once, before real users ever do, to see how it holds up.</p><h2>A Real Example</h2><p>Imagine an online ticket-selling website expecting thousands of people to try buying tickets the instant a popular concert goes on sale. Before that day arrives, the development team can run a load test — using automated tools to simulate thousands of fake visitors hitting the site at the exact same moment — to see if the site slows down, crashes, or handles it smoothly.</p><h2>Why This Matters</h2><p>Discovering that your website crashes under heavy traffic is far better done in a controlled test beforehand than during the real, high-stakes moment when actual paying customers are trying to use your site.</p><h2>Who Actually Needs This</h2><p>Any business expecting a sudden spike in visitors — a big sale, a product launch, a viral moment — benefits from knowing their site can actually handle it in advance.</p>",
    tags: ["Performance", "Process"],
  },
  {
    title: "What Is Technical Debt, With a Real Example",
    excerpt: "This term explains why some 'quick fixes' quietly cost businesses more later. Here's a real example.",
    content: "<p>Technical debt refers to the extra future cost created when a quick, imperfect solution is used now instead of a proper, well-built one.</p><h2>A Real Example</h2><p>A team under deadline pressure hardcodes a discount rule directly into their checkout code, rather than building a proper, flexible discount system. It works for the immediate launch. But six months later, when the business wants to run three different promotions at once, the developer has to carefully rewrite that same rushed code from scratch, at a much higher cost than if it had been built properly the first time.</p><h2>Why This Isn't Always Avoidable</h2><p>Sometimes a quick solution is genuinely the right business decision to meet an urgent deadline. The real problem is when technical debt is created silently, without anyone tracking or acknowledging it, so it quietly piles up unnoticed.</p><h2>Why This Matters to You</h2><p>A good development partner will be upfront when they're taking a shortcut, and why, so you can make an informed decision rather than being surprised by hidden costs later.</p>",
    tags: ["Business Advice", "Process"],
  },
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

  for (const post of posts) {
    const slug = slugify(post.title);
    const existing = await BlogPost.findOne({ slug });
    if (existing) {
      skipped++;
      continue;
    }
    await BlogPost.create({
      title: post.title,
      slug,
      excerpt: post.excerpt,
      contentHtml: post.content,
      tags: post.tags,
      publishStatus: "published",
      featured: false,
      createdBy: founder._id,
    });
    created++;
  }

  return NextResponse.json({ status: "ok", created, skipped });
}
