"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { ColorDot } from "@/components/shared/color-dot";
import type { Campaign } from "@/features/broadcast/types/campaign";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

interface ScheduleCalendarProps {
  campaigns: Campaign[];
  onSelectCampaign: (campaign: Campaign) => void;
}

export function ScheduleCalendar({ campaigns, onSelectCampaign }: ScheduleCalendarProps) {
  const [viewDate, setViewDate] = useState(new Date(2026, 5, 1));

  const { days, monthLabel } = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ date: Date | null; campaigns: Campaign[] }> = [];

    for (let i = 0; i < startOffset; i += 1) cells.push({ date: null, campaigns: [] });
    for (let d = 1; d <= daysInMonth; d += 1) {
      const date = new Date(year, month, d);
      const dayCampaigns = campaigns.filter((c) => c.scheduled_at && sameDay(new Date(c.scheduled_at), date));
      cells.push({ date, campaigns: dayCampaigns });
    }

    return {
      days: cells,
      monthLabel: viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
    };
  }, [viewDate, campaigns]);

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold">{monthLabel}</h3>
        <div className="flex gap-1">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md border hover:bg-muted"
            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md border hover:bg-muted"
            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b text-center text-xs font-medium text-muted-foreground">
        {WEEKDAYS.map((day) => (
          <div key={day} className="border-r px-2 py-2 last:border-r-0">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((cell, index) => (
          <div
            key={index}
            className={cn(
              "min-h-[100px] border-b border-r p-2 last:border-r-0",
              cell.date && sameDay(cell.date, new Date()) && "bg-primary/5",
            )}
          >
            {cell.date ? (
              <>
                <div className="text-xs font-medium">{cell.date.getDate()}</div>
                <div className="mt-1 space-y-1">
                  {cell.campaigns.slice(0, 2).map((campaign) => (
                    <button
                      key={campaign.id}
                      type="button"
                      onClick={() => onSelectCampaign(campaign)}
                      className="block w-full truncate rounded bg-primary/10 px-1.5 py-0.5 text-left text-[10px] font-medium text-primary hover:bg-primary/20"
                    >
                      {campaign.name}
                    </button>
                  ))}
                  {cell.campaigns.length > 2 ? (
                    <span className="text-[10px] text-muted-foreground">+{cell.campaigns.length - 2} more</span>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScheduleMiniCalendar({
  campaigns,
  selectedDate,
  onSelectDate,
}: {
  campaigns: Campaign[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}) {
  const viewDate = selectedDate;
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<Date | null> = [];
  for (let i = 0; i < startOffset; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(year, month, d));

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-2 text-sm font-semibold">
        {viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
        {WEEKDAYS.map((d) => <div key={d}>{d.slice(0, 1)}</div>)}
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const hasEvent = campaigns.some((c) => c.scheduled_at && sameDay(new Date(c.scheduled_at), date));
          const selected = sameDay(date, selectedDate);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectDate(date)}
              className={cn(
                "relative flex h-7 w-7 items-center justify-center rounded-full text-xs",
                selected && "bg-primary text-primary-foreground",
                !selected && "hover:bg-muted",
              )}
            >
              {date.getDate()}
              {hasEvent ? <ColorDot color="#8B5CF6" className="absolute bottom-0 h-1 w-1" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
