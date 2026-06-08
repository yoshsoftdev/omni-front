import { CampaignReportDetailPage } from "@/features/broadcast/components/campaign-report-detail-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CampaignReportDetailPage campaignId={id} />;
}
