import Link from "next/link";
import { ArrowRight, CalendarDays, CircleCheckBig, Clock3, ListChecks } from "lucide-react";

import { AnimatedReveal } from "@/components/shared/animated-reveal";
import { EmptyState } from "@/components/shared/empty-state";
import { PageShell } from "@/components/layout/page-shell";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { navItems } from "@/lib/navigation";
import { getClientPortalView } from "@/lib/portal/server";

export const metadata = {
  title: "Overview | Strat X Advisory Portal",
};

export default async function DashboardPage() {
  const { payload } = await getClientPortalView();
  const projectOverview = payload.overview;
  const activeWeek = payload.timeline.find((week) => week.status === "In Progress");

  return (
    <PageShell title="Overview">
      <div className="space-y-6">
        <AnimatedReveal>
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="space-y-4 p-7">
              <StatusBadge status={projectOverview.projectStatus} />
              <div className="space-y-3">
                <h3 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-900">
                  {projectOverview.projectName}
                </h3>
                <p className="max-w-3xl text-sm leading-6 text-slate-600">
                  Welcome to your project portal. This space gives you full visibility into the redesign process, design
                  decisions, deliverables, payments, and feedback in one place.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.14em] text-slate-500">Overall Progress</p>
                  <Progress value={projectOverview.completionPercent} className="h-2 bg-slate-100" />
                  <p className="mt-2 text-sm text-slate-600">{projectOverview.completionPercent}% complete</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Estimated Completion</p>
                  <p className="mt-2 text-sm text-slate-900">{projectOverview.estimatedCompletionDate}</p>
                  <p className="mt-1 text-sm text-slate-500">Last updated {projectOverview.lastUpdated}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedReveal>

        <div className="grid gap-4 md:grid-cols-3">
          <AnimatedReveal delay={0.05}>
            <StatCard icon={Clock3} label="Current Status" value={projectOverview.projectStatus} hint="Execution phase" />
          </AnimatedReveal>
          <AnimatedReveal delay={0.08}>
            <StatCard icon={CalendarDays} label="Current Week" value={activeWeek?.weekLabel ?? "No active week"} hint={activeWeek?.title} />
          </AnimatedReveal>
          <AnimatedReveal delay={0.11}>
            <StatCard icon={CircleCheckBig} label="Client" value={projectOverview.clientName} hint="Primary stakeholder" />
          </AnimatedReveal>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <AnimatedReveal delay={0.12}>
            <Card className="border-slate-200 bg-white shadow-sm lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold tracking-tight text-slate-900">This Week Focus</CardTitle>
              </CardHeader>
              <CardContent>
                {projectOverview.weeklySummary ? (
                  <p className="text-sm leading-6 text-slate-600">{projectOverview.weeklySummary}</p>
                ) : (
                  <EmptyState
                    icon={CalendarDays}
                    title="No weekly update yet"
                    description="Your project manager will add this week's progress summary here."
                  />
                )}
              </CardContent>
            </Card>
          </AnimatedReveal>

          <AnimatedReveal delay={0.16}>
            <Card className="border-blue-200 bg-blue-50/60 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight text-blue-900">
                  <ListChecks className="h-4 w-4" />
                  Next Action Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {projectOverview.nextActionRequired ? (
                  <p className="text-sm leading-6 text-blue-900/85">{projectOverview.nextActionRequired}</p>
                ) : (
                  <p className="text-sm leading-6 text-blue-900/85">
                    No immediate action is required right now. New client tasks will appear here.
                  </p>
                )}
                <Link
                  href="/client-actions"
                  className="inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-900"
                >
                  View action items
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          </AnimatedReveal>
        </div>

        <AnimatedReveal delay={0.2}>
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold tracking-tight text-slate-900">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/40"
                >
                  {item.title}
                  <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:text-blue-700" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </AnimatedReveal>
      </div>
    </PageShell>
  );
}
