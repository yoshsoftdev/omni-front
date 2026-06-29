"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, ChevronRight, ArrowRight, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";

import { CampaignSummaryCard } from "@/features/broadcast/_legacy/components/campaign-summary-card";
import { LiveWhatsAppPreview } from "@/features/broadcast/components/live-whatsapp-preview";
import { campaignService, templateService } from "@/features/broadcast/services/broadcast.service";
import {
  parseTemplateComponents,
  resolveContactFieldValue,
} from "@/features/broadcast/utils/template-components";
import { SegmentPicker } from "@/features/segments/components/segment-picker";
import { segmentService } from "@/features/segments/services/segment.service";
import type { Segment } from "@/features/segments/types/segment";
import { segmentAudienceSummary } from "@/features/segments/utils/segment-audience";
import { contactService } from "@/features/contacts/services/contact.service";
import { deviceService } from "@/features/devices/services/device.service";
import { CONTACT_FIELD_OPTIONS } from "@/types/broadcast";

type CampaignStep = 1 | 2 | 3 | 4 | 5;

const steps: { step: CampaignStep; label: string }[] = [
  { step: 1, label: "Pengaturan Campaign" },
  { step: 2, label: "Template & Pesan" },
  { step: 3, label: "Audiences" },
  { step: 4, label: "Jadwal" },
  { step: 5, label: "Konfirmasi" },
];

function Stepper({ activeStep }: { activeStep: CampaignStep }) {
  return (
    <div className="flex items-center gap-8 overflow-x-auto">
      {steps.map((s) => {
        const done = activeStep > s.step;
        const active = activeStep === s.step;
        return (
          <div key={s.step} className="flex items-center gap-2 whitespace-nowrap">
            <div
              className={[
                "inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm",
                done ? "border-primary bg-primary text-primary-foreground" : "",
                active && !done ? "border-primary/50 bg-background text-foreground" : "",
                !done && !active ? "border-border bg-muted text-muted-foreground" : "",
              ].join(" ")}
            >
              {done ? <Check className="h-4 w-4" /> : <span className="text-sm">{s.step}</span>}
            </div>
            <div className={done || active ? "text-sm font-medium text-foreground" : "text-sm text-muted-foreground"}>
              {s.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TemplateStatusBadge({ status }: { status?: string }) {
  const normalized = (status ?? "").toUpperCase();
  const variant =
    normalized === "APPROVED"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : normalized === "PENDING"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-rose-50 text-rose-700 border-rose-200";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        variant,
      ].join(" ")}
    >
      {status ?? "—"}
    </span>
  );
}

export function CampaignWizard() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState<CampaignStep>(1);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const [campaignName, setCampaignName] = useState("");
  const [description, setDescription] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [variableMapping, setVariableMapping] = useState<Record<string, string>>({});
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [segments, setSegments] = useState<Segment[]>([]);

  useEffect(() => {
    segmentService.list().then(setSegments);
  }, []);

  const { data: devices = [], isLoading: devicesLoading } = useQuery({
    queryKey: ["devices"],
    queryFn: () => deviceService.list(),
  });

  const connectedDevices = devices.filter((d) => d.status === "connected");

  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => (await contactService.list()).items,
  });

  const { data: templates = [], isLoading: templatesLoading, refetch: refetchTemplates } = useQuery({
    queryKey: ["broadcast-templates", deviceId],
    queryFn: () => templateService.list({ device_id: deviceId, status: "APPROVED" }),
    enabled: Boolean(deviceId),
  });

  useEffect(() => {
    if (!deviceId && connectedDevices[0]?.id) {
      setDeviceId(connectedDevices[0].id);
    }
  }, [connectedDevices, deviceId]);

  useEffect(() => {
    if (!templateId && templates[0]?.id) {
      setTemplateId(templates[0].id);
    }
  }, [templates, templateId]);

  const selectedDevice = useMemo(
    () => connectedDevices.find((d) => d.id === deviceId) ?? connectedDevices[0],
    [connectedDevices, deviceId],
  );

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === templateId) ?? templates[0],
    [templates, templateId],
  );

  const parsedTemplate = useMemo(
    () => (selectedTemplate ? parseTemplateComponents(selectedTemplate) : null),
    [selectedTemplate],
  );

  useEffect(() => {
    if (!parsedTemplate) return;
    setVariableMapping((prev) => {
      const next: Record<string, string> = {};
      for (let i = 1; i <= parsedTemplate.variableCount; i += 1) {
        const key = String(i);
        next[key] = prev[key] ?? CONTACT_FIELD_OPTIONS[0]?.value ?? "name";
      }
      return next;
    });
  }, [parsedTemplate?.variableCount, selectedTemplate?.id]);

  const sampleContact = contacts[0];

  const mappingValuesForPreview = useMemo(() => {
    const out: Record<string, string> = {};
    if (!parsedTemplate) return out;
    for (let i = 1; i <= parsedTemplate.variableCount; i += 1) {
      const key = String(i);
      const field = variableMapping[key];
      out[key] = resolveContactFieldValue(field, sampleContact);
    }
    return out;
  }, [parsedTemplate, variableMapping, sampleContact]);

  const audienceText = useMemo(() => {
    if (activeStep < 3) return "Belum dipilih";
    return segmentAudienceSummary(segments, selectedSegmentIds);
  }, [activeStep, segments, selectedSegmentIds]);

  const scheduleText = useMemo(() => {
    if (activeStep < 4) return "Belum dijadwalkan";
    if (!scheduledAt) return "Kirim segera setelah konfirmasi";
    const d = new Date(scheduledAt);
    return Number.isNaN(d.getTime()) ? scheduledAt : d.toLocaleString("id-ID");
  }, [activeStep, scheduledAt]);

  const continueLabel = useMemo(() => {
    switch (activeStep) {
      case 1:
        return "Lanjut: Template & Pesan";
      case 2:
        return "Lanjut: Pilih Audiences";
      case 3:
        return "Lanjut: Jadwal";
      case 4:
        return "Lanjut: Konfirmasi";
      case 5:
        return "Confirm & Send";
    }
  }, [activeStep]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const bodyMapping: Record<string, string> = {};
      Object.entries(variableMapping).forEach(([key, value]) => {
        bodyMapping[key] = value;
      });

      const payload = {
        name: campaignName.trim(),
        device_id: deviceId,
        template_id: templateId,
        variable_mapping: { body: bodyMapping },
        segment_ids: selectedSegmentIds,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      };

      const created = await campaignService.create(payload);
      const isFutureSchedule =
        scheduledAt && new Date(scheduledAt).getTime() > Date.now();

      if (!isFutureSchedule) {
        await campaignService.send(created.id);
      }

      return created;
    },
    onSuccess: (created) => {
      router.push(`/broadcast/reports/${created.id}`);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Gagal membuat campaign");
    },
  });

  function validateStep(step: CampaignStep): string | null {
    if (step === 1 && !campaignName.trim()) return "Nama campaign wajib diisi";
    if (step === 2) {
      if (!deviceId) return "Pilih device WABA terlebih dahulu";
      if (!templateId) return "Pilih template terlebih dahulu";
    }
    if (step === 3 && selectedSegmentIds.length === 0) {
      return "Pilih minimal satu segment";
    }
    return null;
  }

  function handleContinue() {
    setError(null);
    const validationError = validateStep(activeStep);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (activeStep === 5) {
      submitMutation.mutate();
      return;
    }
    setActiveStep((prev) => (prev + 1) as CampaignStep);
  }

  async function handleSyncTemplates() {
    if (!deviceId) return;
    setSyncing(true);
    setError(null);
    try {
      await templateService.sync(deviceId);
      await refetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal sync template");
    } finally {
      setSyncing(false);
    }
  }

  const isLoading = devicesLoading || contactsLoading || templatesLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buat Campaign Broadcast"
        description="A Broadcast > Campaign > Buat Campaign"
      />

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-lg border bg-card p-8 text-sm text-muted-foreground">
          Memuat data...
        </div>
      ) : connectedDevices.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-sm text-muted-foreground">
          Tidak ada device WABA terhubung. Hubungkan device terlebih dahulu di pengaturan.
        </div>
      ) : (
        <div className="flex gap-6">
          <div className="flex-1">
            <Stepper activeStep={activeStep} />

            <div className="mt-6">
              {activeStep === 1 ? (
                <div className="space-y-4">
                  <div className="rounded-lg border bg-card p-4">
                    <div className="text-sm font-semibold">Informasi Campaign</div>
                    <div className="mt-4 grid gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="campaign-name">Nama Campaign</Label>
                          <div className="text-xs text-muted-foreground">{campaignName.length}/200</div>
                        </div>
                        <Input
                          id="campaign-name"
                          value={campaignName}
                          maxLength={200}
                          onChange={(e) => setCampaignName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="campaign-desc">Deskripsi (Optional)</Label>
                          <div className="text-xs text-muted-foreground">{description.length}/200</div>
                        </div>
                        <textarea
                          id="campaign-desc"
                          className="min-h-[92px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
                          value={description}
                          maxLength={200}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <Button type="button" onClick={handleContinue}>
                      {continueLabel} <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : null}

              {activeStep === 2 ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border bg-card p-4">
                      <div className="text-sm font-semibold">Pilih WABA / Device</div>
                      <div className="mt-4 space-y-2">
                        <Label htmlFor="device-select">Pilih WABA</Label>
                        <select
                          id="device-select"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={deviceId}
                          onChange={(e) => {
                            setDeviceId(e.target.value);
                            setTemplateId("");
                          }}
                        >
                          {connectedDevices.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                        <div className="text-xs text-muted-foreground">
                          {selectedDevice?.phone_number ?? "—"}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border bg-card p-4">
                      <div className="text-sm font-semibold">Ringkasan</div>
                      <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                        <div>Nama: {campaignName || "—"}</div>
                        {description ? <div>Deskripsi: {description}</div> : null}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold">Pilih Template WhatsApp (Meta)</div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleSyncTemplates}
                        disabled={syncing || !deviceId}
                      >
                        <RefreshCw className={syncing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                        Sync Template
                      </Button>
                    </div>

                    <div className="mt-4 space-y-2">
                      {templatesLoading ? (
                        <p className="text-sm text-muted-foreground">Memuat template...</p>
                      ) : templates.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Belum ada template. Sync dari Meta terlebih dahulu.
                        </p>
                      ) : (
                        templates.map((t) => {
                          const active = t.id === templateId;
                          return (
                            <div
                              key={t.id}
                              className={[
                                "flex items-center justify-between gap-4 rounded-md border p-3",
                                active ? "border-primary" : "border-border",
                              ].join(" ")}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name="template"
                                  checked={active}
                                  onChange={() => setTemplateId(t.id)}
                                />
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm font-medium">{t.name}</div>
                                    <TemplateStatusBadge status={t.status} />
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Bahasa: {t.language} • Kategori: {t.category ?? "—"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {parsedTemplate && parsedTemplate.variableCount > 0 ? (
                    <div className="rounded-lg border bg-card p-4">
                      <div className="text-sm font-semibold">Variabel Template</div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Petakan variabel template dengan data kontak Anda
                      </div>

                      <div className="mt-4 overflow-hidden rounded-md border">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Variabel</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Petakan dengan</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from({ length: parsedTemplate.variableCount }, (_, idx) => idx + 1).map((n) => {
                              const key = String(n);
                              return (
                                <tr key={key} className="border-t">
                                  <td className="px-3 py-3 font-medium text-sm">{`{{${key}}}`}</td>
                                  <td className="px-3 py-3">
                                    <select
                                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                                      value={variableMapping[key] ?? "name"}
                                      onChange={(e) =>
                                        setVariableMapping((prev) => ({
                                          ...prev,
                                          [key]: e.target.value,
                                        }))
                                      }
                                    >
                                      {CONTACT_FIELD_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between">
                    <Button type="button" variant="outline" onClick={() => setActiveStep(1)}>
                      Back
                    </Button>
                    <Button type="button" onClick={handleContinue}>
                      {continueLabel} <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : null}

              {activeStep === 3 ? (
                <div className="space-y-4">
                  <div className="rounded-lg border bg-card p-4">
                    <div className="text-sm font-semibold">Pilih Segment Audience</div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Campaign audiences use saved segments (dynamic filters), not individual tags.
                    </p>
                    <div className="mt-4">
                      <SegmentPicker
                        segments={segments}
                        selectedIds={selectedSegmentIds}
                        onChange={setSelectedSegmentIds}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Button type="button" variant="outline" onClick={() => setActiveStep(2)}>
                      Back
                    </Button>
                    <Button type="button" onClick={handleContinue}>
                      {continueLabel} <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : null}

              {activeStep === 4 ? (
                <div className="space-y-4">
                  <div className="rounded-lg border bg-card p-4">
                    <div className="text-sm font-semibold">Jadwal</div>
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="schedule">Schedule Time (opsional)</Label>
                      <Input
                        id="schedule"
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                      />
                      <div className="text-xs text-muted-foreground">
                        Kosongkan untuk kirim segera setelah konfirmasi. Isi untuk menjadwalkan pengiriman.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Button type="button" variant="outline" onClick={() => setActiveStep(3)}>
                      Back
                    </Button>
                    <Button type="button" onClick={handleContinue}>
                      {continueLabel} <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : null}

              {activeStep === 5 ? (
                <div className="space-y-4">
                  <div className="rounded-lg border bg-card p-4">
                    <div className="text-sm font-semibold">Konfirmasi</div>
                    <div className="mt-3 text-sm text-muted-foreground">
                      Pastikan semua informasi sudah benar sebelum mengirim campaign broadcast.
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Nama Campaign</Label>
                        <div className="mt-2 rounded-md border bg-background px-3 py-2 text-sm">
                          {campaignName}
                        </div>
                      </div>
                      <div>
                        <Label>Template</Label>
                        <div className="mt-2 rounded-md border bg-background px-3 py-2 text-sm">
                          {selectedTemplate?.name ?? "—"}
                        </div>
                      </div>
                      <div>
                        <Label>Audiences</Label>
                        <div className="mt-2 rounded-md border bg-background px-3 py-2 text-sm">
                          {audienceText}
                        </div>
                      </div>
                      <div>
                        <Label>Jadwal</Label>
                        <div className="mt-2 rounded-md border bg-background px-3 py-2 text-sm">
                          {scheduleText}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Button type="button" variant="outline" onClick={() => setActiveStep(4)}>
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={handleContinue}
                      disabled={submitMutation.isPending}
                    >
                      {submitMutation.isPending ? "Mengirim..." : continueLabel}{" "}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {parsedTemplate && selectedTemplate && selectedDevice ? (
            <div className="w-[360px] shrink-0 space-y-4">
              <LiveWhatsAppPreview
                body={parsedTemplate.body}
                footer={parsedTemplate.footer}
                headerType={parsedTemplate.headerType}
                buttons={parsedTemplate.buttons}
                language={selectedTemplate.language}
                deviceName={selectedDevice.name}
                mappingValuesForPreview={mappingValuesForPreview}
              />
              <CampaignSummaryCard
                deviceName={selectedDevice.name}
                templateName={selectedTemplate.name}
                language={selectedTemplate.language}
                variableCount={parsedTemplate.variableCount}
                audienceText={audienceText}
                scheduleText={scheduleText}
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
