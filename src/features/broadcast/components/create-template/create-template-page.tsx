"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { contactService } from "@/features/contacts/services/contact.service";
import { deviceService } from "@/features/devices/services/device.service";
import { TemplateBodyEditor } from "@/features/broadcast/components/create-template/template-body-editor";
import { TemplateButtonEditor } from "@/features/broadcast/components/create-template/template-button-editor";
import { TemplateCreateStepper } from "@/features/broadcast/components/create-template/template-create-stepper";
import { TemplateFooterEditor } from "@/features/broadcast/components/create-template/template-footer-editor";
import {
  TemplateHeaderEditorSection,
} from "@/features/broadcast/components/create-template/template-header-editor";
import { TemplateInfoCard } from "@/features/broadcast/components/create-template/template-info-card";
import { VariableDetector } from "@/features/broadcast/components/create-template/variable-detector";
import { WhatsAppPreview } from "@/features/broadcast/components/create-template/whatsapp-preview";
import { defaultCreateTemplateForm } from "@/features/broadcast/mock/create-template.mock";
import { templateService } from "@/features/broadcast/services/broadcast.service";
import type { CreateTemplateForm } from "@/features/broadcast/types/create-template";
import { buildCreateTemplatePayload } from "@/features/broadcast/utils/build-meta-template";
import {
  applyContactSamples,
  detectVariables,
  validateCreateTemplateForm,
} from "@/features/broadcast/utils/create-template.utils";
import { useAuthStore } from "@/store/auth-store";

function ImportantNotes() {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
      <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Catatan Penting</div>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-emerald-700 dark:text-emerald-400">
        <li>Template dikirim ke Meta untuk review (status awal: PENDING).</li>
        <li>Pastikan konten sesuai kategori dan kebijakan WhatsApp Business.</li>
        <li>Setelah disetujui, template bisa dipakai di campaign broadcast.</li>
      </ul>
    </div>
  );
}

export function CreateTemplatePage() {
  const router = useRouter();
  const [form, setForm] = useState<CreateTemplateForm>(defaultCreateTemplateForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const team = useAuthStore((state) => state.team);

  const { data: devices = [] } = useQuery({
    queryKey: ["devices"],
    queryFn: () => deviceService.list(),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => contactService.list(),
  });

  const previewDeviceName = useMemo(() => {
    const selected = devices.find((device) => device.id === form.deviceId);
    return selected?.name ?? team?.name ?? "WhatsApp Business";
  }, [devices, form.deviceId, team?.name]);

  const variables = useMemo(
    () => applyContactSamples(detectVariables(form.body), contacts[0]),
    [form.body, contacts],
  );

  function updateForm(patch: Partial<CreateTemplateForm>) {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      if (patch.headerType && patch.headerType !== "none" && !next.headerFileName) {
        next.headerFileName = "hydrabalance-product.jpg";
      }
      if (patch.headerType === "none") {
        next.headerFileName = undefined;
      }
      return next;
    });
  }

  async function handleSubmit() {
    const validationError = validateCreateTemplateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const payload = buildCreateTemplatePayload(form, variables);
      await templateService.create(payload);
      router.push("/broadcast/templates");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat template di Meta");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
        <Link href="/broadcast/templates">
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Buat Template WhatsApp (Meta)</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Template akan dikirim ke Meta Cloud API untuk proses review.
        </p>
      </div>

      <TemplateCreateStepper activeStep={1} />

      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1 space-y-4">
          <TemplateInfoCard form={form} onChange={updateForm} />

          <div className="rounded-lg border bg-card p-4 md:p-6">
            <h2 className="text-sm font-semibold">Komponen Template</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Gunakan {"{{1}}"}, {"{{2}}"}, dst untuk menambahkan variabel
            </p>

            <div className="mt-4 space-y-4">
              <TemplateHeaderEditorSection form={form} onChange={updateForm} />
              <TemplateBodyEditor body={form.body} onChange={(body) => updateForm({ body })} />
              <TemplateFooterEditor
                footer={form.footer}
                onChange={(footer) => updateForm({ footer })}
              />
              <TemplateButtonEditor
                buttons={form.buttons}
                onChange={(buttons) => updateForm({ buttons })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <Button type="button" variant="outline" onClick={() => router.push("/broadcast/templates")}>
              Batal
            </Button>
            <Button
              type="button"
              className="bg-[#0F9D8A] hover:bg-[#0F9D8A]/90"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Mengirim ke Meta..." : "Submit ke Meta"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <div className="w-full shrink-0 space-y-4 xl:sticky xl:top-6 xl:w-[360px]">
          <WhatsAppPreview form={form} variables={variables} deviceName={previewDeviceName} />
          <VariableDetector variables={variables} />
          <ImportantNotes />
        </div>
      </div>
    </div>
  );
}
