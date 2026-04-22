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

  if (!agreementId || !projectId || !signatureName) {
    throw new Error("Agreement details are incomplete.");
  }

  const supabase = await createClient();
  const { data: agreement } = await supabase
    .from("agreements")
    .select("status, client_signed_at, admin_signed_at")
    .eq("id", agreementId)
    .single<{
      status: string;
      client_signed_at: string | null;
      admin_signed_at: string | null;
    }>();

  if (!agreement) throw new Error("Agreement not found.");

  const now = new Date().toISOString();
  if (context.role === "client") {
    const nextStatus = agreement.admin_signed_at ? "fully_signed" : "pending_admin_signature";
    const { error } = await supabase
      .from("agreements")
      .update({
        client_sig_name: signatureName,
        client_signed_at: now,
        status: nextStatus,
      })
      .eq("id", agreementId);
    if (error) throw new Error(error.message);
  } else {
    const nextStatus = agreement.client_signed_at ? "fully_signed" : "pending_client_signature";
    const { error } = await supabase
      .from("agreements")
      .update({
        admin_sig_name: signatureName,
        admin_signed_at: now,
        status: nextStatus,
      })
      .eq("id", agreementId);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/project-details");
  revalidatePath(`/admin/projects/${projectId}`);
  redirect(context.role === "admin" ? `/admin/projects/${projectId}` : "/project-details");
}
