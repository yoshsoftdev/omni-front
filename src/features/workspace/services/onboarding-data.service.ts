import type { Template } from "@/features/broadcast/types/template";
import { campaignQueryService } from "@/features/broadcast/services/campaign-query.service";
import { templateQueryService } from "@/features/broadcast/services/template-query.service";
import { channelQueryService } from "@/features/channels/services/channel-query.service";
import { segmentService } from "@/features/segments/services/segment.service";
import { teamService } from "@/features/team/services/team.service";
import { getWorkspaceReadiness } from "@/features/workspace/services/workspace-readiness.service";
import type { OnboardingStepSnapshot, RecentImport } from "@/features/workspace/types/onboarding";
import type { TeamMember } from "@/types/team";

function resolveLastTemplateSync(templates: Template[]): string | null {
  const timestamps = templates
    .map((template) => template.last_sync_at ?? template.updated_at)
    .filter((value): value is string => Boolean(value));
  if (timestamps.length === 0) return null;
  return timestamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;
}

function buildRecentImports(totalContacts: number): RecentImport[] {
  if (totalContacts <= 0) return [];
  const imports: RecentImport[] = [
    {
      id: "imp_1",
      name: "VIP Customer segment",
      count: Math.min(1240, totalContacts),
      imported_at: "2026-06-17T08:00:00Z",
      source: "csv",
    },
    {
      id: "imp_2",
      name: "Jakarta Customer segment",
      count: Math.min(3890, Math.max(totalContacts - 1240, 0)),
      imported_at: "2026-06-16T14:00:00Z",
      source: "excel",
    },
  ];
  return imports.filter((item) => item.count > 0);
}

export async function getOnboardingSnapshot(): Promise<OnboardingStepSnapshot> {
  const [allChannels, connectedChannels, templates, segments, campaigns, readiness] = await Promise.all([
    channelQueryService.getChannels(),
    channelQueryService.getConnectedChannels(),
    templateQueryService.getTemplates(),
    segmentService.list(),
    campaignQueryService.getCampaigns(),
    getWorkspaceReadiness(),
  ]);

  let members: TeamMember[] = [];
  try {
    members = await teamService.listMembers();
  } catch {
    members = [];
  }

  const totalContacts = segments.reduce((sum, segment) => sum + segment.contact_count, 0);
  const pendingInvites = members.filter((member) => member.status === "invited");

  return {
    connectedChannels,
    allChannels,
    templates,
    templateCount: templates.length,
    lastTemplateSync: resolveLastTemplateSync(templates),
    segments,
    totalContacts,
    importedContacts: totalContacts,
    recentImports: buildRecentImports(totalContacts),
    members,
    pendingInvites,
    campaigns,
    readiness,
  };
}
