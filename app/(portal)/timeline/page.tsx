import { CalendarRange, CheckCircle2, Link2 } from "lucide-react";

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

  return (
    <PageShell title="Timeline">
      <div className="space-y-4">
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
                "border-slate-200 bg-white shadow-sm",
                week.id === currentWeekId && "border-blue-200 ring-1 ring-blue-100",
              )}
            >
              <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{week.weekLabel}</p>
                  <CardTitle className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{week.title}</CardTitle>
                </div>
                <div className="space-y-2">
                  <StatusBadge status={week.status} />
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <CalendarRange className="h-4 w-4" />
                    <span>{week.dateRange}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Progress value={week.progress} className="h-2 bg-slate-100" />
                  <p className="mt-2 text-sm text-slate-600">{week.progress}% complete</p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Deliverables</p>
                    {week.checklist.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="h-4 w-4 text-slate-300" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Notes Summary</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{week.notes}</p>
                  </div>
                </div>

                <details className="group rounded-xl border border-slate-200 p-3">
                  <summary className="cursor-pointer list-none text-sm font-medium text-slate-800">
                    <span className="group-open:hidden">View expanded details</span>
                    <span className="hidden group-open:inline">Hide expanded details</span>
                  </summary>
                  <div className="space-y-4 pt-3">
                    <p className="text-sm leading-6 text-slate-600">{week.details}</p>
                    {week.linkedAssets?.length ? (
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Linked files</p>
                        <div className="flex flex-wrap gap-2">
                          {week.linkedAssets.map((asset) => (
                            <span
                              key={asset}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
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
