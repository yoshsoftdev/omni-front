import { TagDetailPage } from "@/features/contacts/components/tag-detail-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TagDetailPage tagId={id} />;
}
