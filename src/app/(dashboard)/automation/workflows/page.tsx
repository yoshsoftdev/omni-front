import { AutomationNav } from "@/features/automation/components/automation-nav";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export default function AutomationWorkflowsPage() {
  return (
    <div className="space-y-6">
      <AutomationNav />
      <PagePlaceholder
        title="Workflows"
        description="Workflow builder is not part of Automation v1. This surface is reserved for a future release."
      />
    </div>
  );
}
