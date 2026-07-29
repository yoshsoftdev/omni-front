"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export type InboxMobilePane = "list" | "workspace" | "context";

interface InboxLayoutProps {
  channelSidebar: ReactNode;
  conversationList: ReactNode;
  workspace: ReactNode;
  contextSidebar: ReactNode;
  /** Active pane on narrow viewports (< md). */
  mobilePane?: InboxMobilePane;
  onCloseContext?: () => void;
  className?: string;
}

/**
 * Four-pane Conversation Workspace shell with responsive pane switching.
 * App shell nav stays outside; this is the inbox-internal layout only.
 */
export function InboxLayout({
  channelSidebar,
  conversationList,
  workspace,
  contextSidebar,
  mobilePane = "list",
  onCloseContext,
  className,
}: InboxLayoutProps) {
  const showList = mobilePane === "list";
  const showWorkspace = mobilePane === "workspace" || mobilePane === "context";
  const showContextOverlay = mobilePane === "context";

  return (
    <div className={cn("relative flex min-h-0 flex-1 overflow-hidden bg-[#F6F7F9] dark:bg-background", className)}>
      <aside
        className="hidden min-h-0 w-[220px] shrink-0 border-r border-[#E5E7EB] bg-white dark:border-border dark:bg-card lg:flex lg:flex-col"
        aria-label="Channel accounts"
      >
        {channelSidebar}
      </aside>

      <section
        className={cn(
          "min-h-0 flex-col border-r border-[#E5E7EB] bg-white dark:border-border dark:bg-card",
          showList ? "flex w-full" : "hidden",
          "md:flex md:w-[320px] md:shrink-0",
        )}
        aria-label="Conversation list"
        aria-hidden={!showList ? true : undefined}
      >
        {conversationList}
      </section>

      <section
        className={cn(
          "min-h-0 min-w-0 flex-1 flex-col bg-white dark:bg-background",
          showWorkspace ? "flex" : "hidden",
          "md:flex",
        )}
        aria-label="Conversation workspace"
        aria-hidden={!showWorkspace ? true : undefined}
      >
        {workspace}
      </section>

      {/* Desktop context column */}
      <aside
        className="hidden min-h-0 w-[360px] shrink-0 border-l border-[#E5E7EB] bg-white xl:flex xl:flex-col dark:border-border dark:bg-card"
        aria-label="Conversation context"
      >
        {contextSidebar}
      </aside>

      {/* Tablet/mobile context drawer */}
      {showContextOverlay ? (
        <div className="absolute inset-0 z-40 flex xl:hidden" role="dialog" aria-modal="true" aria-label="Conversation context">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close context panel"
            onClick={onCloseContext}
          />
          <aside className="relative ml-auto flex h-full w-full max-w-md flex-col border-l border-[#E5E7EB] bg-white shadow-xl dark:border-border dark:bg-card">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-3 py-2 dark:border-border">
              <p className="text-sm font-semibold text-[#111111] dark:text-foreground">Context</p>
              <button
                type="button"
                onClick={onCloseContext}
                className="rounded-md p-1.5 text-[#6B7280] hover:bg-[#F6F7F9] dark:hover:bg-muted"
                aria-label="Close context panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">{contextSidebar}</div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
