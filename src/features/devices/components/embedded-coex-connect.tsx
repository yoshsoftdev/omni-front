"use client";

import { useState } from "react";
import { Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMetaEmbeddedSignup } from "@/features/devices/hooks/use-meta-embedded-signup";
import { deviceService } from "@/features/devices/services/device.service";

interface EmbeddedCoexConnectProps {
  deviceId: string;
  onConnected: (deviceId: string) => void;
  onCancel: () => void;
}

export function EmbeddedCoexConnect({ deviceId, onConnected, onCancel }: EmbeddedCoexConnectProps) {
  const { enabled, loading, launching, error, launch } = useMetaEmbeddedSignup();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleConnect() {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const result = await launch();
      await deviceService.connectEmbedded(deviceId, {
        code: result.code,
        waba_id: result.wabaId,
        phone_number_id: result.phoneNumberId,
      });
      onConnected(deviceId);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Gagal menghubungkan WhatsApp Business");
    } finally {
      setSubmitting(false);
    }
  }

  const displayError = submitError ?? error;

  return (
    <div className="mt-4 space-y-4 rounded-lg border bg-muted/30 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Smartphone className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold">Hubungkan WhatsApp Business (Coexistence)</h4>
          <p className="text-xs text-muted-foreground">
            Gunakan nomor WhatsApp Business App yang sudah ada. Setelah scan QR di aplikasi, Anda bisa
            mengimpor kontak dan riwayat chat hingga 6 bulan.
          </p>
        </div>
      </div>

      <ol className="list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
        <li>Klik tombol di bawah untuk membuka login Meta Embedded Signup</li>
        <li>Pilih &quot;Connect your existing WhatsApp Business App&quot;</li>
        <li>Scan QR code di WhatsApp Business App dan setujui sync kontak &amp; chat history</li>
      </ol>

      {loading ? (
        <p className="text-sm text-muted-foreground">Memuat konfigurasi Meta...</p>
      ) : !enabled ? (
        <p className="text-sm text-amber-600">
          Embedded Signup belum dikonfigurasi di server (META_APP_ID, META_EMBEDDED_CONFIG_ID).
        </p>
      ) : null}

      {displayError ? <p className="text-sm text-destructive">{displayError}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={handleConnect}
          disabled={!enabled || loading || launching || submitting}
        >
          {launching || submitting ? "Menghubungkan..." : "Login dengan Meta (Coex)"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={launching || submitting}>
          Batal
        </Button>
      </div>
    </div>
  );
}
