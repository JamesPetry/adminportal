"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function setActiveProject(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) return;
  const cookieStore = await cookies();
  cookieStore.set("active-project-id", projectId);
  revalidatePath("/", "layout");
}
