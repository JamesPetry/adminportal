import { NextResponse, type NextRequest } from "next/server";

import { buildAgreementPdf } from "@/lib/documents/pdf";
import { createClient } from "@/lib/supabase/server";
import type { AgreementRecord, ProjectRecord } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("agreements")
    .select(
      "id, project_id, title, status, workflow_state, content, client_sig_name, client_signed_at, admin_sig_name, admin_signed_at, sent_at",
    )
    .eq("id", id)
    .single<{
      id: string;
      project_id: string;
      title: string;
      status: AgreementRecord["status"];
      workflow_state: AgreementRecord["workflowState"] | null;
      content: string;
      client_sig_name: string | null;
      client_signed_at: string | null;
      admin_sig_name: string | null;
      admin_signed_at: string | null;
      sent_at: string | null;
    }>();

  if (!row) return NextResponse.json({ error: "Agreement not found" }, { status: 404 });
  const { data: project } = await supabase
    .from("projects")
    .select(
      "id, name, slug, client_name, business_signatory_name, status, completion_percent, estimated_completion_date, last_updated, weekly_summary, next_action_required",
    )
    .eq("id", row.project_id)
    .single<{
      id: string;
      name: string;
      slug: string;
      client_name: string;
      business_signatory_name: string | null;
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
    .select("project_details")
    .eq("project_id", row.project_id)
    .maybeSingle<{
      project_details: { proposalSections?: Array<{ imagePath?: string }> } | null;
    }>();
  const heroImagePath = portal?.project_details?.proposalSections?.[0]?.imagePath;
  let heroImageBytes: Uint8Array | null = null;
  if (heroImagePath) {
    const { data } = await supabase.storage.from("project-files").download(heroImagePath);
    if (data) heroImageBytes = new Uint8Array(await data.arrayBuffer());
  }

  const agreement: AgreementRecord = {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    status: row.status,
    workflowState: row.workflow_state ?? "pending_review",
    content: row.content,
    clientSigName: row.client_sig_name,
    clientSignedAt: row.client_signed_at,
    adminSigName: row.admin_sig_name,
    adminSignedAt: row.admin_signed_at,
    sentAt: row.sent_at,
  };

  const pdf = await buildAgreementPdf(
    agreement,
    {
    id: project.id,
    name: project.name,
    slug: project.slug,
    clientName: project.client_name,
    businessSignatoryName: project.business_signatory_name,
    status: project.status,
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
      "Content-Disposition": `attachment; filename="${agreement.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `agreement-${agreement.id}`}.pdf"`,
    },
  });
}
