import { NextResponse, type NextRequest } from "next/server";

import { buildInvoicePdf } from "@/lib/documents/pdf";
import { createClient } from "@/lib/supabase/server";
import type { InvoiceRecord, ProjectRecord } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: invoiceRow } = await supabase
    .from("invoices")
    .select("id, project_id, invoice_number, title, issue_date, due_date, status, currency, subtotal, tax_amount, total, notes")
    .eq("id", id)
    .single<{
      id: string;
      project_id: string;
      invoice_number: string;
      title: string;
      issue_date: string;
      due_date: string;
      status: InvoiceRecord["status"];
      currency: string;
      subtotal: number;
      tax_amount: number;
      total: number;
      notes: string | null;
    }>();

  if (!invoiceRow) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const { data: lineRows } = await supabase
    .from("invoice_line_items")
    .select("id, description, quantity, unit_price")
    .eq("invoice_id", id)
    .order("sort_order", { ascending: true })
    .returns<{ id: string; description: string; quantity: number; unit_price: number }[]>();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, slug, client_name, status, completion_percent, estimated_completion_date, last_updated, weekly_summary, next_action_required")
    .eq("id", invoiceRow.project_id)
    .single<{
      id: string;
      name: string;
      slug: string;
      client_name: string;
      status: ProjectRecord["status"];
      completion_percent: number;
      estimated_completion_date: string | null;
      last_updated: string;
      weekly_summary: string;
      next_action_required: string;
    }>();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const { data: portal } = await supabase
    .from("project_portals")
    .select("designs")
    .eq("project_id", invoiceRow.project_id)
    .maybeSingle<{ designs: Array<{ heroImagePath?: string }> | null }>();
  const heroImagePath = portal?.designs?.[0]?.heroImagePath;
  let heroImageBytes: Uint8Array | null = null;
  if (heroImagePath) {
    const { data } = await supabase.storage.from("project-files").download(heroImagePath);
    if (data) heroImageBytes = new Uint8Array(await data.arrayBuffer());
  }

  const invoice: InvoiceRecord = {
    id: invoiceRow.id,
    projectId: invoiceRow.project_id,
    invoiceNumber: invoiceRow.invoice_number,
    title: invoiceRow.title,
    issueDate: invoiceRow.issue_date,
    dueDate: invoiceRow.due_date,
    status: invoiceRow.status,
    currency: invoiceRow.currency,
    subtotal: Number(invoiceRow.subtotal),
    taxAmount: Number(invoiceRow.tax_amount),
    total: Number(invoiceRow.total),
    notes: invoiceRow.notes,
    lineItems: (lineRows ?? []).map((line) => ({
      id: line.id,
      description: line.description,
      quantity: Number(line.quantity),
      unitPrice: Number(line.unit_price),
    })),
  };

  const pdf = await buildInvoicePdf(
    invoice,
    {
    id: project.id,
    name: project.name,
    slug: project.slug,
    clientName: project.client_name,
    status: "In Progress",
    completionPercent: project.completion_percent,
    estimatedCompletionDate: project.estimated_completion_date,
    lastUpdated: project.last_updated,
    weeklySummary: project.weekly_summary,
      nextActionRequired: project.next_action_required,
    },
    { heroImageBytes },
  );
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
    },
  });
}
