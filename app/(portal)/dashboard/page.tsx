import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, FileText, Files, Rocket, Wallet } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { AnimatedReveal } from "@/components/shared/animated-reveal";
import { EmptyState } from "@/components/shared/empty-state";
import { WeekOutline } from "@/components/calendar/week-outline";
import { formatCurrency } from "@/lib/format";
import { getAgreementsByProjectId, getCalendarEventsByProjectId, getClientPortalView, getInvoicesByProjectId, getProjectFiles } from "@/lib/portal/server";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Overview | Strat X Advisory Portal",
};

function getSydneyGreeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-AU", {
      hour: "numeric",
      hour12: false,
      timeZone: "Australia/Sydney",
    }).format(new Date()),
  );
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const { payload, project } = await getClientPortalView();
  const projectOverview = payload.overview;
  const [invoices, agreements, filesResult, calendarEvents] = await Promise.all([
    getInvoicesByProjectId(project.id),
    getAgreementsByProjectId(project.id),
    getProjectFiles(project.id),
    getCalendarEventsByProjectId(project.id),
  ]);
  const { rows: files } = filesResult;
  const pendingInvoices = invoices.filter((invoice) => invoice.status === "Pending" || invoice.status === "Overdue");
  const pendingAgreementCount = agreements.filter((agreement) => agreement.status !== "fully_signed").length;
  const waitingAgreement =
    agreements.find((agreement) => agreement.workflowState === "pending_review" && agreement.status !== "fully_signed") ??
    agreements.find((agreement) => agreement.status !== "fully_signed") ??
    null;
  const waitingInvoice =
    pendingInvoices.find((invoice) => invoice.status === "Pending" || invoice.status === "Overdue") ??
    invoices[0] ??
    null;
  const totalPendingValue = pendingInvoices.reduce((acc, invoice) => acc + invoice.total, 0);
  const milestones = payload.timeline.slice(0, 3);
  const greeting = getSydneyGreeting();

  return (
    <PageShell title="Overview">
      <div className="space-y-7">
        <AnimatedReveal>
          <section className="grid gap-8 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-8">
              <header className="space-y-2 px-1">
                <h3 className="font-heading text-5xl font-medium tracking-tight text-zinc-900">
                  {greeting}, {projectOverview.clientName || "there"}
                </h3>
                <p className="text-sm text-zinc-600">Welcome back to your project workspace.</p>
              </header>
              <div className="grid gap-6 md:grid-cols-2">
                <DashboardTile className="min-h-[260px] bg-[#fff9e5]">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="editorial-card-title text-[2.8rem]">Project Summary</h4>
                      <p className="editorial-kicker mt-2">{projectOverview.projectName}</p>
                    </div>
                    <span className="rounded-full bg-white/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-700">
                      {projectOverview.projectStatus}
                    </span>
                  </div>
                  <div className="flex flex-1 items-center justify-center">
                    <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-8 border-zinc-300/40">
                      <div className="absolute inset-0 rounded-full border-8 border-zinc-800 border-t-transparent border-r-transparent" />
                      <span className="font-heading text-3xl text-zinc-900">{projectOverview.completionPercent}%</span>
                    </div>
                  </div>
                </DashboardTile>

                <DashboardTile className="min-h-[260px] bg-[#f9ebeb]">
                  <div className="flex items-start justify-between">
                    <h4 className="editorial-card-title text-[2.8rem]">Invoices</h4>
                    <Wallet className="h-5 w-5 text-zinc-500/60" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-heading text-6xl font-light tracking-tight text-zinc-900">{formatCurrency(totalPendingValue || 0)}</p>
                    <p className="editorial-kicker text-rose-700">{pendingInvoices.length} pending approval</p>
                    {waitingInvoice ? (
                      <Link
                        href={`/invoices/${waitingInvoice.id}`}
                        className="inline-flex items-center gap-2 border-b border-zinc-700 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-700"
                      >
                        Open invoice
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : null}
                  </div>
                </DashboardTile>

                <DashboardTile className="min-h-[260px] bg-[#ecf5ee]">
                  <div className="flex items-start justify-between">
                    <h4 className="editorial-card-title text-[2.8rem]">Resources</h4>
                    <Files className="h-5 w-5 text-zinc-500/60" />
                  </div>
                  <div className="space-y-4">
                    <p className="max-w-sm text-sm leading-7 text-zinc-700">
                      You have <span className="font-semibold">{files.length} files</span> in the project document library.
                    </p>
                    <div className="flex items-center gap-2">
                      {["PDF", "PNG", "DOC"].map((label) => (
                        <span key={label} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900/10 text-[10px] font-semibold text-zinc-700">
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </DashboardTile>

                <DashboardTile className="min-h-[260px] bg-[#ebf5f9]">
                  <div className="flex items-start justify-between">
                    <h4 className="editorial-card-title text-[2.8rem]">Agreements</h4>
                    <CheckCircle2 className="h-5 w-5 text-zinc-500/60" />
                  </div>
                  <div className="space-y-3 text-xs uppercase tracking-[0.12em] text-zinc-700">
                    <p className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-cyan-700" />
                      {agreements.length - pendingAgreementCount} contracts signed
                    </p>
                    <p className="inline-flex items-center gap-2 text-zinc-500">
                      <span className="h-2 w-2 rounded-full bg-zinc-400" />
                      {pendingAgreementCount} awaiting review
                    </p>
                    {waitingAgreement ? (
                      <Link
                        href={`/agreements/${waitingAgreement.id}`}
                        className="inline-flex items-center gap-2 border-b border-zinc-700 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-700"
                      >
                        Open waiting for review
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : null}
                  </div>
                </DashboardTile>

                <div className="md:col-span-2">
                  <section className="editorial-shell min-h-[250px] border-zinc-300/80 bg-[#f7f4ed] p-5">
                    <div className="mb-4 flex items-end justify-between gap-4">
                      <div>
                        <p className="editorial-kicker">Calendar overview</p>
                        <h4 className="mt-2 font-heading text-5xl leading-none text-zinc-900">This Week at a Glance</h4>
                      </div>
                      <Link
                        href="/calendar"
                        className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-700"
                      >
                        Open calendar
                      </Link>
                    </div>
                    <WeekOutline events={calendarEvents} compact embedded showHeading={false} showOpenLink={false} />
                  </section>
                </div>
              </div>
            </div>

            <aside className="space-y-6 lg:col-span-4">
              <section className="editorial-shell rounded-[2rem] bg-[#f5f4ef] p-8">
                <div className="mb-8 flex items-center justify-between">
                  <h4 className="font-heading text-4xl italic tracking-tight text-zinc-900">Upcoming Milestones</h4>
                  <CalendarDays className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="space-y-4">
                  {milestones.length ? (
                    milestones.map((week) => (
                      <article key={week.id} className="rounded-[1.5rem] bg-white p-5 shadow-[0_20px_40px_rgba(14,14,13,0.02)]">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-700">{week.dateRange}</span>
                          <Rocket className="h-4 w-4 text-rose-700" />
                        </div>
                        <h5 className="font-heading text-3xl text-zinc-900">{week.title}</h5>
                        <p className="mt-1 text-xs leading-5 text-zinc-500">{week.notes}</p>
                      </article>
                    ))
                  ) : (
                    <EmptyState
                      icon={CalendarDays}
                      title="No milestones yet"
                      description="Milestones will appear once timeline entries are added."
                    />
                  )}
                </div>

                <div className="mt-8 rounded-[1.5rem] bg-[#fbf9f5] p-6">
                  <h5 className="font-heading text-3xl italic text-zinc-900">Need a partner?</h5>
                  <p className="mt-2 text-xs leading-6 text-zinc-600">
                    Schedule a direct strategy call with our execution team.
                  </p>
                  <Link href="/calendar" className="mt-5 inline-flex items-center gap-2 border-b border-zinc-900 pb-1 text-xs font-bold uppercase tracking-[0.18em] text-zinc-800">
                    Book now <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </section>

              <section className="editorial-shell grid grid-cols-1 gap-3 bg-white p-4 text-sm">
                <Link href="/invoices" className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 text-zinc-700 hover:text-zinc-900">
                  <span className="inline-flex items-center gap-2"><FileText className="h-4 w-4" />Invoice View</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/files" className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 text-zinc-700 hover:text-zinc-900">
                  <span className="inline-flex items-center gap-2"><Files className="h-4 w-4" />File Library</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </section>
            </aside>
          </section>
        </AnimatedReveal>
      </div>
    </PageShell>
  );
}

function DashboardTile({ className, children }: { className?: string; children: React.ReactNode }) {
  return <article className={cn("editorial-card flex flex-col justify-between", className)}>{children}</article>;
}
