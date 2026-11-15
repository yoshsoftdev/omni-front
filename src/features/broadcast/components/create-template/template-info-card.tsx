"use client";

import { useEffect, useMemo, useState } from "react";

import { FilterSelect } from "@/components/shared/filter-bar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  createTemplateCategoryOptions,
  createTemplateLanguageOptions,
  headerTypeOptions,
} from "@/features/broadcast/constants/create-template";
import { channelQueryService } from "@/features/channels/services/channel-query.service";
import { isWhatsAppChannel } from "@/features/channels/utils/is-whatsapp-channel";
import type { CreateTemplateForm, HeaderType } from "@/features/broadcast/types/create-template";
import { sanitizeTemplateName } from "@/features/broadcast/utils/create-template.utils";
import type { Channel } from "@/features/channels/types/channel";

type TemplateInfoCardProps = {
  form: CreateTemplateForm;
  onChange: (patch: Partial<CreateTemplateForm>) => void;
};

export function TemplateInfoCard({ form, onChange }: TemplateInfoCardProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelsStatus, setChannelsStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    channelQueryService
      .getConnectedChannels()
      .then((list) => {
        const waChannels = list.filter(isWhatsAppChannel);
        setChannels(waChannels);
        setChannelsStatus("ready");
        if (!form.deviceId && waChannels[0]?.id) {
          onChange({ deviceId: waChannels[0].id });
        }
      })
      .catch(() => setChannelsStatus("error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedIsValid = useMemo(
    () => !form.deviceId || channels.some((channel) => channel.id === form.deviceId),
    [channels, form.deviceId],
  );

  useEffect(() => {
    if (channels.length === 0) return;
    if (!selectedIsValid) {
      onChange({ deviceId: channels[0]?.id ?? "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channels, selectedIsValid]);

  function handleHeaderTypeChange(next: HeaderType) {
    onChange({
      headerType: next,
      headerText: next === "text" ? form.headerText ?? "" : undefined,
      headerFileName: undefined,
      headerObjectId: undefined,
      headerPreviewUrl: undefined,
    });
  }

  return (
    <div className="rounded-lg border bg-card p-4 md:p-6">
      <h2 className="text-sm font-semibold">Informasi Template</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Hanya channel WhatsApp Business (WABA) yang didukung untuk template Meta.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="template-device">Channel WhatsApp</Label>
          <FilterSelect
            id="template-device"
            label="Channel WhatsApp"
            value={form.deviceId}
            onChange={(deviceId) => onChange({ deviceId })}
            options={[
              { value: "", label: "Pilih channel WhatsApp..." },
              ...channels.map((channel) => ({
                value: channel.id,
                label: channel.phone_number ? `${channel.label} (${channel.phone_number})` : channel.label,
              })),
            ]}
            className="w-full"
          />
          {channelsStatus === "error" ? (
            <p role="alert" className="text-xs text-error-foreground">
              Gagal memuat channel. Muat ulang halaman untuk mencoba lagi.
            </p>
          ) : channelsStatus === "ready" && channels.length === 0 ? (
            <p className="text-xs text-warning-foreground">
              Tidak ada channel WhatsApp terhubung. Hubungkan WABA di halaman Devices.
            </p>
          ) : null}
        </div>

        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="template-name">Nama Template</Label>
            <span className="text-xs text-muted-foreground">{form.name.length}/512</span>
          </div>
          <Input
            id="template-name"
            value={form.name}
            onChange={(e) => onChange({ name: sanitizeTemplateName(e.target.value) })}
            placeholder="promo_hydrabalance_apr2024"
          />
          <p className="text-xs text-muted-foreground">
            Huruf kecil dan underscore. Contoh: promo_juni_2024
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="template-language">Bahasa</Label>
          <FilterSelect
            id="template-language"
            label="Bahasa"
            value={form.language}
            onChange={(language) => onChange({ language })}
            options={[...createTemplateLanguageOptions]}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Bahasa tidak dapat diubah setelah disetujui Meta
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="template-category">Kategori</Label>
          <FilterSelect
            id="template-category"
            label="Kategori"
            value={form.category}
            onChange={(category) => onChange({ category })}
            options={[...createTemplateCategoryOptions]}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">Sesuaikan dengan isi pesan</p>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="header-type">Header (Opsional)</Label>
          <FilterSelect
            id="header-type"
            label="Header"
            value={form.headerType}
            onChange={(value) => handleHeaderTypeChange(value as HeaderType)}
            options={[...headerTypeOptions]}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Media header diunggah ke storage-service; saat submit, backend mengonversi ke Meta
            resumable upload handle.
          </p>
        </div>
      </div>
    </div>
  );
}
