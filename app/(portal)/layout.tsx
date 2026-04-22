import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { PortalSidebar } from "@/components/layout/portal-sidebar";
import { getClientPortalView, getUserContext } from "@/lib/portal/server";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const context = await getUserContext();

  if (context.role === "admin") {
    redirect("/admin");
  }

  const { payload, project } = await getClientPortalView();

  return (
    <div className="min-h-screen bg-[#ece8df] text-slate-900">
      <div className="mx-auto flex w-full max-w-[1700px]">
        <PortalSidebar clientName={project.clientName} projectStatus={payload.overview.projectStatus} />
        <main className="min-h-screen flex-1">{children}</main>
      </div>
    </div>
  );
}
