"use client";

import { useEffect, useState } from "react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  createTemplateCategoryOptions,
  createTemplateLanguageOptions,
  headerTypeOptions,
} from "@/features/broadcast/mock/create-template.mock";
import { deviceService } from "@/features/devices/services/device.service";
import type { CreateTemplateForm, HeaderType } from "@/features/broadcast/types/create-template";
import { sanitizeTemplateName } from "@/features/broadcast/utils/create-template.utils";
import type { Device } from "@/types/device";

type TemplateInfoCardProps = {
  form: CreateTemplateForm;
  onChange: (patch: Partial<CreateTemplateForm>) => void;
};

export function TemplateInfoCard({ form, onChange }: TemplateInfoCardProps) {
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    deviceService.list().then((list) => {
      const connected = list.filter((d) => d.status === "connected");
      setDevices(connected);
      if (!form.deviceId && connected[0]?.id) {
        onChange({ deviceId: connected[0].id });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-lg border bg-card p-4 md:p-6">
      <h2 className="text-sm font-semibold">Informasi Template</h2>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="template-device">WABA / Device</Label>
          <select
            id="template-device"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.deviceId}
            onChange={(e) => onChange({ deviceId: e.target.value })}
          >
            <option value="">Pilih device...</option>
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.name}
                {device.phone_number ? ` (${device.phone_number})` : ""}
              </option>
            ))}
          </select>
          {devices.length === 0 ? (
            <p className="text-xs text-amber-600">
              Tidak ada device terhubung. Hubungkan WABA di menu WhatsApp terlebih dahulu.
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
            Gunakan huruf kecil dan underscore. Contoh: promo_juni_2024
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="template-language">Bahasa</Label>
          <select
            id="template-language"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.language}
            onChange={(e) => onChange({ language: e.target.value })}
          >
            {createTemplateLanguageOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Bahasa template tidak dapat diubah setelah disetujui
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="template-category">Kategori</Label>
          <select
            id="template-category"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.category}
            onChange={(e) => onChange({ category: e.target.value })}
          >
            {createTemplateCategoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Pilih kategori yang sesuai dengan isi pesan
          </p>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="header-type">Header (Opsional)</Label>
          <select
            id="header-type"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.headerType}
            onChange={(e) => onChange({ headerType: e.target.value as HeaderType })}
          >
            {headerTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Header media (gambar/video) belum didukung submit API — gunakan None.
          </p>
        </div>
      </div>
    </div>
  );
}
