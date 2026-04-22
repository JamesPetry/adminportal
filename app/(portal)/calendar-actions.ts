"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { getViewerContext } from "@/lib/portal/server";
import { createClient } from "@/lib/supabase/server";
import type { CalendarEntryType, CalendarEvent, CalendarEventColorToken } from "@/lib/types";

type CreateEntryInput = {
  projectId: string;
  date: string;
  entryType: CalendarEntryType;
  title: string;
  notes?: string;
  sourceId?: string;
  file?: File | null;
};

function colorForEntry(entryType: CalendarEntryType): CalendarEventColorToken {
  if (entryType === "invoice" || entryType === "agreement") return "finance";
  if (entryType === "note") return "approvals";
  if (entryType === "image" || entryType === "file") return "custom";
  return "custom";
}

function assertPermission(role: "admin" | "client", entryType: CalendarEntryType) {
  if (role === "admin") return;
  if (entryType === "note" || entryType === "file" || entryType === "image") return;
  throw new Error("You do not have permission to add this entry type.");
}

export async function createCalendarEntry(input: CreateEntryInput): Promise<CalendarEvent> {
  const viewer = await getViewerContext();
  assertPermission(viewer.role, input.entryType);

  if (!input.projectId || !input.date || !input.title.trim()) {
    throw new Error("Project, date, and title are required.");
  }

  const supabase = await createClient();
  let storagePath: string | null = null;
  let projectFileId: string | null = null;
  let invoiceId: string | null = null;
  let agreementId: string | null = null;
  let downloadUrl: string | null = null;

  if ((input.entryType === "image" || input.entryType === "file") && input.file) {
    const buffer = Buffer.from(await input.file.arrayBuffer());
    storagePath = `${input.projectId}/calendar/${randomUUID()}-${input.file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("project-files")
      .upload(storagePath, buffer, { contentType: input.file.type || undefined, upsert: false });
    if (uploadError) throw new Error(uploadError.message);

    const { data: fileRow, error: fileError } = await supabase
      .from("project_files")
      .insert({
        project_id: input.projectId,
        category: "Calendar Attachments",
        file_name: input.file.name,
        storage_path: storagePath,
        mime_type: input.file.type || null,
        size_bytes: input.file.size,
        uploaded_by: viewer.userId,
      })
      .select("id")
      .single<{ id: string }>();
    if (fileError) throw new Error(fileError.message);
    projectFileId = fileRow.id;
    const { data: signed } = await supabase.storage.from("project-files").createSignedUrl(storagePath, 60 * 60);
    downloadUrl = signed?.signedUrl ?? null;
  }

  if ((input.entryType === "image" || input.entryType === "file") && !input.file) {
    throw new Error("Please select a file to upload.");
  }

  if (input.entryType === "invoice") {
    if (!input.sourceId) throw new Error("Invoice source is required.");
    invoiceId = input.sourceId;
    downloadUrl = `/api/invoices/${invoiceId}/pdf`;
  }
  if (input.entryType === "agreement") {
    if (!input.sourceId) throw new Error("Agreement source is required.");
    agreementId = input.sourceId;
    downloadUrl = `/api/agreements/${agreementId}/pdf`;
  }

  const { data: row, error } = await supabase
    .from("project_calendar_events")
    .insert({
      project_id: input.projectId,
      title: input.title.trim(),
      start_date: input.date,
      color_token: colorForEntry(input.entryType),
      entry_type: input.entryType,
      notes: input.notes?.trim() || null,
      source_ref: input.sourceId ?? null,
      storage_path: storagePath,
      project_file_id: projectFileId,
      invoice_id: invoiceId,
      agreement_id: agreementId,
      created_by: viewer.userId,
    })
    .select("id, title, start_date, color_token, notes, entry_type")
    .single<{
      id: string;
      title: string;
      start_date: string;
      color_token: CalendarEventColorToken;
      notes: string | null;
      entry_type: CalendarEntryType;
    }>();
  if (error || !row) throw new Error(error?.message ?? "Unable to create calendar entry.");

  revalidatePath("/calendar");
  revalidatePath("/dashboard");

  return {
    id: `manual-${row.id}`,
    title: row.title,
    date: row.start_date,
    endDate: null,
    kind: "manual",
    sourceRef: row.id,
    colorToken: row.color_token,
    status: row.notes,
    entryType: row.entry_type,
    notes: row.notes,
    downloadUrl,
    previewUrl: input.entryType === "image" ? downloadUrl : null,
    createdBy: viewer.userId,
  };
}

export async function deleteCalendarEntry(projectId: string, entryId: string) {
  const viewer = await getViewerContext();
  const supabase = await createClient();
  const rawId = entryId.replace(/^manual-/, "");
  const { data: row } = await supabase
    .from("project_calendar_events")
    .select("created_by, entry_type, storage_path, project_file_id")
    .eq("id", rawId)
    .eq("project_id", projectId)
    .single<{ created_by: string | null; entry_type: CalendarEntryType; storage_path: string | null; project_file_id: string | null }>();

  if (!row) throw new Error("Calendar entry not found.");
  if (viewer.role !== "admin" && row.created_by !== viewer.userId) {
    throw new Error("You do not have permission to delete this entry.");
  }

  if (row.storage_path) {
    await supabase.storage.from("project-files").remove([row.storage_path]);
  }
  if (row.project_file_id) {
    await supabase.from("project_files").delete().eq("id", row.project_file_id).eq("project_id", projectId);
  }

  const { error } = await supabase.from("project_calendar_events").delete().eq("id", rawId).eq("project_id", projectId);
  if (error) throw new Error(error.message);

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}

export async function updateCalendarEntry(input: {
  projectId: string;
  entryId: string;
  title: string;
  notes?: string;
}) {
  const viewer = await getViewerContext();
  const supabase = await createClient();
  const rawId = input.entryId.replace(/^manual-/, "");
  const { data: row } = await supabase
    .from("project_calendar_events")
    .select("created_by")
    .eq("id", rawId)
    .eq("project_id", input.projectId)
    .single<{ created_by: string | null }>();

  if (!row) throw new Error("Calendar entry not found.");
  if (viewer.role !== "admin" && row.created_by !== viewer.userId) {
    throw new Error("You do not have permission to update this entry.");
  }

  const { error } = await supabase
    .from("project_calendar_events")
    .update({
      title: input.title.trim(),
      notes: input.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", rawId)
    .eq("project_id", input.projectId);
  if (error) throw new Error(error.message);

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}
