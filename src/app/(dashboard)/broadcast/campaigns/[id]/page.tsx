import { CampaignDetailPage } from "@/features/broadcast/components/campaigns/campaign-detail-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CampaignDetailPage campaignId={id} />;
}
