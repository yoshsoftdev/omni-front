import { StatsCard } from "@/components/shared/stats-card";
import type { ContactStats } from "@/types/contact";

export function ContactStatsRow({ stats }: { stats: ContactStats }) {
  const optInPct = ((stats.opt_in / stats.total) * 100).toFixed(1);
  const optOutPct = ((stats.opt_out / stats.total) * 100).toFixed(1);
  const unknownPct = ((stats.unknown / stats.total) * 100).toFixed(1);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatsCard title="Total Contacts" value={stats.total.toLocaleString()} change="+12%" changeDirection="up" />
      <StatsCard title="Marketing Opt-In" value={stats.opt_in.toLocaleString()} suffix={`(${optInPct}%)`} />
      <StatsCard title="Marketing Opt-Out" value={stats.opt_out.toLocaleString()} suffix={`(${optOutPct}%)`} />
      <StatsCard title="Unknown" value={stats.unknown.toLocaleString()} suffix={`(${unknownPct}%)`} />
    </div>
  );
}
