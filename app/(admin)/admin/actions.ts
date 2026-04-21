"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isSupabaseEnabled } from "@/lib/config";
import { buildEmptyPortalPayload } from "@/lib/portal/defaults";
import { getClientById, getUserContext } from "@/lib/portal/server";
import { upsertLocalPortalPayload } from "@/lib/portal/local-store";
import { createClient } from "@/lib/supabase/server";
import type { ProjectStatus } from "@/lib/types";

export async function saveClientPortal(clientId: string, formData: FormData) {
  const context = await getUserContext();
  if (context.role !== "admin") {
    throw new Error("Only admin users can edit client portals.");
  }

  const client = await getClientById(clientId);
  if (!client) {
    throw new Error("Client not found.");
  }

  const fallback = buildEmptyPortalPayload(client.name);

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
    clientName: client.name,
    projectStatus: String(formData.get("projectStatus") ?? fallback.overview.projectStatus) as ProjectStatus,
    completionPercent: Number(formData.get("completionPercent") ?? fallback.overview.completionPercent),
    estimatedCompletionDate: String(formData.get("estimatedCompletionDate") ?? fallback.overview.estimatedCompletionDate),
    lastUpdated: String(formData.get("lastUpdated") ?? fallback.overview.lastUpdated),
    weeklySummary: String(formData.get("weeklySummary") ?? fallback.overview.weeklySummary),
    nextActionRequired: String(formData.get("nextActionRequired") ?? fallback.overview.nextActionRequired),
  };

  const timeline = parseJson(String(formData.get("timelineJson") ?? ""), fallback.timeline);
  const designs = parseJson(String(formData.get("designsJson") ?? ""), fallback.designs);
  const invoices = parseJson(String(formData.get("invoicesJson") ?? ""), fallback.invoices);
  const feedback = parseJson(String(formData.get("feedbackJson") ?? ""), fallback.feedback);
  const files = parseJson(String(formData.get("filesJson") ?? ""), fallback.files);
  const projectDetails = parseJson(String(formData.get("projectDetailsJson") ?? ""), fallback.projectDetails);
  const clientActions = parseJson(String(formData.get("clientActionsJson") ?? ""), fallback.clientActions);
  const includedRevisions = Number(formData.get("includedRevisions") ?? fallback.includedRevisions);

  if (!isSupabaseEnabled) {
    upsertLocalPortalPayload(clientId, {
      overview,
      timeline,
      designs,
      invoices,
      feedback,
      files,
      projectDetails,
      clientActions,
      includedRevisions,
    });
  } else {
    const supabase = await createClient();
    const { error } = await supabase.from("portal_payloads").upsert(
      {
        client_id: clientId,
        overview,
        timeline,
        designs,
        invoices,
        feedback,
        files,
        project_details: projectDetails,
        client_actions: clientActions,
        included_revisions: includedRevisions,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "client_id" },
    );

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/timeline");
  revalidatePath("/designs");
  revalidatePath("/feedback");
  revalidatePath("/invoices");
  revalidatePath("/files");
  revalidatePath("/project-details");
  revalidatePath("/client-actions");
  revalidatePath(`/admin/clients/${clientId}`);

  redirect(`/admin/clients/${clientId}`);
}
