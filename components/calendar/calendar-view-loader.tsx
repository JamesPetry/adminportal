"use client";

import dynamic from "next/dynamic";

import type { CalendarEvent, UserRole } from "@/lib/types";

const FullCalendar = dynamic(() => import("./full-calendar").then((m) => m.FullCalendar), {
  ssr: false,
  loading: () => (
    <div
      className="min-h-[520px] animate-pulse rounded-[2rem] border border-zinc-400/15 bg-zinc-100/80"
      aria-hidden
    />
  ),
});

type Props = {
  events: CalendarEvent[];
  invoices: { id: string; label: string }[];
  agreements: { id: string; label: string }[];
  viewerRole: UserRole;
  viewerUserId: string;
  projectId: string;
  year: number;
  month: number;
};

export function CalendarViewLoader(props: Props) {
  return <FullCalendar {...props} />;
}
