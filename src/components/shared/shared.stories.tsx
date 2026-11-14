import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Alert } from "@/components/shared/alert";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmpty,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from "@/components/shared/data-table";
import { EmptyState, ErrorState } from "@/components/shared/empty-state";
import { FilterBar, FilterSelect } from "@/components/shared/filter-bar";
import { PaginationFooter } from "@/components/shared/pagination-footer";
import { StatusBadge } from "@/components/shared/status-badge";
import { StepWizard } from "@/components/shared/step-wizard";

const meta: Meta = { title: "Shared/Patterns" };
export default meta;
type Story = StoryObj;

const noop = () => {};

export const StatusBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <StatusBadge status="connected" />
      <StatusBadge status="pending" />
      <StatusBadge status="failed" />
      <StatusBadge status="draft" />
      <StatusBadge tone="info">Info</StatusBadge>
    </div>
  ),
};

export const Alerts: Story = {
  render: () => (
    <div className="grid max-w-xl gap-3">
      <Alert variant="warning" title="Setup incomplete">
        Metode pembayaran belum dikonfigurasi.
      </Alert>
      <Alert variant="error">Template rejected by Meta.</Alert>
      <Alert variant="success">Channel connected.</Alert>
      <Alert variant="info">Templates sync every 15 minutes.</Alert>
    </div>
  ),
};

export const LoadStates: Story = {
  render: () => (
    <div className="grid max-w-xl gap-4">
      <EmptyState message="No campaigns found." />
      <ErrorState message="Internal server error" onRetry={noop} />
    </div>
  ),
};

export const TableWithPagination: Story = {
  render: () => (
    <div className="max-w-3xl space-y-4 rounded-lg border bg-card p-4">
      <FilterBar>
        <FilterSelect
          label="Status"
          value="all"
          onChange={noop}
          options={[
            { value: "all", label: "All Status" },
            { value: "active", label: "Active" },
          ]}
        />
      </FilterBar>
      <DataTable>
        <DataTableHead>
          <DataTableRow>
            <DataTableHeaderCell>Name</DataTableHeaderCell>
            <DataTableHeaderCell>Status</DataTableHeaderCell>
            <DataTableHeaderCell className="text-right">Sent</DataTableHeaderCell>
          </DataTableRow>
        </DataTableHead>
        <DataTableBody>
          <DataTableRow>
            <DataTableCell>November promo</DataTableCell>
            <DataTableCell>
              <StatusBadge status="completed" />
            </DataTableCell>
            <DataTableCell className="text-right">1,240</DataTableCell>
          </DataTableRow>
          <DataTableRow>
            <DataTableCell>Restock alert</DataTableCell>
            <DataTableCell>
              <StatusBadge status="scheduled" />
            </DataTableCell>
            <DataTableCell className="text-right">—</DataTableCell>
          </DataTableRow>
        </DataTableBody>
      </DataTable>
      <PaginationFooter start={1} end={2} total={2} totalLabel="campaigns" currentPage={1} totalPages={1} onPageChange={noop} />
    </div>
  ),
};

export const EmptyTable: Story = {
  render: () => (
    <DataTable className="max-w-3xl">
      <DataTableHead>
        <DataTableRow>
          <DataTableHeaderCell>Name</DataTableHeaderCell>
          <DataTableHeaderCell>Status</DataTableHeaderCell>
        </DataTableRow>
      </DataTableHead>
      <DataTableBody>
        <DataTableEmpty message="No campaigns found." />
      </DataTableBody>
    </DataTable>
  ),
};

export const Wizard: Story = {
  render: () => (
    <StepWizard
      currentStep="audience"
      steps={[
        { id: "info", label: "Information" },
        { id: "template", label: "Template" },
        { id: "audience", label: "Audience" },
        { id: "review", label: "Review" },
      ]}
    />
  ),
};
