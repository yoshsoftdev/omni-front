import { SegmentDetailPage } from "@/features/contacts/components/segment-detail-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SegmentDetailPage segmentId={id} />;
}
