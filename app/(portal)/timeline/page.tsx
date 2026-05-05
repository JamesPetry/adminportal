import { CalendarRange, CheckCircle2, Link2 } from "lucide-react";
import Image from "next/image";

import { PageShell } from "@/components/layout/page-shell";
import { AnimatedReveal } from "@/components/shared/animated-reveal";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getClientPortalView } from "@/lib/portal/server";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Timeline | Strat X Advisory Portal",
};

export default async function TimelinePage() {
  const {
    payload: { timeline },
  } = await getClientPortalView();
  const currentWeekId = timeline.find((week) => week.status === "In Progress")?.id;
  const completedCount = timeline.filter((week) => week.status === "Complete").length;
  const avgProgress = timeline.length
    ? Math.round(timeline.reduce((sum, week) => sum + Math.max(0, Math.min(week.progress, 100)), 0) / timeline.length)
    : 0;

  return (
    <PageShell title="Timeline">
      <div className="space-y-6">
        {timeline.length ? (
          <section className="grid gap-4 sm:grid-cols-3">
            <Card className="editorial-shell border-zinc-300/80 bg-white shadow-none">
              <CardContent className="p-5">
                <p className="editorial-kicker">Timeline Weeks</p>
                <p className="mt-2 font-heading text-4xl leading-none text-zinc-900">{timeline.length}</p>
              </CardContent>
            </Card>
            <Card className="editorial-shell border-zinc-300/80 bg-white shadow-none">
              <CardContent className="p-5">
                <p className="editorial-kicker">Completed</p>
                <p className="mt-2 font-heading text-4xl leading-none text-zinc-900">{completedCount}</p>
              </CardContent>
            </Card>
            <Card className="editorial-shell border-zinc-300/80 bg-white shadow-none">
              <CardContent className="p-5">
                <p className="editorial-kicker">Average Progress</p>
                <p className="mt-2 font-heading text-4xl leading-none text-zinc-900">{avgProgress}%</p>
              </CardContent>
            </Card>
          </section>
        ) : null}
        {!timeline.length ? (
          <EmptyState
            icon={CalendarRange}
            title="Timeline has not been published yet"
            description="Week-by-week milestones will appear here once your project plan is entered."
          />
        ) : null}
        {timeline.map((week, index) => (
          <AnimatedReveal key={week.id} delay={index * 0.04}>
            <Card
              className={cn(
                "editorial-shell border-zinc-300/80 bg-white shadow-none",
                getWeekColorClass(week.weekColor, index),
                week.id === currentWeekId && "border-violet-200/70 bg-violet-50/50 ring-1 ring-violet-200/50",
              )}
            >
              <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="editorial-kicker">{week.weekLabel}</p>
                  <CardTitle className="mt-2 font-heading text-5xl font-medium leading-none tracking-tight text-zinc-900">
                    {week.title}
                  </CardTitle>
                </div>
                <div className="space-y-2">
                  <StatusBadge status={week.status} />
                  <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <CalendarRange className="h-4 w-4" />
                    <span>{week.dateRange || "Date range not set"}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Progress value={week.progress} className="h-2 bg-zinc-200" />
                  <p className="mt-2 text-sm text-zinc-600">{week.progress}% complete</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-12">
                  <div className="space-y-2 lg:col-span-6">
                    <p className="editorial-kicker">Deliverables</p>
                    {(week.checklist ?? []).map((item) => (
                      <div key={item.id} className="flex min-h-8 items-center gap-2 text-sm text-zinc-700">
                        <CheckCircle2 className={cn("h-4 w-4", item.completed ? "text-emerald-600" : "text-zinc-300")} />
                        <span className={cn(item.completed && "line-through text-zinc-500")}>{item.label}</span>
                      </div>
                    ))}
                    {!(week.checklist ?? []).length ? <p className="text-sm text-zinc-500">No deliverables yet.</p> : null}
                  </div>
                  <div className="lg:col-span-6">
                    {week.imageUrl ? (
                      <div className="relative mb-3 h-44 w-full overflow-hidden rounded-[1rem] border border-zinc-400/20">
                        <Image
                          src={week.imageUrl}
                          alt={week.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                      </div>
                    ) : null}
                    <p className="editorial-kicker">Notes Summary</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-600">{week.notes}</p>
                  </div>
                </div>

                <details className="group rounded-[1.2rem] border border-zinc-400/20 bg-white/70 p-4">
                  <summary className="cursor-pointer list-none text-sm font-medium text-zinc-800">
                    <span className="group-open:hidden">View expanded details</span>
                    <span className="hidden group-open:inline">Hide expanded details</span>
                  </summary>
                  <div className="space-y-4 pt-4">
                    <p className="text-sm leading-7 text-zinc-600">{week.details}</p>
                    {week.linkedAssets?.length ? (
                      <div className="space-y-2">
                        <p className="editorial-kicker">Linked files</p>
                        <div className="flex flex-wrap gap-2">
                          {week.linkedAssets.map((asset) => (
                            <span
                              key={asset}
                              className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-600"
                            >
                              <Link2 className="h-3.5 w-3.5" />
                              {asset}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </details>
              </CardContent>
            </Card>
          </AnimatedReveal>
        ))}
      </div>
    </PageShell>
  );
}

function getWeekColorClass(weekColor: "sand" | "rose" | "mint" | "sky" | "lavender" | undefined, index: number) {
  const fallback = ["bg-[#fff9e5]", "bg-[#f9ebeb]", "bg-[#ecf5ee]", "bg-[#ebf5f9]", "bg-[#f2edff]"][index % 5];
  const map: Record<NonNullable<typeof weekColor>, string> = {
    sand: "bg-[#fff9e5]",
    rose: "bg-[#f9ebeb]",
    mint: "bg-[#ecf5ee]",
    sky: "bg-[#ebf5f9]",
    lavender: "bg-[#f2edff]",
  };
  return weekColor ? map[weekColor] : fallback;
}
