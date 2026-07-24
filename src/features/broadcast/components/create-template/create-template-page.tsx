"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { contactService } from "@/features/contacts/services/contact.service";
import { channelQueryService } from "@/features/channels/services/channel-query.service";
import { isWhatsAppChannel } from "@/features/channels/utils/is-whatsapp-channel";
import { TemplateBodyEditor } from "@/features/broadcast/components/create-template/template-body-editor";
import { TemplateButtonEditor } from "@/features/broadcast/components/create-template/template-button-editor";
import { TemplateFooterEditor } from "@/features/broadcast/components/create-template/template-footer-editor";
import { TemplateHeaderEditorSection } from "@/features/broadcast/components/create-template/template-header-editor";
import { TemplateInfoCard } from "@/features/broadcast/components/create-template/template-info-card";
import { VariableDetector } from "@/features/broadcast/components/create-template/variable-detector";
import { WhatsAppPreview } from "@/features/broadcast/components/create-template/whatsapp-preview";
import { templateService } from "@/features/broadcast/services/broadcast.service";
import type { CreateTemplateForm } from "@/features/broadcast/types/create-template";
import { buildCreateTemplatePayload } from "@/features/broadcast/utils/build-meta-template";
import {
  applyContactSamples,
  detectVariables,
  validateCreateTemplateForm,
} from "@/features/broadcast/utils/create-template.utils";
import { useAuthStore } from "@/store/auth-store";

const defaultCreateTemplateForm: CreateTemplateForm = {
  name: "",
  language: "id",
  category: "marketing",
  headerType: "none",
  body: "",
  footer: "",
  buttonMode: "none",
  buttons: [],
  deviceId: "",
};

function ImportantNotes() {
  return (
    <div
      role="note"
      className="rounded-lg border border-border bg-card p-4 shadow-sm"
    >
      <div className="text-sm font-semibold text-foreground">Catatan penting</div>
      <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-foreground/90">
        <li className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/70" aria-hidden />
          <span>Template dikirim ke Meta untuk review (status awal: PENDING).</span>
        </li>
        <li className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/70" aria-hidden />
          <span>Pastikan konten sesuai kategori dan kebijakan WhatsApp Business.</span>
        </li>
        <li className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/70" aria-hidden />
          <span>Setelah disetujui, template bisa dipakai di campaign broadcast.</span>
        </li>
        <li className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/70" aria-hidden />
          <span>
            Call to action (Visit website / Call phone) dikonfigurasi di bagian Buttons, bukan
            Footer.
          </span>
        </li>
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

  const { data: channels = [] } = useQuery({
    queryKey: ["channels", "connected", "whatsapp"],
    queryFn: async () => {
      const list = await channelQueryService.getConnectedChannels();
      return list.filter(isWhatsAppChannel);
    },
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => (await contactService.list()).items,
  });

  const previewChannelName = useMemo(() => {
    const selected = channels.find((channel) => channel.id === form.deviceId);
    return selected?.label ?? team?.name ?? "WhatsApp Business";
  }, [channels, form.deviceId, team?.name]);

  const variables = useMemo(
    () => applyContactSamples(detectVariables(form.body), contacts[0]),
    [form.body, contacts],
  );

  function updateForm(patch: Partial<CreateTemplateForm>) {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      if (patch.headerType === "none") {
        next.headerText = undefined;
        next.headerFileName = undefined;
        next.headerObjectId = undefined;
        next.headerPreviewUrl = undefined;
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
        <h1 className="text-2xl font-semibold tracking-tight">Buat Template WhatsApp</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Isi informasi dan komponen template, lalu submit ke Meta untuk review.
        </p>
      </div>

      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1 space-y-4">
          <TemplateInfoCard form={form} onChange={updateForm} />

          <div className="rounded-lg border bg-card p-4 md:p-6">
            <h2 className="text-sm font-semibold">Komponen Template</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Urutan seperti WhatsApp Manager: Header → Body → Footer → Buttons. Gunakan {"{{1}}"},{" "}
              {"{{2}}"} untuk variabel di body.
            </p>

            <div className="mt-4 space-y-4">
              <TemplateHeaderEditorSection form={form} onChange={updateForm} />
              <TemplateBodyEditor body={form.body} onChange={(body) => updateForm({ body })} />
              <TemplateFooterEditor
                footer={form.footer}
                onChange={(footer) => updateForm({ footer })}
                onRemove={() => updateForm({ footer: "" })}
              />
              <TemplateButtonEditor
                buttonMode={form.buttonMode}
                buttons={form.buttons}
                onChange={(patch) => updateForm(patch)}
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
          <WhatsAppPreview form={form} variables={variables} deviceName={previewChannelName} />
          <VariableDetector variables={variables} />
          <ImportantNotes />
        </div>
      </div>
    </div>
  );
}
