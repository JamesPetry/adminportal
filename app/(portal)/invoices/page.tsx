import { Download, Eye, Wallet } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { AnimatedReveal } from "@/components/shared/animated-reveal";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { getClientPortalView } from "@/lib/portal/server";

export const metadata = {
  title: "Invoices | Strat X Advisory Portal",
};

export default async function InvoicesPage() {
  const {
    payload: { invoices },
  } = await getClientPortalView();

  const total = invoices.reduce((acc, invoice) => acc + invoice.amount, 0);
  const paid = invoices.filter((invoice) => invoice.status === "Paid").reduce((acc, invoice) => acc + invoice.amount, 0);
  const remaining = total - paid;
  const outstanding = invoices
    .filter((invoice) => invoice.status === "Pending" || invoice.status === "Overdue")
    .reduce((acc, invoice) => acc + invoice.amount, 0);

  return (
    <PageShell title="Invoices & Payments">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <FinanceStat label="Outstanding Balance" value={formatCurrency(outstanding)} />
          <FinanceStat label="Total Project Value" value={formatCurrency(total)} />
          <FinanceStat label="Amount Paid" value={formatCurrency(paid)} />
          <FinanceStat label="Amount Remaining" value={formatCurrency(remaining)} />
        </div>

        <AnimatedReveal>
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold tracking-tight text-slate-900">Invoice Schedule</CardTitle>
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
                  className="grid gap-3 rounded-2xl border border-slate-200 p-4 lg:grid-cols-[1.1fr_1fr_1fr_auto]"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {invoice.id} - {invoice.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Issued {invoice.issueDate} • Due {invoice.dueDate}
                    </p>
                  </div>
                  <div className="self-center text-sm text-slate-600">{formatCurrency(invoice.amount)}</div>
                  <div className="self-center">
                    <StatusBadge status={invoice.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="outline" className="border-slate-200">
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="border-slate-200">
                      <Download className="h-4 w-4" />
                      PDF
                    </Button>
                    <Dialog>
                      <DialogTrigger
                        render={
                          <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                              <Wallet className="h-4 w-4" />
                              Pay now
                          </Button>
                        }
                      />
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Payment placeholder flow</DialogTitle>
                          <DialogDescription>
                            Use this structure for future Stripe checkout integration. No real payment processing is
                            connected yet.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-2">
                          <Input value={`${invoice.id} - ${invoice.title}`} readOnly />
                          <Input value={formatCurrency(invoice.amount)} readOnly />
                          <Input placeholder="Cardholder name" />
                        </div>
                        <DialogFooter>
                          <Button variant="outline">Cancel</Button>
                          <Button className="bg-blue-600 text-white hover:bg-blue-700">
                            Continue to secure checkout
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
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
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="p-5">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      </CardContent>
    </Card>
  );
}
