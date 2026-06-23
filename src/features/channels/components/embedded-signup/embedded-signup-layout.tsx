"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

type EmbeddedSignupLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
  returnHref?: string;
};

export function EmbeddedSignupLayout({
  title,
  description,
  children,
  returnHref = "/devices",
}: EmbeddedSignupLayoutProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-primary">WhatsApp Embedded Signup</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={returnHref}>
            <ArrowLeft className="h-4 w-4" />
            Exit
          </Link>
        </Button>
      </div>
      {children}
    </div>
  );
}
