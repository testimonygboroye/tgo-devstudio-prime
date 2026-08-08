import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import TeamMember from "@/models/TeamMember";
import TeamMemberForm from "@/components/admin/TeamMemberForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTeamMemberPage({ params }: PageProps) {
  const { id } = await params;
  await connectToDatabase();
  const member = await TeamMember.findById(id).lean();

  if (!member) {
    notFound();
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Content</p>
      <h1 className="mt-1 text-3xl font-bold brand-gradient-text">Edit Team Member</h1>
      <div className="mt-8">
        <TeamMemberForm
          mode="edit"
          memberId={id}
          initialData={{
            name: member.name,
            jobTitle: member.jobTitle,
            bio: member.bio,
            photo: member.photo,
            linkedinUrl: member.linkedinUrl,
            githubUrl: member.githubUrl,
            twitterUrl: member.twitterUrl,
            displayOrder: member.displayOrder,
            publishStatus: member.publishStatus,
          }}
        />
      </div>
    </div>
  );
}
