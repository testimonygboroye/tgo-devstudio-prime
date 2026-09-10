import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Role from "@/models/Role";
import BlogPost from "@/models/BlogPost";
import Project from "@/models/Project";
import TeamMember from "@/models/TeamMember";
import Service from "@/models/Service";
import ProcessStep from "@/models/ProcessStep";

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

  const [blogResult, projectResult, teamResult, serviceResult, processResult] = await Promise.all([
    BlogPost.updateMany({}, { createdBy: founder._id }),
    Project.updateMany({}, { createdBy: founder._id }),
    TeamMember.updateMany({}, { createdBy: founder._id }),
    Service.updateMany({}, { createdBy: founder._id }),
    ProcessStep.updateMany({}, { createdBy: founder._id }),
  ]);

  return NextResponse.json({
    status: "ok",
    reassignedTo: founder.email,
    counts: {
      blog: blogResult.modifiedCount,
      projects: projectResult.modifiedCount,
      team: teamResult.modifiedCount,
      services: serviceResult.modifiedCount,
      process: processResult.modifiedCount,
    },
  });
}
