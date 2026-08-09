import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Project from "@/models/Project";
import TeamMember from "@/models/TeamMember";
import BlogPost from "@/models/BlogPost";
import JobOpening from "@/models/JobOpening";
import Review from "@/models/Review";
import { ReviewTargetType } from "@/lib/constants/reviewTargets";
import { getPubliclyVisibleFilter } from "@/lib/utils/blogVisibility";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetType = searchParams.get("targetType") as ReviewTargetType | null;

  if (!targetType) {
    return NextResponse.json({ status: "error", message: "targetType is required." }, { status: 400 });
  }

  await connectToDatabase();

  let items: { id: string; label: string }[] = [];

  switch (targetType) {
    case "caseStudy": {
      const projects = await Project.find({ publishStatus: "published" })
        .select("title")
        .sort({ title: 1 })
        .lean();
      items = projects.map((p) => ({ id: p._id.toString(), label: p.title }));
      break;
    }
    case "teamMember": {
      const members = await TeamMember.find({ publishStatus: "published" })
        .select("name jobTitle")
        .sort({ displayOrder: 1 })
        .lean();
      items = members.map((m) => ({ id: m._id.toString(), label: `${m.name} — ${m.jobTitle}` }));
      break;
    }
    case "blogPost": {
      const posts = await BlogPost.find(getPubliclyVisibleFilter())
        .select("title")
        .sort({ createdAt: -1 })
        .lean();
      items = posts.map((p) => ({ id: p._id.toString(), label: p.title }));
      break;
    }
    case "jobOpening": {
      const jobs = await JobOpening.find({ publishStatus: "published" })
        .select("title")
        .sort({ title: 1 })
        .lean();
      items = jobs.map((j) => ({ id: j._id.toString(), label: j.title }));
      break;
    }
    case "review": {
      const reviews = await Review.find({ status: "approved" })
        .select("submitterName body")
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
      items = reviews.map((r) => ({
        id: r._id.toString(),
        label: `${r.submitterName}: "${r.body.slice(0, 40)}${r.body.length > 40 ? "..." : ""}"`,
      }));
      break;
    }
    default:
      items = [];
  }

  return NextResponse.json({ status: "ok", items });
}
