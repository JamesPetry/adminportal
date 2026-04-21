import type { ReactNode } from "react";

import { PortalHeader } from "@/components/layout/portal-header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { getClientPortalView } from "@/lib/portal/server";

export async function PageShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const { context, client, payload } = await getClientPortalView();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
      <MobileNav />
      <PortalHeader
        title={title}
        viewerName={context.fullName}
        clientName={client.name}
        projectStatus={payload.overview.projectStatus}
        lastUpdated={payload.overview.lastUpdated}
      />
      {children}
    </div>
  );
}
