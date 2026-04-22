import Link from "next/link";

import type { CalendarEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

const colorMap: Record<CalendarEvent["colorToken"], string> = {
  finance: "bg-rose-100 text-rose-900",
  timeline: "bg-sky-100 text-sky-900",
  approvals: "bg-violet-100 text-violet-900",
  custom: "bg-emerald-100 text-emerald-900",
};

type Props = {
  events: CalendarEvent[];
  baseDate?: Date;
  compact?: boolean;
  embedded?: boolean;
  showHeading?: boolean;
  showOpenLink?: boolean;
};

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function WeekOutline({
  events,
  baseDate = new Date(),
  compact = false,
  embedded = false,
  showHeading = true,
  showOpenLink = true,
}: Props) {
  const weekStart = startOfWeek(baseDate);
  const days = Array.from({ length: 7 }).map((_, idx) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + idx);
    return date;
  });

  const byDay = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = event.date;
    const list = byDay.get(key) ?? [];
    list.push(event);
    byDay.set(key, list);
  }

  return (
    <section
      className={cn(
        "editorial-shell border-zinc-300/80 bg-white p-5",
        compact && "h-full border-none bg-transparent p-0",
        embedded && "border-none bg-transparent p-0 shadow-none",
      )}
    >
      {!compact && showHeading ? (
        <div className="mb-4 flex items-center justify-between">
          <h4 className="font-heading text-4xl text-zinc-900">Week Outline</h4>
          {showOpenLink ? (
            <Link href="/calendar" className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600 hover:text-zinc-900">
              Open full calendar
            </Link>
          ) : null}
        </div>
      ) : null}
      <div className={cn("grid gap-3 md:grid-cols-7", compact && "grid-cols-7 gap-1.5 md:grid-cols-7", embedded && "gap-4")}>
        {days.map((day) => {
          const key = day.toISOString().slice(0, 10);
          const items = byDay.get(key) ?? [];
          return (
            <article key={key} className={cn("rounded-[1.1rem] border border-zinc-400/15 bg-zinc-50/60 p-3", compact && "rounded-[0.8rem] p-2")}>
              <p className={cn("text-xs uppercase tracking-[0.12em] text-zinc-500", compact && "text-[9px]")}>
                {day.toLocaleDateString(undefined, { weekday: "short" })}
              </p>
              <p className={cn("mt-1 text-sm font-semibold text-zinc-900", compact && "text-xs")}>
                {day.toLocaleDateString(undefined, { day: "numeric", month: "short" })}
              </p>
              <div className={cn("mt-3 space-y-2", compact && "mt-2 space-y-1")}>
                {items.slice(0, 3).map((event) => (
                  <div key={event.id} className={cn("rounded-md px-2 py-1 text-[11px] font-medium", compact && "px-1.5 py-0.5 text-[10px]", colorMap[event.colorToken])}>
                    {event.title}
                  </div>
                ))}
                {!items.length ? <p className="text-[11px] text-zinc-400">No events</p> : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
