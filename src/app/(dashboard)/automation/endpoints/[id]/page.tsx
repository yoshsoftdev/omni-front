"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";

import { EndpointDetailPage } from "@/features/automation/components/detail/endpoint-detail-page";

function EndpointDetailRoute() {
  const params = useParams<{ id: string }>();
  return <EndpointDetailPage endpointId={params.id} />;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-muted" />}>
      <EndpointDetailRoute />
    </Suspense>
  );
}
