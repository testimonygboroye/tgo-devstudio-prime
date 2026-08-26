import { PageContentType } from "@/models/PageContent";

interface PageDefault {
  title: string;
  content: string;
}

export const PAGE_DEFAULTS: Record<PageContentType, PageDefault> = {
  about: {
    title: "About TGO DevStudio",
    content: "<h2>Part of TGO</h2><p>TGO DevStudio is the full-stack software engineering arm of <strong>TGO</strong> &mdash; a parent brand built to house a family of ventures, each carrying the TGO name with its own distinct focus. DevStudio is where TGO's engineering work lives today; over time, other TGO-branded ventures will stand alongside it, each built with the same standard of craft.</p><h2>Why TGO DevStudio Exists</h2><p>TGO DevStudio exists to bring world-class engineering discipline to every project it takes on &mdash; built for everyone, without compromise. We believe great software shouldn't be defined by who can access it, but by the standard behind it. Every project that comes through TGO DevStudio is built the way we'd build it for ourselves: with full ownership of the outcome, from the first conversation to the day it ships, and long after.</p><h2>What We Stand For</h2><ul><li><strong>We don't ship anything we wouldn't trust in production ourselves.</strong> Quality isn't negotiable, regardless of project size or timeline.</li><li><strong>Every project gets the same standard.</strong> The same level of care and craftsmanship, every time.</li><li><strong>We explain our decisions.</strong> You'll always know why something was built the way it was &mdash; no black boxes, no unexplained trade-offs.</li><li><strong>We build for the long term.</strong> Code that's easy to maintain, extend, and hand off &mdash; not just code that works today.</li><li><strong>Security and quality are built in from day one</strong>, not bolted on after the fact.</li><li><strong>We stay honest</strong> about trade-offs, timelines, and limitations &mdash; even when it's the harder conversation to have.</li></ul>"
  },
  "privacy-policy": {
    title: "Privacy Policy",
    content: "<p><em>Last updated: [insert date when you publish this]</em></p><p>TGO DevStudio (\"we,\" \"us,\" or \"our\") operates the TGO DevStudio Prime website (the \"Site\"). This Privacy Policy explains what information we collect, how we use it, and the choices you have.</p><h2>Information We Collect</h2><p><strong>Contact Form Submissions.</strong> When you contact us, we collect your name, email address, the topic you select, and your message.</p><p><strong>Job Applications.</strong> When you apply for a role, we collect your name, email address, phone number (if provided), a cover message, a profile photo, and your resume/CV. This information is used solely to evaluate your application and is stored securely.</p><p><strong>Reviews and Feedback.</strong> When you submit a review, we collect your name, email address, your rating, and your written feedback. Your email address is used for accountability purposes and is never displayed publicly. Your name and review text may be displayed publicly once approved by our team.</p><p><strong>Cookies.</strong> We use cookies to remember your preferences (such as whether you've dismissed our cookie notice) and to support basic site functionality. We do not use cookies for third-party advertising.</p><p><strong>Automatically Collected Information.</strong> Like most websites, our hosting and infrastructure providers may automatically log basic technical information (such as IP address and browser type) for security and rate-limiting purposes, such as preventing spam submissions.</p><h2>How We Use Your Information</h2><ul><li>Respond to your inquiries</li><li>Evaluate job applications</li><li>Moderate and display reviews (only after approval)</li><li>Send you a confirmation when you submit a form</li><li>Protect the Site from spam and abuse</li></ul><p>We do not sell your personal information to third parties.</p><h2>Third-Party Services</h2><ul><li><strong>MongoDB Atlas</strong> &mdash; for secure database storage</li><li><strong>Cloudinary</strong> &mdash; for storing images, resumes, and other uploaded files</li><li><strong>Brevo</strong> &mdash; for sending email notifications (such as confirming your submission)</li><li><strong>Cloudflare Turnstile</strong> &mdash; for verifying that form submissions come from real visitors, not automated bots</li></ul><p>Each of these providers has its own privacy practices governing how they handle data on our behalf.</p><h2>Data Retention</h2><p>We retain contact messages, reviews, and job applications for as long as reasonably necessary for the purposes described above, or until you request deletion (see below).</p><h2>Your Rights</h2><p>You may request access to, correction of, or deletion of your personal information by contacting us at testimonygboroye.dev@gmail.com. We will respond to your request within a reasonable timeframe.</p><p>If you are located in the European Economic Area (EEA) or United Kingdom, you have additional rights under the General Data Protection Regulation (GDPR), including the right to lodge a complaint with your local data protection authority.</p><h2>Children's Privacy</h2><p>The Site is not directed at children under 13, and we do not knowingly collect personal information from children.</p><h2>Changes to This Policy</h2><p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated \"Last updated\" date.</p><h2>Contact Us</h2><p>If you have questions about this Privacy Policy, please contact us at testimonygboroye.dev@gmail.com.</p>"
  },
  "terms-of-service": {
    title: "Terms of Service",
    content: "<p><em>Last updated: [insert date when you publish this]</em></p><p>Welcome to TGO DevStudio Prime (the \"Site\"), operated by TGO DevStudio (\"we,\" \"us,\" or \"our\"). By accessing or using this Site, you agree to these Terms of Service. If you do not agree, please do not use the Site.</p><h2>Use of the Site</h2><p>You may use this Site to learn about our services, view our portfolio, apply for open roles, submit feedback, and contact us. You agree to use the Site only for lawful purposes and not to:</p><ul><li>Submit false, misleading, or fraudulent information</li><li>Attempt to disrupt, overload, or gain unauthorized access to the Site or its systems</li><li>Submit spam, abusive content, or content that infringes on others' rights</li><li>Use automated tools to scrape or extract content from the Site without permission</li></ul><h2>Job Applications</h2><p>By submitting a job application through this Site, you confirm that the information you provide is accurate to the best of your knowledge. Submitting an application does not guarantee an interview, offer, or response.</p><h2>Reviews and Feedback</h2><p>By submitting a review, you grant us permission to display your name and review content publicly on the Site if approved. We reserve the right to edit reviews for clarity (without changing their meaning), reject reviews that violate these Terms, or remove reviews at our discretion. Your email address will never be displayed publicly.</p><h2>Intellectual Property</h2><p>All content on this Site &mdash; including text, graphics, logos, and the TGO DevStudio brand &mdash; is the property of TGO DevStudio and may not be copied, reproduced, or used without our written permission, except as necessary to browse the Site normally.</p><p>Case studies and project details shown on this Site may reference work done for clients; where applicable, such content is shared with appropriate permission.</p><h2>No Warranty</h2><p>The Site is provided \"as is\" without warranties of any kind, express or implied. We do not guarantee that the Site will be available at all times, free of errors, or free of interruptions.</p><h2>Limitation of Liability</h2><p>To the fullest extent permitted by law, TGO DevStudio shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Site.</p><h2>Third-Party Links</h2><p>The Site may contain links to third-party websites (such as our social media profiles). We are not responsible for the content or practices of those third-party sites.</p><h2>Changes to These Terms</h2><p>We may update these Terms from time to time. Continued use of the Site after changes are posted constitutes your acceptance of the updated Terms.</p><h2>Governing Law</h2><p>These Terms are governed by the laws of the Federal Republic of Nigeria, without regard to conflict of law principles.</p><h2>Contact Us</h2><p>If you have questions about these Terms, please contact us at testimonygboroye.dev@gmail.com.</p>"
  }

export const ACCESSIBILITY_DEFAULT = {
  title: "Accessibility Statement",
  content: "<p>TGO DevStudio is committed to making this website usable by as many people as possible, including people with disabilities.</p><h2>Our Commitments</h2><ul><li>Semantic HTML structure and proper heading hierarchy throughout the site</li><li>Sufficient color contrast between text and background</li><li>Full keyboard navigation support \u2014 all interactive elements are reachable and usable without a mouse</li><li>Descriptive alt text required on every uploaded image</li><li>Clear, readable typography at appropriate sizes</li></ul><h2>Ongoing Work</h2><p>Accessibility is an ongoing process, not a one-time task. We continue to review and improve this site as it grows.</p><h2>Feedback</h2><p>If you encounter any accessibility barriers on this site, please contact us at testimonygboroye.dev@gmail.com so we can address them.</p>"
};
};

export const HOME_DEFAULTS = {
  heroHeadline: "Software Built Like It Matters",
  heroSubheadline:
    "TGO DevStudio is a full-stack engineering studio building production-grade products with real ownership, from first conversation to launch day.",
  primaryCtaLabel: "View Our Work",
  primaryCtaHref: "/portfolio",
  secondaryCtaLabel: "Start a Project",
  secondaryCtaHref: "/contact",
  caseStudiesLabel: "Selected Work",
  caseStudiesHeading: "Featured Case Studies",
  servicesLabel: "Capabilities",
  servicesHeading: "What We Do",
  processLabel: "Approach",
  processHeading: "How We Work",
  teamLabel: "People",
  teamHeading: "The Team",
  testimonialsLabel: "Testimonials",
  testimonialsHeading: "What People Say",
  blogLabel: "Insights",
  blogHeading: "From the Blog",
  careersLabel: "Careers",
  careersHeading: "We're Building Something Worth Joining",
  careersNoRolesMessage: "No open roles right now — but we're always building our culture and team.",
  finalCtaHeading: "Ready to Build Something Real?",
  finalCtaDescription: "Let's talk about what you're building and how TGO DevStudio can help bring it to life.",
  finalCtaButtonLabel: "Start a Conversation",
  statOneValue: "1+",
  statOneLabel: "Years Active",
  statTwoValue: "5+",
  statTwoLabel: "Projects Shipped",
  statThreeValue: "10+",
  statThreeLabel: "Technologies Mastered",

export const ACCESSIBILITY_DEFAULT = {
  title: "Accessibility Statement",
  content: "<p>TGO DevStudio is committed to making this website usable by as many people as possible, including people with disabilities.</p><h2>Our Commitments</h2><ul><li>Semantic HTML structure and proper heading hierarchy throughout the site</li><li>Sufficient color contrast between text and background</li><li>Full keyboard navigation support \u2014 all interactive elements are reachable and usable without a mouse</li><li>Descriptive alt text required on every uploaded image</li><li>Clear, readable typography at appropriate sizes</li></ul><h2>Ongoing Work</h2><p>Accessibility is an ongoing process, not a one-time task. We continue to review and improve this site as it grows.</p><h2>Feedback</h2><p>If you encounter any accessibility barriers on this site, please contact us at testimonygboroye.dev@gmail.com so we can address them.</p>"
};
};

export const AVAILABILITY_LABELS: Record<string, { label: string; color: string }> = {
  accepting: { label: "Currently accepting new projects", color: "bg-green-500" },
  limited: { label: "Limited availability", color: "bg-amber-500" },
  booked: { label: "Fully booked", color: "bg-red-500" },

export const ACCESSIBILITY_DEFAULT = {
  title: "Accessibility Statement",
  content: "<p>TGO DevStudio is committed to making this website usable by as many people as possible, including people with disabilities.</p><h2>Our Commitments</h2><ul><li>Semantic HTML structure and proper heading hierarchy throughout the site</li><li>Sufficient color contrast between text and background</li><li>Full keyboard navigation support \u2014 all interactive elements are reachable and usable without a mouse</li><li>Descriptive alt text required on every uploaded image</li><li>Clear, readable typography at appropriate sizes</li></ul><h2>Ongoing Work</h2><p>Accessibility is an ongoing process, not a one-time task. We continue to review and improve this site as it grows.</p><h2>Feedback</h2><p>If you encounter any accessibility barriers on this site, please contact us at testimonygboroye.dev@gmail.com so we can address them.</p>"
};
};

export const AVAILABILITY_DEFAULT = {
  state: "accepting",
  customMessage: "",

export const ACCESSIBILITY_DEFAULT = {
  title: "Accessibility Statement",
  content: "<p>TGO DevStudio is committed to making this website usable by as many people as possible, including people with disabilities.</p><h2>Our Commitments</h2><ul><li>Semantic HTML structure and proper heading hierarchy throughout the site</li><li>Sufficient color contrast between text and background</li><li>Full keyboard navigation support \u2014 all interactive elements are reachable and usable without a mouse</li><li>Descriptive alt text required on every uploaded image</li><li>Clear, readable typography at appropriate sizes</li></ul><h2>Ongoing Work</h2><p>Accessibility is an ongoing process, not a one-time task. We continue to review and improve this site as it grows.</p><h2>Feedback</h2><p>If you encounter any accessibility barriers on this site, please contact us at testimonygboroye.dev@gmail.com so we can address them.</p>"
};
};
