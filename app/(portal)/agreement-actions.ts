"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getUserContext } from "@/lib/portal/server";
import { createClient } from "@/lib/supabase/server";

export async function signAgreement(formData: FormData) {
  const context = await getUserContext();
  const agreementId = String(formData.get("agreementId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  const signatureName = String(formData.get("signatureName") ?? "").trim();

  if (!agreementId || !projectId) {
    throw new Error("Agreement details are incomplete.");
  }

  const supabase = await createClient();
  const { data: agreement } = await supabase
    .from("agreements")
    .select("status, client_signed_at, admin_signed_at, workflow_state")
    .eq("id", agreementId)
    .single<{
      status: string;
      client_signed_at: string | null;
      admin_signed_at: string | null;
      workflow_state: string | null;
    }>();

  if (!agreement) throw new Error("Agreement not found.");
  const { data: project } = await supabase
    .from("projects")
    .select("business_signatory_name")
    .eq("id", projectId)
    .maybeSingle<{ business_signatory_name: string | null }>();

  const now = new Date().toISOString();
  if (context.role === "client") {
    const clientSignature = signatureName.trim();
    if (!clientSignature) {
      throw new Error("Legal signature name is required.");
    }
    if (agreement.client_signed_at) {
      throw new Error("Agreement is already signed by client. Contact admin to reset if required.");
    }
    const nextStatus = agreement.admin_signed_at ? "fully_signed" : "pending_admin_signature";
    const { error } = await supabase
      .from("agreements")
      .update({
        client_sig_name: clientSignature,
        client_signed_at: now,
        status: nextStatus,
        workflow_state: "pending_review",
      })
      .eq("id", agreementId);
    if (error) throw new Error(error.message);
  } else {
    const adminSignature = (signatureName || project?.business_signatory_name || "").trim();
    if (!adminSignature) {
      throw new Error("Business signatory name is required before admin signature.");
    }
    if (agreement.admin_signed_at) {
      throw new Error("Agreement is already signed by admin. Reset signatures to sign again.");
    }
    const nextStatus = agreement.client_signed_at ? "fully_signed" : "pending_client_signature";
    const { error } = await supabase
      .from("agreements")
      .update({
        admin_sig_name: adminSignature,
        admin_signed_at: now,
        status: nextStatus,
        workflow_state: "pending_review",
      })
      .eq("id", agreementId);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/project-details");
  revalidatePath("/dashboard");
  revalidatePath(`/admin/projects/${projectId}`);
  redirect(context.role === "admin" ? `/admin/projects/${projectId}` : "/project-details");
}
