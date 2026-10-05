import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import ContactSubmission, {
  ContactSubject,
} from "@/models/ContactSubmission";
import Visitor from "@/models/Visitor";
import {
  getAuthenticatedSession,
} from "@/lib/auth/session";
import {
  unauthorizedResponse,
  forbiddenResponse,
  requireContentPermission,
} from "@/lib/auth/authorize";
import {
  notifyNewContact,
} from "@/lib/email/notifyNewContact";
import {
  confirmContactReceived,
} from "@/lib/email/confirmContactReceived";
import {
  verifyTurnstileToken,
} from "@/lib/turnstile";

const CONTENT_TYPE = "contactSubmissions";

const RATE_LIMIT_WINDOW_MS =
  10 * 60 * 1000;

const RATE_LIMIT_MAX_SUBMISSIONS = 3;

const ALLOWED_SUBJECTS: ContactSubject[] = [
  "general",
  "project",
  "careers",
  "other",
];

const VISITOR_COOKIE = "tgo_visitor_id";

export async function POST(
  request: NextRequest
) {
  const body = await request.json();

  const {
    name,
    email,
    subject,
    message,
    companyWebsite,
    turnstileToken,
  } = body as {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
    companyWebsite?: string;
    turnstileToken?: string;
  };

  if (companyWebsite) {
    return NextResponse.json({
      status: "ok",
      message: "Message received.",
    });
  }

  if (!name || !email || !message) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "Name, email, and message are required.",
      },
      { status: 400 }
    );
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return NextResponse.json(
      {
        status: "error",
        message: "Invalid email format.",
      },
      { status: 400 }
    );
  }

  const remoteIp =
    request.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim();

  const isHuman =
    await verifyTurnstileToken(
      turnstileToken || "",
      remoteIp
    );

  if (!isHuman) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "Verification failed. Please try again.",
      },
      { status: 400 }
    );
  }

  const resolvedSubject: ContactSubject =
    ALLOWED_SUBJECTS.includes(
      subject as ContactSubject
    )
      ? (subject as ContactSubject)
      : "general";

  await connectToDatabase();

  const normalizedEmail =
    email.trim().toLowerCase();

  const recentCount =
    await ContactSubmission.countDocuments({
      createdAt: {
        $gte: new Date(
          Date.now() -
            RATE_LIMIT_WINDOW_MS
        ),
      },
      email: normalizedEmail,
    });

  if (
    recentCount >=
    RATE_LIMIT_MAX_SUBMISSIONS
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "Too many submissions. Please try again later.",
      },
      { status: 429 }
    );
  }

  const visitorId =
    request.cookies.get(
      VISITOR_COOKIE
    )?.value;

  const submission =
    await ContactSubmission.create({
      name: name.trim(),
      email: normalizedEmail,
      subject: resolvedSubject,
      message: message.trim(),
      visitorId,
    });

  if (visitorId) {
    await Visitor.findOneAndUpdate(
      { visitorId },
      {
        $set: {
          displayName: submission.name,
          email: submission.email,
        },
      }
    );
  }

  notifyNewContact({
    name: submission.name,
    email: submission.email,
    subject: submission.subject,
    message: submission.message,
    submissionId:
      submission._id.toString(),
  }).catch((err) =>
    console.error(
      "notifyNewContact failed:",
      err
    )
  );

  confirmContactReceived({
    name: submission.name,
    email: submission.email,
  }).catch((err) =>
    console.error(
      "confirmContactReceived failed:",
      err
    )
  );

  return NextResponse.json(
    {
      status: "ok",
      message: "Message received.",
    },
    { status: 201 }
  );
}

export async function GET(
  request: NextRequest
) {
  const session =
    await getAuthenticatedSession(request);

  if (!session) {
    return unauthorizedResponse();
  }

  if (
    !requireContentPermission(
      session,
      CONTENT_TYPE,
      "viewAnalytics"
    )
  ) {
    return forbiddenResponse(
      "You do not have permission to view contact messages."
    );
  }

  await connectToDatabase();

  const { searchParams } =
    new URL(request.url);

  const status =
    searchParams.get("status");

  const filter: Record<
    string,
    unknown
  > = {};

  if (status) {
    filter.status = status;
  }

  const submissions =
    await ContactSubmission.find(
      filter
    )
      .sort({ createdAt: -1 })
      .lean();

  return NextResponse.json({
    status: "ok",
    submissions,
  });
}
