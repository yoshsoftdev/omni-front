"use client";

import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from "@/components/shared/data-table";
import { EmptyState, ErrorState } from "@/components/shared/empty-state";
import { FilterBar, FilterSelect } from "@/components/shared/filter-bar";
import { StatsCard } from "@/components/shared/stats-card";
import { Skeleton } from "@/components/ui/skeleton";
import { channelQueryService } from "@/features/channels/services/channel-query.service";
import type { Channel } from "@/features/channels/types/channel";
import { DailyBarChart } from "@/features/reports/components/daily-bar-chart";
import { inboxAnalyticsService } from "@/features/reports/services/inbox-analytics.service";
import { formatDuration, lastDaysRange, type InboxAnalytics } from "@/features/reports/utils/inbox-analytics";
import { formatApiErrorMessage } from "@/services/api/errors";

const RANGE_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

export function InboxReportsPage() {
  const [days, setDays] = useState("7");
  const [channelId, setChannelId] = useState("");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [data, setData] = useState<InboxAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const tz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);

  useEffect(() => {
    channelQueryService.getConnectedChannels().then(setChannels).catch(() => setChannels([]));
  }, []);

  useEffect(() => {
    const { from, to } = lastDaysRange(Number(days));
    setLoading(true);
    setError(null);
    inboxAnalyticsService
      .get({ from, to, tz, channelId: channelId || undefined })
      .then(setData)
      .catch((err) => setError(formatApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [days, channelId, tz, attempt]);

  const s = data?.summary;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inbox Reports"
        description="Response and resolution times, volume, and each agent's work. Auto-replies do not count as responses."
      />
      <FilterBar>
        <FilterSelect label="Date range" value={days} onChange={setDays} options={RANGE_OPTIONS} />
        <FilterSelect
          label="Channel"
          value={channelId}
          onChange={setChannelId}
          options={[{ value: "", label: "All channels" }, ...channels.map((c) => ({ value: c.id, label: c.label }))]}
        />
      </FilterBar>

      {loading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true" aria-label="Loading inbox reports">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => setAttempt((n) => n + 1)} />
      ) : s && data ? (
        <>
          <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard title="First response (median)" value={formatDuration(s.first_response_median_seconds)} />
            <StatsCard title="First response (90th percentile)" value={formatDuration(s.first_response_p90_seconds)} />
            <StatsCard title="Resolution time (median)" value={formatDuration(s.resolution_median_seconds)} />
            <StatsCard title="Waiting for a first reply" value={s.unanswered.toLocaleString()} />
            <StatsCard title="Conversations started" value={s.conversations_started.toLocaleString()} />
            <StatsCard title="Resolved" value={s.resolved.toLocaleString()} />
            <StatsCard title="Messages received" value={s.messages_received.toLocaleString()} />
            <StatsCard title="Replies by agents" value={s.messages_sent_by_agents.toLocaleString()} />
          </section>

          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <DailyBarChart
              title="Messages received per day"
              days={data.daily.map((d) => ({ date: d.date, value: d.messages_received }))}
            />
          </section>

          <section className="rounded-xl border bg-card shadow-sm" aria-labelledby="agents-heading">
            <div className="p-5">
              <h2 id="agents-heading" className="font-semibold">Agents</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                First response is measured on conversations assigned to the agent. Open now: {s.open_now.toLocaleString()}{" "}
                conversations in total.
              </p>
            </div>
            {data.agents.length === 0 ? (
              <EmptyState message="No team members yet." className="m-5 mt-0" />
            ) : (
              <DataTable className="rounded-none border-x-0 border-b-0">
                <DataTableHead>
                  <DataTableRow>
                    <DataTableHeaderCell>Agent</DataTableHeaderCell>
                    <DataTableHeaderCell className="text-right">Replies sent</DataTableHeaderCell>
                    <DataTableHeaderCell className="text-right">Resolved</DataTableHeaderCell>
                    <DataTableHeaderCell className="text-right">First response (median)</DataTableHeaderCell>
                    <DataTableHeaderCell className="text-right">Open assigned</DataTableHeaderCell>
                  </DataTableRow>
                </DataTableHead>
                <DataTableBody>
                  {data.agents.map((a) => (
                    <DataTableRow key={a.user_id}>
                      <DataTableCell className="font-medium">{a.name}</DataTableCell>
                      <DataTableCell className="text-right tabular-nums">{a.messages_sent.toLocaleString()}</DataTableCell>
                      <DataTableCell className="text-right tabular-nums">{a.resolved.toLocaleString()}</DataTableCell>
                      <DataTableCell className="text-right tabular-nums">{formatDuration(a.first_response_median_seconds)}</DataTableCell>
                      <DataTableCell className="text-right tabular-nums">{a.open_assigned.toLocaleString()}</DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
