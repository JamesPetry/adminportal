"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getProjectById, getUserContext } from "@/lib/portal/server";

export async function startAdminClientPreview(projectId: string) {
  const context = await getUserContext();
  if (context.role !== "admin") throw new Error("Only admin users can start preview mode.");

  const project = await getProjectById(projectId);
  if (!project) throw new Error("Project not found.");

  const cookieStore = await cookies();
  cookieStore.set("admin-client-preview", "1", { path: "/", sameSite: "lax" });
  cookieStore.set("active-project-id", projectId, { path: "/", sameSite: "lax" });

  redirect("/dashboard");
}

export async function stopAdminClientPreview() {
  const context = await getUserContext();
  if (context.role !== "admin") throw new Error("Only admin users can stop preview mode.");

  const cookieStore = await cookies();
  const activeProjectId = cookieStore.get("active-project-id")?.value ?? null;
  cookieStore.delete("admin-client-preview");

  if (activeProjectId) {
    redirect(`/admin/projects/${activeProjectId}`);
  }
  redirect("/admin");
}
