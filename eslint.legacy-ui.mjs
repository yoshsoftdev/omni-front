// Files that predate the design-system lint rules (TODO 5, DoD).
// Phase 7 migrates them; remove an entry once its file uses the shared components.
// Never add new entries: new code must use src/components/{ui,shared,layout}.
export const legacyUiFiles = [
  "src/features/broadcast/components/campaigns/campaign-table.tsx",
  "src/features/broadcast/components/create-template/template-button-editor.tsx",
  "src/features/broadcast/components/create-template/template-info-card.tsx",
  "src/features/broadcast/components/shared/payment-required-dialog.tsx",
  "src/features/broadcast/components/shared/whatsapp-message-preview.tsx",
  "src/features/broadcast/components/templates-page.tsx",
];
