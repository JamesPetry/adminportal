import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { PortalSidebar } from "@/components/layout/portal-sidebar";
import { getPortalPayloadByClientId, getUserContext } from "@/lib/portal/server";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const context = await getUserContext();

  if (context.role === "admin") {
    redirect("/admin");
  }

  if (!context.client) {
    throw new Error("Client account is missing a linked client record.");
  }

  const payload = await getPortalPayloadByClientId(context.client);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="mx-auto flex w-full max-w-[1700px]">
        <PortalSidebar clientName={context.client.name} projectStatus={payload.overview.projectStatus} />
        <main className="min-h-screen flex-1">{children}</main>
      </div>
    </div>
  );
}
