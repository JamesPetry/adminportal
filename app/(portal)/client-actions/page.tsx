import { ClientActionsBoard } from "@/components/client-actions/client-actions-board";
import { PageShell } from "@/components/layout/page-shell";
import { AnimatedReveal } from "@/components/shared/animated-reveal";
import { getClientPortalView } from "@/lib/portal/server";

export const metadata = {
  title: "Client Actions | Strat X Advisory Portal",
};

export default async function ClientActionsPage() {
  const {
    payload: { clientActions },
  } = await getClientPortalView();

  return (
    <PageShell title="Client Actions / Approvals">
      <AnimatedReveal>
        <ClientActionsBoard items={clientActions} />
      </AnimatedReveal>
    </PageShell>
  );
}
