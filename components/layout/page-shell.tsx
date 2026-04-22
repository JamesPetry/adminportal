import type { ReactNode } from "react";

import { PortalHeader } from "@/components/layout/portal-header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { getAccessibleProjects, getClientPortalView } from "@/lib/portal/server";

export async function PageShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const { context, client, payload, project } = await getClientPortalView();
  const projects = await getAccessibleProjects();

  return (
    <div className="mx-auto w-full max-w-[1700px] px-4 py-6 sm:px-10 sm:py-8">
      <MobileNav />
      <PortalHeader
        title={title}
        viewerName={context.fullName}
        clientName={client.name}
        projectStatus={payload.overview.projectStatus}
        lastUpdated={payload.overview.lastUpdated}
        projects={projects}
        activeProjectId={project.id}
      />
      {children}
    </div>
  );
}
