import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { buildEmptyPortalPayload } from "@/lib/portal/defaults";
import { createClient } from "@/lib/supabase/server";
import type {
  AgreementRecord,
  CalendarEvent,
  CalendarEventRecord,
  ClientRecord,
  InvoiceLineItem,
  InvoiceRecord,
  PortalPayload,
  ProjectFileRecord,
  ProjectRecord,
  UserContext,
  UserRole,
  ViewerContext,
} from "@/lib/types";

type ProfileRow = { id: string; full_name: string | null; role: UserRole };

type ProjectRow = {
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
};

type PortalRow = {
  timeline: PortalPayload["timeline"] | null;
  designs: PortalPayload["designs"] | null;
  feedback: PortalPayload["feedback"] | null;
  project_details: PortalPayload["projectDetails"] | null;
  client_actions: PortalPayload["clientActions"] | null;
  included_revisions: number | null;
};

export const getViewerContext = cache(async (): Promise<ViewerContext> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id || !user.email) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single<ProfileRow>();

  if (!profile) {
    throw new Error("Profile not found for this auth user.");
  }

  return {
    userId: user.id,
    email: user.email,
    fullName: profile.full_name ?? user.email,
    role: profile.role,
  };
});

export async function getAccessibleProjects() {
  const viewer = await getViewerContext();
  const supabase = await createClient();

  let query = supabase
    .from("projects")
    .select(
      "id, name, slug, client_name, status, completion_percent, estimated_completion_date, last_updated, weekly_summary, next_action_required",
    )
    .eq("archived", false)
    .order("updated_at", { ascending: false });

  if (viewer.role !== "admin") {
    const { data: memberRows } = await supabase
      .from("project_members")
      .select("project_id")
      .in("invitation_status", ["invited", "active"])
      .or(`user_id.eq.${viewer.userId},email.eq.${viewer.email.toLowerCase()}`);

    const projectIds = (memberRows ?? []).map((row) => row.project_id);
    if (!projectIds.length) return [];
    query = query.in("id", projectIds);
  }

  const { data } = await query.returns<ProjectRow[]>();
  return (data ?? []).map<ProjectRecord>((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    clientName: row.client_name,
    status: row.status,
    completionPercent: row.completion_percent,
    estimatedCompletionDate: row.estimated_completion_date,
    lastUpdated: row.last_updated,
    weeklySummary: row.weekly_summary,
    nextActionRequired: row.next_action_required,
  }));
}

export async function getProjectById(projectId: string) {
  const projects = await getAccessibleProjects();
  return projects.find((project) => project.id === projectId) ?? null;
}

export async function getActiveProject(projectId?: string | null) {
  const projects = await getAccessibleProjects();
  if (!projects.length) return null;
  if (projectId) {
    const selected = projects.find((project) => project.id === projectId);
    if (selected) return selected;
  }
  return projects[0];
}

export async function getPortalPayloadByProjectId(project: ProjectRecord): Promise<PortalPayload> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_portals")
    .select("timeline, designs, feedback, project_details, client_actions, included_revisions")
    .eq("project_id", project.id)
    .maybeSingle<PortalRow>();

  const fallback = buildEmptyPortalPayload(project.clientName);
  const payload: PortalPayload = {
    overview: {
      projectName: project.name,
      clientName: project.clientName,
      projectStatus: project.status,
      completionPercent: project.completionPercent,
      estimatedCompletionDate: project.estimatedCompletionDate ?? "TBD",
      lastUpdated: project.lastUpdated,
      weeklySummary: project.weeklySummary,
      nextActionRequired: project.nextActionRequired,
    },
    timeline: data?.timeline ?? fallback.timeline,
    designs: data?.designs ?? fallback.designs,
    invoices: [],
    feedback: data?.feedback ?? fallback.feedback,
    files: [],
    projectDetails: data?.project_details ?? fallback.projectDetails,
    clientActions: data?.client_actions ?? fallback.clientActions,
    includedRevisions: data?.included_revisions ?? fallback.includedRevisions,
  };

  payload.projectDetails = {
    ...payload.projectDetails,
    includedItems: payload.projectDetails.includedItems ?? [],
    redesignGoals: payload.projectDetails.redesignGoals ?? [],
    keyContacts: payload.projectDetails.keyContacts ?? [],
    faq: payload.projectDetails.faq ?? [],
    proposalSections: payload.projectDetails.proposalSections ?? [],
  };
  return resolvePortalMediaUrls(payload);
}

async function resolvePortalMediaUrls(payload: PortalPayload): Promise<PortalPayload> {
  const supabase = await createClient();
  const sign = async (path?: string) => {
    if (!path) return undefined;
    const { data } = await supabase.storage.from("project-files").createSignedUrl(path, 60 * 60);
    return data?.signedUrl;
  };

  const timeline = await Promise.all(
    payload.timeline.map(async (week) => ({
      ...week,
      imageUrl: week.imagePath ? await sign(week.imagePath) : undefined,
    })),
  );
  const designs = await Promise.all(
    payload.designs.map(async (design) => ({
      ...design,
      heroImageUrl: design.heroImagePath ? await sign(design.heroImagePath) : undefined,
    })),
  );
  const proposalSections = await Promise.all(
    (payload.projectDetails.proposalSections ?? []).map(async (section) => ({
      ...section,
      imageUrl: section.imagePath ? await sign(section.imagePath) : undefined,
    })),
  );

  return {
    ...payload,
    timeline,
    designs,
    projectDetails: {
      ...payload.projectDetails,
      proposalSections,
    },
  };
}

export async function getProjectFiles(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_files")
    .select("id, project_id, category, file_name, storage_path, mime_type, size_bytes, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .returns<
      {
        id: string;
        project_id: string;
        category: string;
        file_name: string;
        storage_path: string;
        mime_type: string | null;
        size_bytes: number | null;
        created_at: string;
      }[]
    >();

  const rows = (data ?? []).map<ProjectFileRecord>((row) => ({
    id: row.id,
    projectId: row.project_id,
    category: row.category,
    fileName: row.file_name,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
  }));

  const signedMap = new Map<string, string>();
  await Promise.all(
    rows.map(async (file) => {
      const { data: signed } = await supabase.storage
        .from("project-files")
        .createSignedUrl(file.storagePath, 60 * 60);
      if (signed?.signedUrl) signedMap.set(file.id, signed.signedUrl);
    }),
  );

  return { rows, signedMap };
}

export async function getInvoicesByProjectId(projectId: string): Promise<InvoiceRecord[]> {
  const supabase = await createClient();
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, project_id, invoice_number, title, issue_date, due_date, status, currency, subtotal, tax_amount, total, notes")
    .eq("project_id", projectId)
    .order("issue_date", { ascending: false })
    .returns<
      {
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
      }[]
    >();

  const ids = (invoices ?? []).map((invoice) => invoice.id);
  const itemMap = new Map<string, InvoiceLineItem[]>();
  if (ids.length) {
    const { data: lineItems } = await supabase
      .from("invoice_line_items")
      .select("id, invoice_id, description, quantity, unit_price, sort_order")
      .in("invoice_id", ids)
      .order("sort_order", { ascending: true })
      .returns<
        {
          id: string;
          invoice_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          sort_order: number;
        }[]
      >();

    for (const line of lineItems ?? []) {
      const list = itemMap.get(line.invoice_id) ?? [];
      list.push({
        id: line.id,
        description: line.description,
        quantity: Number(line.quantity),
        unitPrice: Number(line.unit_price),
      });
      itemMap.set(line.invoice_id, list);
    }
  }

  return (invoices ?? []).map((invoice) => ({
    id: invoice.id,
    projectId: invoice.project_id,
    invoiceNumber: invoice.invoice_number,
    title: invoice.title,
    issueDate: invoice.issue_date,
    dueDate: invoice.due_date,
    status: invoice.status,
    currency: invoice.currency,
    subtotal: Number(invoice.subtotal),
    taxAmount: Number(invoice.tax_amount),
    total: Number(invoice.total),
    notes: invoice.notes,
    lineItems: itemMap.get(invoice.id) ?? [],
  }));
}

export async function getAgreementsByProjectId(projectId: string): Promise<AgreementRecord[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("agreements")
    .select(
      "id, project_id, title, status, content, client_sig_name, client_signed_at, admin_sig_name, admin_signed_at, sent_at",
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .returns<
      {
        id: string;
        project_id: string;
        title: string;
        status: AgreementRecord["status"];
        content: string;
        client_sig_name: string | null;
        client_signed_at: string | null;
        admin_sig_name: string | null;
        admin_signed_at: string | null;
        sent_at: string | null;
      }[]
    >();

  return (data ?? []).map((row) => ({
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    status: row.status,
    content: row.content,
    clientSigName: row.client_sig_name,
    clientSignedAt: row.client_signed_at,
    adminSigName: row.admin_sig_name,
    adminSignedAt: row.admin_signed_at,
    sentAt: row.sent_at,
  }));
}

export async function getManualCalendarEventsByProjectId(projectId: string): Promise<CalendarEventRecord[]> {
  const supabase = await createClient();
  const mapRows = (
    data:
      | Array<{
          id: string;
          project_id: string;
          title: string;
          start_date: string;
          end_date: string | null;
          color_token: CalendarEventRecord["colorToken"];
          entry_type?: CalendarEventRecord["entryType"] | null;
          invoice_id?: string | null;
          agreement_id?: string | null;
          project_file_id?: string | null;
          storage_path?: string | null;
          source_ref?: string | null;
          notes: string | null;
          created_by?: string | null;
        }>
      | null,
  ) =>
    (data ?? []).map((row) => ({
      id: row.id,
      projectId: row.project_id,
      title: row.title,
      startDate: row.start_date,
      endDate: row.end_date,
      colorToken: row.color_token,
      entryType: row.entry_type ?? "note",
      invoiceId: row.invoice_id ?? null,
      agreementId: row.agreement_id ?? null,
      projectFileId: row.project_file_id ?? null,
      storagePath: row.storage_path ?? null,
      sourceRef: row.source_ref ?? null,
      notes: row.notes,
      createdBy: row.created_by ?? null,
    }));

  const { data, error } = await supabase
    .from("project_calendar_events")
    .select(
      "id, project_id, title, start_date, end_date, color_token, entry_type, invoice_id, agreement_id, project_file_id, storage_path, source_ref, notes, created_by",
    )
    .eq("project_id", projectId)
    .order("start_date", { ascending: true });

  if (!error) {
    return mapRows(data as Awaited<typeof data>);
  }

  const { data: fallbackData, error: fallbackError } = await supabase
    .from("project_calendar_events")
    .select("id, project_id, title, start_date, end_date, color_token, notes")
    .eq("project_id", projectId)
    .order("start_date", { ascending: true });
  if (fallbackError) {
    throw new Error(fallbackError.message);
  }
  return mapRows(fallbackData as Awaited<typeof fallbackData>);
}

function safeDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : value;
}

function parseDateRangeStart(dateRange: string) {
  const hit = dateRange.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  return hit?.[1] ?? null;
}

export async function getCalendarEventsByProjectId(projectId: string): Promise<CalendarEvent[]> {
  const [invoices, manualEvents] = await Promise.all([
    getInvoicesByProjectId(projectId),
    getManualCalendarEventsByProjectId(projectId),
  ]);
  const supabase = await createClient();
  const project = await getProjectById(projectId);
  if (!project) return [];
  const payload = await getPortalPayloadByProjectId(project);

  const events: CalendarEvent[] = [];

  for (const invoice of invoices) {
    if (safeDate(invoice.issueDate)) {
      events.push({
        id: `inv-issue-${invoice.id}`,
        title: `${invoice.invoiceNumber} issued`,
        date: invoice.issueDate,
        endDate: null,
        kind: "invoice_issue",
        sourceRef: invoice.id,
        colorToken: "finance",
        status: invoice.status,
        downloadUrl: `/api/invoices/${invoice.id}/pdf`,
      });
    }
    if (safeDate(invoice.dueDate)) {
      events.push({
        id: `inv-due-${invoice.id}`,
        title: `${invoice.invoiceNumber} due`,
        date: invoice.dueDate,
        endDate: null,
        kind: "invoice_due",
        sourceRef: invoice.id,
        colorToken: "finance",
        status: invoice.status,
        downloadUrl: `/api/invoices/${invoice.id}/pdf`,
      });
    }
  }

  for (const week of payload.timeline) {
    const start = parseDateRangeStart(week.dateRange);
    if (!start) continue;
    events.push({
      id: `timeline-${week.id}`,
      title: week.title,
      date: start,
      endDate: null,
      kind: "timeline",
      sourceRef: week.id,
      colorToken: "timeline",
      status: week.status,
    });
  }

  for (const action of payload.clientActions) {
    if (!safeDate(action.dueDate)) continue;
    events.push({
      id: `action-${action.id}`,
      title: action.title,
      date: action.dueDate,
      endDate: null,
      kind: "client_action",
      sourceRef: action.id,
      colorToken: "approvals",
      status: action.category,
    });
  }

  for (const event of manualEvents) {
    let downloadUrl: string | null = null;
    let linkedFileName: string | null = null;
    let previewUrl: string | null = null;
    if (event.invoiceId) {
      downloadUrl = `/api/invoices/${event.invoiceId}/pdf`;
    } else if (event.agreementId) {
      downloadUrl = `/api/agreements/${event.agreementId}/pdf`;
    } else if (event.storagePath) {
      const { data: signed } = await supabase.storage.from("project-files").createSignedUrl(event.storagePath, 60 * 60);
      downloadUrl = signed?.signedUrl ?? null;
      if (event.entryType === "image") previewUrl = signed?.signedUrl ?? null;
      linkedFileName = event.storagePath.split("/").at(-1) ?? null;
    } else if (event.projectFileId) {
      const { data: fileRow } = await supabase
        .from("project_files")
        .select("storage_path, file_name")
        .eq("id", event.projectFileId)
        .maybeSingle<{ storage_path: string; file_name: string }>();
      if (fileRow?.storage_path) {
        const { data: signed } = await supabase.storage.from("project-files").createSignedUrl(fileRow.storage_path, 60 * 60);
        downloadUrl = signed?.signedUrl ?? null;
        if (event.entryType === "image") previewUrl = signed?.signedUrl ?? null;
        linkedFileName = fileRow.file_name;
      }
    }

    events.push({
      id: `manual-${event.id}`,
      title: event.title,
      date: event.startDate,
      endDate: event.endDate,
      kind: "manual",
      sourceRef: event.id,
      colorToken: event.colorToken,
      status: event.notes,
      entryType: event.entryType,
      notes: event.notes,
      downloadUrl,
      linkedFileName,
      previewUrl,
      createdBy: event.createdBy ?? null,
    });
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

// Compatibility helpers for existing route components.
export async function getUserContext(): Promise<UserContext> {
  const viewer = await getViewerContext();
  return {
    userId: viewer.userId,
    email: viewer.email,
    fullName: viewer.fullName,
    role: viewer.role,
    client: null,
  };
}

export async function getClientById(projectId: string): Promise<ClientRecord | null> {
  const project = await getProjectById(projectId);
  if (!project) return null;
  return { id: project.id, name: project.name, slug: project.slug };
}

export async function getPortalPayloadByClientId(client: ClientRecord): Promise<PortalPayload> {
  const project = await getProjectById(client.id);
  if (!project) return buildEmptyPortalPayload(client.name);
  return getPortalPayloadByProjectId(project);
}

export async function getClientPortalView() {
  const viewer = await getViewerContext();
  const cookieStore = await cookies();
  const requestedProjectId = cookieStore.get("active-project-id")?.value ?? null;
  const project = await getActiveProject(requestedProjectId);
  if (!project) {
    throw new Error("No accessible projects found.");
  }
  const payload = await getPortalPayloadByProjectId(project);
  payload.overview.weeklySummary = payload.overview.weeklySummary || "";
  payload.overview.nextActionRequired = payload.overview.nextActionRequired || "";
  const client: ClientRecord = { id: project.id, name: project.clientName, slug: project.slug };
  return {
    context: viewer,
    client,
    payload,
    project,
  };
}
