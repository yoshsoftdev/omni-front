"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import type { CreateTemplateForm } from "@/features/broadcast/types/create-template";
import {
  detectVariables,
  validateCreateTemplateForm,
} from "@/features/broadcast/utils/create-template.utils";

function ImportantNotes() {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
      <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Catatan Penting</div>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-emerald-700 dark:text-emerald-400">
        <li>Template harus mengikuti kebijakan WhatsApp Business.</li>
        <li>Pastikan konten template sesuai dengan kategori yang dipilih.</li>
        <li>Template akan melalui proses review oleh Meta.</li>
      </ul>
    </div>
  );
}

export function CreateTemplatePage() {
  const router = useRouter();
  const [form, setForm] = useState<CreateTemplateForm>(defaultCreateTemplateForm);
  const [error, setError] = useState<string | null>(null);

  const variables = useMemo(() => detectVariables(form.body), [form.body]);

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

  function handleContinue() {
    const validationError = validateCreateTemplateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    alert(
      "Template WhatsApp harus dibuat di Meta Business Manager sesuai kebijakan Meta. " +
        "Setelah template disetujui, gunakan Sync Template di halaman Templates untuk memuat template ke aplikasi.",
    );
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
            <Button type="button" className="bg-[#0F9D8A] hover:bg-[#0F9D8A]/90" onClick={handleContinue}>
              Lanjut: Preview & Submit
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <div className="w-full shrink-0 space-y-4 xl:sticky xl:top-6 xl:w-[360px]">
          <WhatsAppPreview form={form} variables={variables} />
          <VariableDetector variables={variables} />
          <ImportantNotes />
        </div>
      </div>
    </div>
  );
}
