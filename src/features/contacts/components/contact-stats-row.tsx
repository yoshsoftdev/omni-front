import { StatsCard } from "@/components/shared/stats-card";
import type { ContactStats } from "@/types/contact";

export function ContactStatsRow({ stats }: { stats: ContactStats }) {
  const optInPct = stats.total > 0 ? ((stats.opt_in / stats.total) * 100).toFixed(1) : "0.0";
  const optOutPct = stats.total > 0 ? ((stats.opt_out / stats.total) * 100).toFixed(1) : "0.0";
  const unknownPct = stats.total > 0 ? ((stats.unknown / stats.total) * 100).toFixed(1) : "0.0";

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatsCard title="Total Contacts" value={stats.total.toLocaleString()} />
      <StatsCard title="Subscribed" value={stats.opt_in.toLocaleString()} suffix={`(${optInPct}%)`} />
      <StatsCard title="Unsubscribed" value={stats.opt_out.toLocaleString()} suffix={`(${optOutPct}%)`} />
      <StatsCard title="Unknown" value={stats.unknown.toLocaleString()} suffix={`(${unknownPct}%)`} />
    </div>
  );
}
