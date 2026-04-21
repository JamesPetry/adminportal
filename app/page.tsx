import { redirect } from "next/navigation";

import { getUserContext } from "@/lib/portal/server";

export default async function HomePage() {
  const context = await getUserContext();

  if (context.role === "admin") {
    redirect("/admin");
  }

  redirect("/dashboard");
}
