"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { SettingsNav } from "@/features/settings/components/settings-nav";
import { cn } from "@/lib/utils";

type ThemeChoice = "light" | "dark" | "system";

const OPTIONS: {
  value: ThemeChoice;
  label: string;
  description: string;
  icon: typeof Sun;
}[] = [
  {
    value: "light",
    label: "Light",
    description: "Tampilan utama aplikasi. Latar netral terang dengan teks gelap.",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Mode gelap opsional untuk lingkungan cahaya rendah.",
    icon: Moon,
  },
  {
    value: "system",
    label: "System",
    description: "Ikuti preferensi tema perangkat Anda.",
    icon: Monitor,
  },
];

export function AppearanceSettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const current = (theme as ThemeChoice | undefined) ?? "light";

  return (
    <div className="space-y-6">
      <SettingsNav />

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Appearance</h1>
        <p className="text-sm text-muted-foreground">
          Light mode adalah tampilan utama. Dark mode tetap tersedia dan bisa diaktifkan di sini.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Theme</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Saat ini:{" "}
          <span className="font-medium text-foreground">
            {!mounted ? "…" : current === "system" ? `System (${resolvedTheme ?? "light"})` : current}
          </span>
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = mounted && current === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                className={cn(
                  "rounded-xl border p-4 text-left transition",
                  active
                    ? "border-primary bg-muted ring-1 ring-primary"
                    : "border-border bg-card hover:bg-muted/60",
                )}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <Icon className="h-4 w-4 text-foreground" />
                </span>
                <p className="mt-3 text-sm font-semibold text-foreground">{opt.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{opt.description}</p>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
