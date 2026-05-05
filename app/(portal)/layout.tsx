import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { stopAdminClientPreview } from "@/app/preview-actions";
import { PortalSidebar } from "@/components/layout/portal-sidebar";
import { getClientPortalView, getUserContext } from "@/lib/portal/server";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const context = await getUserContext();
  const cookieStore = await cookies();
  const isAdminPreview = cookieStore.get("admin-client-preview")?.value === "1";

  if (context.role === "admin" && !isAdminPreview) {
    redirect("/admin");
  }

  const { payload, project } = await getClientPortalView();

  return (
    <div className="min-h-screen bg-[#ece8df] text-slate-900">
      {context.role === "admin" && isAdminPreview ? (
        <div className="border-b border-amber-300 bg-amber-100 px-4 py-2 text-xs text-amber-900 sm:px-8">
          <div className="mx-auto flex w-full max-w-[1700px] items-center justify-between">
            <p className="font-medium uppercase tracking-[0.12em]">Admin preview mode: client dashboard</p>
            <form action={stopAdminClientPreview}>
              <button type="submit" className="rounded-md border border-amber-400 bg-white px-2 py-1 font-semibold uppercase tracking-[0.1em] hover:bg-amber-50">
                Exit preview
              </button>
            </form>
          </div>
        </div>
      ) : null}
      <div className="mx-auto flex w-full max-w-[1700px]">
        <PortalSidebar clientName={project.clientName} projectStatus={payload.overview.projectStatus} />
        <main className="min-h-screen flex-1">{children}</main>
      </div>
    </div>
  );
}
