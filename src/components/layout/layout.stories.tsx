import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Plus } from "lucide-react";

import { DetailPanel } from "@/components/layout/detail-panel";
import { PageHeader } from "@/components/layout/page-header";
import { RouteTabs } from "@/components/layout/route-tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";

const meta: Meta = {
  title: "Layout/Patterns",
  parameters: { nextjs: { appDirectory: true, navigation: { pathname: "/contacts/segments" } } },
};
export default meta;
type Story = StoryObj;

export const SectionPage: Story = {
  render: () => (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Contacts"
        description="Manage your contact database, segments, and tags."
        right={
          <Button>
            <Plus className="h-4 w-4" /> Create Segment
          </Button>
        }
      />
      <RouteTabs
        tabs={[
          { href: "/contacts", label: "All Contacts", exact: true },
          { href: "/contacts/segments", label: "Segments" },
          { href: "/contacts/tags", label: "Tags" },
          { href: "/contacts/import", label: "Import", disabled: true },
        ]}
      />
    </div>
  ),
};

export const DetailPanelOpen: Story = {
  render: () => (
    <DetailPanel
      open
      onOpenChange={() => {}}
      title="Budi Santoso"
      description="+62 811 0000 1234"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline">Close</Button>
          <Button>Save</Button>
        </div>
      }
    >
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <dt className="text-muted-foreground">Consent</dt>
        <dd>
          <StatusBadge tone="success">Subscribed</StatusBadge>
        </dd>
        <dt className="text-muted-foreground">City</dt>
        <dd>Bandung</dd>
      </dl>
    </DetailPanel>
  ),
};
