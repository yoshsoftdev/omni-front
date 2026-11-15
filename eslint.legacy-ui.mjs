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
  "src/features/settings/components/quick-replies-page.tsx",
  "src/features/settings/components/quick-reply-form-modal.tsx",
  "src/features/team/components/invitation-success-dialog.tsx",
  "src/features/team/components/invite-user-modal.tsx",
  "src/features/team/components/permission-matrix.tsx",
  "src/features/team/components/role-selector.tsx",
  "src/features/team/components/team-members-table.tsx",
  "src/features/team/components/team-roles-page.tsx",
  "src/features/team/components/team-users-page.tsx",
  "src/features/team/components/team-workspace-page.tsx",
  "src/features/team/components/user-table.tsx",
];
