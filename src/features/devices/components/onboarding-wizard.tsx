"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Users, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deviceService } from "@/features/devices/services/device.service";
import type { OnboardingStatusResponse } from "@/types/device";

interface OnboardingWizardProps {
  deviceId: string;
  deviceName: string;
}

export function OnboardingWizard({ deviceId, deviceName }: OnboardingWizardProps) {
  const router = useRouter();
  const [status, setStatus] = useState<OnboardingStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStarted, setSyncStarted] = useState(false);

  async function fetchStatus() {
    try {
      const data = await deviceService.getOnboardingStatus(deviceId);
      setStatus(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat status onboarding");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function startSync() {
    setError(null);
    try {
      const data = await deviceService.startOnboardingSync(deviceId);
      setStatus(data);
      setSyncStarted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memulai sync");
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const current = await fetchStatus();
      if (cancelled || !current) return;

      const needsSync =
        current.status === "pending" ||
        (!current.status && !current.completed_at);

      if (needsSync && !syncStarted) {
        await startSync();
        if (!cancelled) setSyncStarted(true);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  useEffect(() => {
    if (!syncStarted) return;
    if (status?.status === "completed" || status?.status === "failed") return;

    const timer = setInterval(() => {
      void fetchStatus();
    }, 3000);

    return () => clearInterval(timer);
  }, [syncStarted, status?.status, deviceId]);

  const isCompleted = status?.status === "completed";
  const isFailed = status?.status === "failed";
  const isSyncing =
    status?.status === "syncing_contacts" ||
    status?.status === "syncing_history" ||
    status?.status === "pending";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Onboarding WhatsApp Business</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sinkronisasi kontak dan riwayat chat untuk <span className="font-medium">{deviceName}</span>
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Memuat status...
          </div>
        ) : (
          <div className="space-y-6">
            <StepItem
              title="Impor Kontak"
              description="Mengambil kontak dari WhatsApp Business App"
              icon={<Users className="h-4 w-4" />}
              active={isSyncing && (status?.contacts_synced_count ?? 0) === 0}
              done={(status?.contacts_synced_count ?? 0) > 0 || isCompleted}
              meta={`${status?.contacts_synced_count ?? 0} kontak`}
            />

            <StepItem
              title="Impor Riwayat Chat"
              description="Mengimpor pesan hingga 6 bulan terakhir (jika disetujui di aplikasi)"
              icon={<MessageSquare className="h-4 w-4" />}
              active={isSyncing}
              done={isCompleted}
              meta={`${status?.history_messages_synced ?? 0} pesan · ${status?.history_sync_progress ?? 0}%`}
            />

            {isSyncing ? (
              <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Sinkronisasi berjalan. Biarkan WhatsApp Business App tetap aktif.
              </div>
            ) : null}

            {isCompleted ? (
              <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                <CheckCircle2 className="h-4 w-4" />
                Onboarding selesai. Kontak dan chat history siap digunakan.
              </div>
            ) : null}

            {(error || status?.error) && (isFailed || error) ? (
              <p className="text-sm text-destructive">{error ?? status?.error}</p>
            ) : null}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {isCompleted ? (
          <Button onClick={() => router.push("/inbox")}>Buka Inbox</Button>
        ) : (
          <Button variant="outline" onClick={() => void fetchStatus()} disabled={loading}>
            Refresh Status
          </Button>
        )}
        <Button variant="ghost" asChild>
          <Link href="/devices">Kembali ke Devices</Link>
        </Button>
      </div>
    </div>
  );
}

function StepItem({
  title,
  description,
  icon,
  active,
  done,
  meta,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  active?: boolean;
  done?: boolean;
  meta?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={[
          "flex h-9 w-9 items-center justify-center rounded-full border",
          done ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "",
          active && !done ? "border-primary bg-primary/10 text-primary" : "",
          !done && !active ? "border-border text-muted-foreground" : "",
        ].join(" ")}
      >
        {done ? <CheckCircle2 className="h-4 w-4" /> : icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium">{title}</h3>
          {meta ? <span className="text-xs text-muted-foreground">{meta}</span> : null}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
