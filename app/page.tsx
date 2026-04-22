import { redirect } from "next/navigation";

import { getViewerContext } from "@/lib/portal/server";

export default async function HomePage() {
  const context = await getViewerContext();

  if (context.role === "admin") {
    redirect("/admin");
  }

  redirect("/dashboard");
}
