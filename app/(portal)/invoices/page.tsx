import { CalendarClock, Download, Eye, Wallet } from "lucide-react";
import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { AnimatedReveal } from "@/components/shared/animated-reveal";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { getClientPortalView, getInvoicesByProjectId } from "@/lib/portal/server";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Invoices | Strat X Advisory Portal",
};

export default async function InvoicesPage() {
  const { project } = await getClientPortalView();
  const invoices = await getInvoicesByProjectId(project.id);

  const total = invoices.reduce((acc, invoice) => acc + invoice.total, 0);
  const paid = invoices.filter((invoice) => invoice.status === "Paid").reduce((acc, invoice) => acc + invoice.total, 0);
  const remaining = total - paid;
  const outstanding = invoices
    .filter((invoice) => invoice.status === "Pending" || invoice.status === "Overdue")
    .reduce((acc, invoice) => acc + invoice.total, 0);

  return (
    <PageShell title="Invoices & Payments">
      <div className="space-y-6">
        <div className="grid gap-5 md:grid-cols-4">
          <FinanceStat label="Outstanding Balance" value={formatCurrency(outstanding)} />
          <FinanceStat label="Total Project Value" value={formatCurrency(total)} />
          <FinanceStat label="Amount Paid" value={formatCurrency(paid)} />
          <FinanceStat label="Amount Remaining" value={formatCurrency(remaining)} />
        </div>

        <AnimatedReveal>
          <Card className="editorial-shell border-zinc-300/80 bg-white shadow-none">
            <CardHeader>
              <CardTitle className="font-heading text-5xl font-medium tracking-tight text-zinc-900">Invoice Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!invoices.length ? (
                <EmptyState
                  icon={Wallet}
                  title="No invoices published yet"
                  description="Invoices and payment milestones will appear here once issued."
                />
              ) : null}
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="rounded-[1.6rem] border border-zinc-400/15 bg-[#f8f5ef] p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <p className="editorial-kicker">Invoice {invoice.invoiceNumber}</p>
                      <h3 className="font-heading text-4xl leading-none text-zinc-900">{invoice.title}</h3>
                      <p className="text-xs text-zinc-500">
                        Issued {invoice.issueDate} • Due {invoice.dueDate}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={invoice.status} />
                      <span className="rounded-full border border-zinc-300 bg-white px-4 py-1 text-sm font-semibold text-zinc-900">
                        {formatCurrency(invoice.total)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[1rem] border border-zinc-300/70 bg-white/80 p-4">
                    <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-zinc-600">
                      <CalendarClock className="h-4 w-4" />
                      Print-ready invoice + export
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className={cn(buttonVariants({ size: "sm", variant: "outline" }), "border-zinc-300 bg-white")}
                      >
                      <Eye className="h-4 w-4" />
                      View
                      </Link>
                      <Link
                        href={`/api/invoices/${invoice.id}/pdf`}
                        className={cn(buttonVariants({ size: "sm", variant: "outline" }), "border-zinc-300 bg-white")}
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Link>
                      <Link href={`/invoices/${invoice.id}`} className={cn(buttonVariants({ size: "sm" }), "bg-zinc-900 text-white")}>
                        Open full view
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </AnimatedReveal>
      </div>
    </PageShell>
  );
}

function FinanceStat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="editorial-shell min-h-[130px] border-zinc-300/80 bg-white shadow-none">
      <CardContent className="p-6">
        <p className="editorial-kicker">{label}</p>
        <p className="mt-3 font-heading text-4xl leading-none tracking-tight text-zinc-900">{value}</p>
      </CardContent>
    </Card>
  );
}
