"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { randomUUID } from "node:crypto";

import { buildEmptyPortalPayload } from "@/lib/portal/defaults";
import { getProjectById, getUserContext } from "@/lib/portal/server";
import { createClient } from "@/lib/supabase/server";
import type { ProjectStatus } from "@/lib/types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function createProject(formData: FormData) {
  const context = await getUserContext();
  if (context.role !== "admin") throw new Error("Only admin users can create projects.");

  const projectName = String(formData.get("projectName") ?? "").trim();
  const clientName = String(formData.get("clientName") ?? "").trim();
  const clientEmail = String(formData.get("clientEmail") ?? "").trim().toLowerCase();
  if (!projectName || !clientName) throw new Error("Project name and client name are required.");

  const supabase = await createClient();
  const slug = `${toSlug(projectName)}-${Math.floor(Math.random() * 10000)}`;

  const { data: clientRow } = await supabase
    .from("clients")
    .upsert({ name: clientName, slug: toSlug(clientName) }, { onConflict: "slug" })
    .select("id")
    .single<{ id: string }>();

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      client_id: clientRow?.id ?? null,
      name: projectName,
      slug,
      client_name: clientName,
      status: "Not Started",
      completion_percent: 0,
      estimated_completion_date: null,
      created_by: context.userId,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !project) throw new Error(error?.message ?? "Unable to create project.");

  await supabase.from("project_portals").insert({
    project_id: project.id,
    timeline: [],
    designs: [],
    feedback: [],
    project_details: {},
    client_actions: [],
    included_revisions: 2,
  });

  await supabase.from("project_members").upsert(
    {
      project_id: project.id,
      email: context.email.toLowerCase(),
      role: "admin",
      user_id: context.userId,
      invitation_status: "active",
      invited_by: context.userId,
      accepted_at: new Date().toISOString(),
    },
    { onConflict: "project_id,email" },
  );

  if (clientEmail) {
    await assignClientToProject(project.id, clientEmail, false);
  }

  revalidatePath("/admin");
  redirect(`/admin/projects/${project.id}`);
}

export async function assignClientToProject(
  projectId: string,
  inputEmailOrFormData: string | FormData,
  redirectAfter = true,
) {
  const context = await getUserContext();
  if (context.role !== "admin") throw new Error("Only admin users can assign clients.");

  const clientEmail =
    typeof inputEmailOrFormData === "string"
      ? inputEmailOrFormData.trim().toLowerCase()
      : String(inputEmailOrFormData.get("clientEmail") ?? "").trim().toLowerCase();

  if (!clientEmail) throw new Error("Client email is required.");

  const supabase = await createClient();
  const { error: memberError } = await supabase.from("project_members").upsert(
    {
      project_id: projectId,
      email: clientEmail,
      role: "client",
      invitation_status: "invited",
      invited_by: context.userId,
    },
    { onConflict: "project_id,email" },
  );
  if (memberError) throw new Error(memberError.message);

  const { error: inviteError } = await supabase.auth.signInWithOtp({
    email: clientEmail,
    options: {
      emailRedirectTo: `${APP_URL}/auth/confirm?next=/dashboard`,
      shouldCreateUser: true,
    },
  });
  if (inviteError) throw new Error(inviteError.message);

  revalidatePath("/admin");
  revalidatePath(`/admin/projects/${projectId}`);
  if (redirectAfter) redirect(`/admin/projects/${projectId}`);
}

export async function deleteProject(formData: FormData) {
  const context = await getUserContext();
  if (context.role !== "admin") throw new Error("Only admin users can delete projects.");
  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) throw new Error("Missing project id.");

  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  redirect("/admin");
}

export async function uploadProjectFile(projectId: string, formData: FormData) {
  const context = await getUserContext();
  if (context.role !== "admin") throw new Error("Only admin users can upload files.");

  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file provided.");
  const category = String(formData.get("category") ?? "General");
  const fileName = String(formData.get("fileName") ?? file.name).trim() || file.name;

  const supabase = await createClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const storagePath = `${projectId}/${randomUUID()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("project-files")
    .upload(storagePath, buffer, { contentType: file.type || undefined, upsert: false });

  if (uploadError) throw new Error(uploadError.message);

  const { error: dbError } = await supabase.from("project_files").insert({
    project_id: projectId,
    category,
    file_name: fileName,
    storage_path: storagePath,
    mime_type: file.type || null,
    size_bytes: file.size,
    uploaded_by: context.userId,
  });
  if (dbError) throw new Error(dbError.message);

  revalidatePath("/files");
  revalidatePath(`/admin/projects/${projectId}`);
  redirect(`/admin/projects/${projectId}`);
}

export async function deleteProjectFile(formData: FormData) {
  const context = await getUserContext();
  if (context.role !== "admin") throw new Error("Only admin users can delete files.");
  const fileId = String(formData.get("fileId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  if (!fileId || !projectId) throw new Error("Missing file metadata.");

  const supabase = await createClient();
  const { data: fileRow } = await supabase
    .from("project_files")
    .select("storage_path")
    .eq("id", fileId)
    .single<{ storage_path: string }>();
  if (fileRow?.storage_path) {
    await supabase.storage.from("project-files").remove([fileRow.storage_path]);
  }
  await supabase.from("project_files").delete().eq("id", fileId);

  revalidatePath("/files");
  revalidatePath(`/admin/projects/${projectId}`);
  redirect(`/admin/projects/${projectId}`);
}

export async function createCalendarEvent(projectId: string, formData: FormData) {
  const context = await getUserContext();
  if (context.role !== "admin") throw new Error("Only admin users can create calendar events.");

  const title = String(formData.get("title") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "").trim();
  const endDate = String(formData.get("endDate") ?? "").trim() || null;
  const colorToken = String(formData.get("colorToken") ?? "custom").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (!title || !startDate) throw new Error("Title and start date are required.");

  const supabase = await createClient();
  const { error } = await supabase.from("project_calendar_events").insert({
    project_id: projectId,
    title,
    start_date: startDate,
    end_date: endDate,
    color_token: colorToken,
    entry_type: "note",
    source_ref: "admin-manual",
    notes,
    created_by: context.userId,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath(`/admin/projects/${projectId}`);
  redirect(`/admin/projects/${projectId}`);
}

export async function deleteCalendarEvent(formData: FormData) {
  const context = await getUserContext();
  if (context.role !== "admin") throw new Error("Only admin users can delete calendar events.");
  const eventId = String(formData.get("eventId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  if (!eventId || !projectId) throw new Error("Missing event metadata.");

  const supabase = await createClient();
  const { error } = await supabase.from("project_calendar_events").delete().eq("id", eventId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath(`/admin/projects/${projectId}`);
  redirect(`/admin/projects/${projectId}`);
}

export async function uploadPortalSectionImage(projectId: string, formData: FormData) {
  const context = await getUserContext();
  if (context.role !== "admin") throw new Error("Only admin users can upload images.");
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No image file provided.");

  const sectionType = String(formData.get("sectionType") ?? "").trim() as "timeline" | "design" | "proposal";
  const sectionId = String(formData.get("sectionId") ?? "").trim();
  if (!sectionType || !sectionId) throw new Error("Section type and section id are required.");

  const supabase = await createClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const storagePath = `${projectId}/sections/${sectionType}-${sectionId}-${randomUUID()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("project-files")
    .upload(storagePath, buffer, { contentType: file.type || undefined, upsert: false });
  if (uploadError) throw new Error(uploadError.message);

  const { data: portalRow } = await supabase
    .from("project_portals")
    .select("timeline, designs, project_details")
    .eq("project_id", projectId)
    .maybeSingle<{
      timeline: unknown[] | null;
      designs: unknown[] | null;
      project_details: Record<string, unknown> | null;
    }>();

  const timeline = (portalRow?.timeline ?? []) as Record<string, unknown>[];
  const designs = (portalRow?.designs ?? []) as Record<string, unknown>[];
  const projectDetails = (portalRow?.project_details ?? {}) as Record<string, unknown>;

  if (sectionType === "timeline") {
    for (const week of timeline) {
      if (String(week.id) === sectionId) week.imagePath = storagePath;
    }
  } else if (sectionType === "design") {
    for (const design of designs) {
      if (String(design.id) === sectionId) design.heroImagePath = storagePath;
    }
  } else {
    const sections = ((projectDetails.proposalSections as Record<string, unknown>[] | undefined) ?? []).map((section) =>
      String(section.id) === sectionId ? { ...section, imagePath: storagePath } : section,
    );
    projectDetails.proposalSections = sections;
  }

  await supabase.from("project_files").insert({
    project_id: projectId,
    category: "Section Images",
    file_name: file.name,
    storage_path: storagePath,
    mime_type: file.type || null,
    size_bytes: file.size,
    uploaded_by: context.userId,
  });

  const { error: updateError } = await supabase
    .from("project_portals")
    .upsert(
      {
        project_id: projectId,
        timeline,
        designs,
        project_details: projectDetails,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "project_id" },
    );
  if (updateError) throw new Error(updateError.message);

  revalidatePath("/calendar");
  revalidatePath("/designs");
  revalidatePath("/project-details");
  revalidatePath(`/admin/projects/${projectId}`);
  redirect(`/admin/projects/${projectId}`);
}

export async function createInvoice(projectId: string, formData: FormData) {
  const context = await getUserContext();
  if (context.role !== "admin") throw new Error("Only admin users can create invoices.");
  const supabase = await createClient();

  const invoiceNumber = String(formData.get("invoiceNumber") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const issueDate = String(formData.get("issueDate") ?? "");
  const dueDate = String(formData.get("dueDate") ?? "");
  const status = String(formData.get("status") ?? "Pending");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const lineDescriptions = formData.getAll("lineDescription").map(String);
  const lineQty = formData.getAll("lineQty").map((value) => Number(value));
  const lineUnit = formData.getAll("lineUnitPrice").map((value) => Number(value));
  const lineItems = lineDescriptions
    .map((description, i) => ({ description: description.trim(), quantity: lineQty[i] ?? 1, unitPrice: lineUnit[i] ?? 0 }))
    .filter((line) => line.description);

  const subtotal = lineItems.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const taxAmount = subtotal * 0.1;
  const total = subtotal + taxAmount;

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      project_id: projectId,
      invoice_number: invoiceNumber,
      title,
      issue_date: issueDate,
      due_date: dueDate,
      status,
      subtotal,
      tax_amount: taxAmount,
      total,
      notes,
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !invoice) throw new Error(error?.message ?? "Could not create invoice.");

  if (lineItems.length) {
    const { error: linesError } = await supabase.from("invoice_line_items").insert(
      lineItems.map((line, index) => ({
        invoice_id: invoice.id,
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unitPrice,
        sort_order: index,
      })),
    );
    if (linesError) throw new Error(linesError.message);
  }

  revalidatePath("/invoices");
  revalidatePath(`/admin/projects/${projectId}`);
  redirect(`/admin/projects/${projectId}`);
}

export async function createAgreement(projectId: string, formData: FormData) {
  const context = await getUserContext();
  if (context.role !== "admin") throw new Error("Only admin users can create agreements.");

  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const supabase = await createClient();
  const { error } = await supabase.from("agreements").insert({
    project_id: projectId,
    title,
    content,
    status: "draft",
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/project-details");
  redirect(`/admin/projects/${projectId}`);
}

export async function deleteInvoice(formData: FormData) {
  const context = await getUserContext();
  if (context.role !== "admin") throw new Error("Only admin users can delete invoices.");
  const invoiceId = String(formData.get("invoiceId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  if (!invoiceId || !projectId) throw new Error("Missing invoice details.");

  const supabase = await createClient();
  const { error } = await supabase.from("invoices").delete().eq("id", invoiceId);
  if (error) throw new Error(error.message);

  revalidatePath("/invoices");
  revalidatePath(`/admin/projects/${projectId}`);
  redirect(`/admin/projects/${projectId}`);
}

export async function deleteAgreement(formData: FormData) {
  const context = await getUserContext();
  if (context.role !== "admin") throw new Error("Only admin users can delete agreements.");
  const agreementId = String(formData.get("agreementId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  if (!agreementId || !projectId) throw new Error("Missing agreement details.");

  const supabase = await createClient();
  const { error } = await supabase.from("agreements").delete().eq("id", agreementId);
  if (error) throw new Error(error.message);

  revalidatePath("/project-details");
  revalidatePath(`/admin/projects/${projectId}`);
  redirect(`/admin/projects/${projectId}`);
}

export async function sendAgreement(formData: FormData) {
  const context = await getUserContext();
  if (context.role !== "admin") throw new Error("Only admin users can send agreements.");
  const agreementId = String(formData.get("agreementId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  if (!agreementId || !projectId) throw new Error("Missing agreement details.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("agreements")
    .update({
      status: "pending_client_signature",
      sent_at: new Date().toISOString(),
    })
    .eq("id", agreementId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/project-details");
  redirect(`/admin/projects/${projectId}`);
}

export async function saveClientPortal(projectId: string, formData: FormData) {
  const context = await getUserContext();
  if (context.role !== "admin") {
    throw new Error("Only admin users can edit client portals.");
  }

  const project = await getProjectById(projectId);
  if (!project) {
    throw new Error("Project not found.");
  }

  const fallback = buildEmptyPortalPayload(project.clientName);

  const parseJson = <T>(value: string, defaultValue: T): T => {
    if (!value.trim()) {
      return defaultValue;
    }
    try {
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  };

  const overview = {
    projectName: String(formData.get("projectName") ?? fallback.overview.projectName),
    clientName: project.clientName,
    projectStatus: String(formData.get("projectStatus") ?? fallback.overview.projectStatus) as ProjectStatus,
    completionPercent: Number(formData.get("completionPercent") ?? fallback.overview.completionPercent),
    estimatedCompletionDate: String(formData.get("estimatedCompletionDate") ?? fallback.overview.estimatedCompletionDate),
    lastUpdated: String(formData.get("lastUpdated") ?? fallback.overview.lastUpdated),
    weeklySummary: String(formData.get("weeklySummary") ?? fallback.overview.weeklySummary),
    nextActionRequired: String(formData.get("nextActionRequired") ?? fallback.overview.nextActionRequired),
  };

  const timeline = parseJson(String(formData.get("timelineJson") ?? ""), fallback.timeline);
  const designs = parseJson(String(formData.get("designsJson") ?? ""), fallback.designs);
  const feedback = parseJson(String(formData.get("feedbackJson") ?? ""), fallback.feedback);
  const projectDetails = parseJson(String(formData.get("projectDetailsJson") ?? ""), fallback.projectDetails);
  const clientActions = parseJson(String(formData.get("clientActionsJson") ?? ""), fallback.clientActions);
  const includedRevisions = Number(formData.get("includedRevisions") ?? fallback.includedRevisions);

  const supabase = await createClient();
  const { error: projectError } = await supabase
    .from("projects")
    .update({
      name: overview.projectName,
      status: overview.projectStatus,
      completion_percent: overview.completionPercent,
      estimated_completion_date:
        overview.estimatedCompletionDate === "TBD" ? null : overview.estimatedCompletionDate,
      last_updated: overview.lastUpdated,
      weekly_summary: overview.weeklySummary,
      next_action_required: overview.nextActionRequired,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);
  if (projectError) throw new Error(projectError.message);

  const { error } = await supabase.from("project_portals").upsert(
    {
      project_id: projectId,
      timeline,
      designs,
      feedback,
      project_details: projectDetails,
      client_actions: clientActions,
      included_revisions: includedRevisions,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "project_id" },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath("/designs");
  revalidatePath("/feedback");
  revalidatePath("/invoices");
  revalidatePath("/files");
  revalidatePath("/project-details");
  revalidatePath("/client-actions");
  revalidatePath(`/admin/projects/${projectId}`);

  redirect(`/admin/projects/${projectId}`);
}
