"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

type OnboardingStepCardProps = {
  title: string;
  description: string;
  children?: ReactNode;
  primaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
    disabled?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
    disabled?: boolean;
  };
  skipAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    hidden?: boolean;
  };
};

function ActionButton({
  action,
  variant,
}: {
  action: NonNullable<OnboardingStepCardProps["primaryAction"]>;
  variant: "default" | "outline" | "ghost";
}) {
  if (action.href) {
    return (
      <Button variant={variant} asChild disabled={action.disabled}>
        <Link href={action.href}>{action.label}</Link>
      </Button>
    );
  }
  return (
    <Button variant={variant} onClick={action.onClick} disabled={action.disabled}>
      {action.label}
    </Button>
  );
}

export function OnboardingStepCard({
  title,
  description,
  children,
  primaryAction,
  secondaryAction,
  skipAction,
}: OnboardingStepCardProps) {
  return (
    <div className="space-y-5 rounded-lg border bg-card p-6">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      {children ? <div className="space-y-4">{children}</div> : null}

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        {primaryAction ? <ActionButton action={primaryAction} variant="default" /> : null}
        {secondaryAction ? <ActionButton action={secondaryAction} variant="outline" /> : null}
        {skipAction && !skipAction.hidden ? (
          <Button variant="ghost" onClick={skipAction.onClick} disabled={skipAction.disabled} className="ml-auto">
            {skipAction.label}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
