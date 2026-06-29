import { InviteAcceptPage } from "@/features/team/components/invite-accept-page";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InviteAcceptPage invitationId={id} />;
}
