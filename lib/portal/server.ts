import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { isSupabaseEnabled } from "@/lib/config";
import { buildEmptyPortalPayload } from "@/lib/portal/defaults";
import {
  getLocalClientById,
  getLocalClients,
  getLocalPortalPayload,
} from "@/lib/portal/local-store";
import { createClient } from "@/lib/supabase/server";
import type { ClientRecord, PortalPayload, UserContext, UserRole } from "@/lib/types";

type ProfileRow = {
  id: string;
  full_name: string | null;
  role: UserRole;
  client_id: string | null;
};

type PortalPayloadRow = {
  overview: PortalPayload["overview"] | null;
  timeline: PortalPayload["timeline"] | null;
  designs: PortalPayload["designs"] | null;
  invoices: PortalPayload["invoices"] | null;
  feedback: PortalPayload["feedback"] | null;
  files: PortalPayload["files"] | null;
  project_details: PortalPayload["projectDetails"] | null;
  client_actions: PortalPayload["clientActions"] | null;
  included_revisions: number | null;
};

export const getUserContext = cache(async (): Promise<UserContext> => {
  if (!isSupabaseEnabled) {
    const cookieStore = await cookies();
    const hasSession = cookieStore.get("local-session")?.value === "1";
    if (!hasSession) {
      redirect("/sign-in");
    }

    const role = (cookieStore.get("local-role")?.value as UserRole | undefined) ?? "client";
    const email = cookieStore.get("local-email")?.value ?? "local@portal.dev";
    const fullName = cookieStore.get("local-name")?.value ?? "Local User";
    const clientId = cookieStore.get("local-client-id")?.value ?? "client-stratx";
    const client = role === "admin" ? null : getLocalClientById(clientId);

    return {
      userId: "local-user",
      email,
      fullName,
      role,
      client,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id || !user.email) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, client_id")
    .eq("id", user.id)
    .single<ProfileRow>();

  if (!profile) {
    throw new Error("No profile found. Create a row in public.profiles for this auth user.");
  }

  let client: ClientRecord | null = null;
  if (profile.client_id) {
    const { data: clientRow } = await supabase
      .from("clients")
      .select("id, name, slug")
      .eq("id", profile.client_id)
      .single<ClientRecord>();
    client = clientRow ?? null;
  }

  return {
    userId: user.id,
    email: user.email,
    fullName: profile.full_name ?? user.email,
    role: profile.role,
    client,
  };
});

export async function getClientsList() {
  if (!isSupabaseEnabled) {
    return getLocalClients();
  }

  const supabase = await createClient();
  const { data } = await supabase.from("clients").select("id, name, slug").order("name");
  return (data ?? []) as ClientRecord[];
}

export async function getClientById(clientId: string) {
  if (!isSupabaseEnabled) {
    return getLocalClientById(clientId);
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("id, name, slug")
    .eq("id", clientId)
    .maybeSingle<ClientRecord>();
  return data ?? null;
}

export async function getPortalPayloadByClientId(client: ClientRecord): Promise<PortalPayload> {
  if (!isSupabaseEnabled) {
    return getLocalPortalPayload(client.id) ?? buildEmptyPortalPayload(client.name);
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("portal_payloads")
    .select(
      "overview, timeline, designs, invoices, feedback, files, project_details, client_actions, included_revisions",
    )
    .eq("client_id", client.id)
    .maybeSingle<PortalPayloadRow>();

  if (!data) {
    return buildEmptyPortalPayload(client.name);
  }

  const fallback = buildEmptyPortalPayload(client.name);
  return {
    overview: data.overview ?? fallback.overview,
    timeline: data.timeline ?? fallback.timeline,
    designs: data.designs ?? fallback.designs,
    invoices: data.invoices ?? fallback.invoices,
    feedback: data.feedback ?? fallback.feedback,
    files: data.files ?? fallback.files,
    projectDetails: data.project_details ?? fallback.projectDetails,
    clientActions: data.client_actions ?? fallback.clientActions,
    includedRevisions: data.included_revisions ?? fallback.includedRevisions,
  };
}

export async function getClientPortalView() {
  const context = await getUserContext();
  if (!context.client) {
    throw new Error("Client account is missing a linked client record.");
  }

  const payload = await getPortalPayloadByClientId(context.client);
  payload.overview.clientName = context.client.name;
  return { context, client: context.client, payload };
}
