"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, MoreHorizontal } from "lucide-react";

import { PageTabs } from "@/components/shared/page-tabs";
import { StatsCard } from "@/components/shared/stats-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { DeliveryDonutChart } from "@/features/broadcast/components/delivery-donut-chart";
import { HourlyBarChart } from "@/features/broadcast/components/hourly-bar-chart";
import { campaignService } from "@/features/broadcast/services/broadcast.service";
import { campaignStatusLabels } from "@/features/broadcast/utils/campaign-status";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function pct(value: number, total: number) {
  if (total <= 0) return "0%";
  return `${((value / total) * 100).toFixed(1)}%`;
}

export function CampaignReportDetailPage({ campaignId }: { campaignId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["broadcast-report-detail", campaignId],
    queryFn: () => campaignService.report(campaignId),
  });

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-8 text-sm text-muted-foreground">
        Memuat detail campaign...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/broadcast/reports">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Reports
          </Link>
        </Button>
        <div className="rounded-lg border bg-card p-8 text-sm text-destructive">
          Campaign report tidak ditemukan.
        </div>
      </div>
    );
  }

  const deliveryRate = pct(data.delivered_count, data.sent_count);
  const readRate = pct(data.read_count, data.sent_count);
  const failedRate = pct(data.failed_count, data.sent_count);

  const deliveryBreakdown = (data.delivery_breakdown ?? []).map((item) => ({
    label: item.label,
    value: item.value,
  }));

  const hourlyPerformance = (data.hourly_performance ?? []).map((item) => ({
    hour: item.hour,
    count: item.count,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
            <Link href="/broadcast/reports">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Reports
            </Link>
          </Button>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{data.name}</h1>
            <StatusBadge status={campaignStatusLabels[data.status]} />
          </div>

          <p className="text-sm text-muted-foreground">
            {data.device_name ?? "—"} · {data.device_phone ?? "—"} · Template:{" "}
            {data.template_name ?? "—"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" type="button" disabled>
            <Download className="h-4 w-4" />
            Unduh Laporan
          </Button>
          <Button variant="ghost" size="sm" type="button" disabled>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <PageTabs
        tabs={[
          { value: "summary", label: "Ringkasan" },
          { value: "performance", label: "Performa" },
          { value: "contacts", label: "Kontak" },
          { value: "messages", label: "Pesan" },
        ]}
        value="summary"
        onChange={() => {}}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatsCard title="Target Kontak" value={data.total_contacts.toLocaleString("id-ID")} />
        <StatsCard title="Terkirim" value={data.sent_count.toLocaleString("id-ID")} />
        <StatsCard
          title="Terkirim (Delivered)"
          value={data.delivered_count.toLocaleString("id-ID")}
          suffix={deliveryRate}
        />
        <StatsCard title="Terbaca" value={data.read_count.toLocaleString("id-ID")} suffix={readRate} />
        <StatsCard title="Gagal" value={data.failed_count.toLocaleString("id-ID")} suffix={failedRate} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-4 md:p-6">
          <h2 className="text-sm font-semibold">Status Pengiriman</h2>
          <div className="mt-6">
            {deliveryBreakdown.length > 0 ? (
              <DeliveryDonutChart data={deliveryBreakdown} />
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada data pengiriman.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 md:p-6">
          <h2 className="text-sm font-semibold">Performa per Jam</h2>
          <p className="mt-1 text-xs text-muted-foreground">Volume pengiriman dalam 24 jam</p>
          <div className="mt-6">
            {hourlyPerformance.length > 0 ? (
              <HourlyBarChart data={hourlyPerformance} />
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada data performa per jam.</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4 md:p-6">
        <h2 className="text-sm font-semibold">Informasi Campaign</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem label="Dibuat Pada" value={formatDateTime(data.created_at)} />
          <InfoItem label="WABA / Device" value={data.device_name ?? "—"} />
          <InfoItem label="Template" value={data.template_name ?? "—"} />
          <InfoItem label="Bahasa" value={data.template_language ?? "—"} />
          <InfoItem label="Kategori" value={data.template_category ?? "—"} />
          {data.scheduled_at ? (
            <InfoItem label="Jadwal" value={formatDateTime(data.scheduled_at)} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
