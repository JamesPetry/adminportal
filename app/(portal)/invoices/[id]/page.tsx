import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { AnimatedReveal } from "@/components/shared/animated-reveal";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { getClientPortalView, getInvoicesByProjectId } from "@/lib/portal/server";

type Props = { params: Promise<{ id: string }> };

export default async function InvoiceViewPage({ params }: Props) {
  const { id } = await params;
  const { project } = await getClientPortalView();
  const invoices = await getInvoicesByProjectId(project.id);
  const invoice = invoices.find((entry) => entry.id === id);

  if (!invoice) notFound();

  return (
    <PageShell title="Invoice View">
      <div className="space-y-5">
        <Link href="/invoices" className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900">
          <ArrowLeft className="h-4 w-4" />
          Back to invoices
        </Link>

        <AnimatedReveal>
          <Card className="editorial-shell border-zinc-300/80 bg-white shadow-none">
            <CardContent className="space-y-14 p-10 lg:p-14">
              <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="editorial-kicker">Document No.</p>
                  <h2 className="mt-3 text-6xl font-semibold tracking-tight text-zinc-900">Invoice</h2>
                  <p className="mt-3 text-sm text-zinc-600">{invoice.invoiceNumber}</p>
                </div>
                <div className="space-y-2 text-sm text-zinc-600 md:text-right">
                  <p className="editorial-kicker">Issued By</p>
                  <p className="text-zinc-900">James Marlin Studio</p>
                  <p>{project.name}</p>
                </div>
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                <div>
                  <p className="editorial-kicker">Billed To</p>
                  <p className="mt-3 text-2xl font-semibold text-zinc-900">{project.clientName}</p>
                </div>
                <div className="space-y-2 text-sm text-zinc-600 md:text-right">
                  <p>Issue Date: {invoice.issueDate}</p>
                  <p>Due Date: {invoice.dueDate}</p>
                  <p>Status: {invoice.status}</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-12 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                  <p className="col-span-6">Description</p>
                  <p className="col-span-2 text-right">Qty</p>
                  <p className="col-span-4 text-right">Total</p>
                </div>
                <div className="h-px bg-zinc-200" />
                <div className="space-y-4">
                  {invoice.lineItems.map((line) => (
                    <div key={line.id} className="grid grid-cols-12 items-start text-sm">
                      <p className="col-span-6 text-zinc-800">{line.description}</p>
                      <p className="col-span-2 text-right text-zinc-600">{line.quantity}</p>
                      <p className="col-span-4 text-right font-medium text-zinc-900">
                        {formatCurrency(line.quantity * line.unitPrice)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-8 border-t border-zinc-200 pt-8 md:flex-row md:items-end md:justify-between">
                <div className="max-w-md">
                  <p className="editorial-kicker">Payment Notes</p>
                  <p className="mt-3 text-sm leading-6 text-zinc-600">{invoice.notes || "No additional notes."}</p>
                </div>
                <div className="space-y-2 text-sm md:min-w-72">
                  <div className="flex justify-between text-zinc-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Tax {invoice.taxEnabled ? `(${(invoice.taxRate * 100).toFixed(2)}%)` : "(off)"}</span>
                    <span>{formatCurrency(invoice.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-200 pt-3 text-lg font-semibold text-zinc-900">
                    <span>Total</span>
                    <span>{formatCurrency(invoice.total)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-[1rem] border border-zinc-200 bg-zinc-50/60 p-5">
                <p className="editorial-kicker">Pay Details</p>
                <div className="mt-3 grid gap-2 text-sm text-zinc-700 md:grid-cols-2">
                  <p><span className="font-medium text-zinc-900">Name:</span> {invoice.paymentDetails.name}</p>
                  <p><span className="font-medium text-zinc-900">ABN:</span> {invoice.paymentDetails.abn}</p>
                  <p><span className="font-medium text-zinc-900">PayID:</span> {invoice.paymentDetails.payId}</p>
                  <p><span className="font-medium text-zinc-900">Reference:</span> {invoice.paymentDetails.reference}</p>
                  <p className="md:col-span-2">
                    <span className="font-medium text-zinc-900">Amount:</span> {formatCurrency(invoice.paymentDetails.amount)}
                  </p>
                </div>
              </div>

              <div>
                <Link
                  href={`/api/invoices/${invoice.id}/pdf`}
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </Link>
              </div>
            </CardContent>
          </Card>
        </AnimatedReveal>
      </div>
    </PageShell>
  );
}
