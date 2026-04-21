import { FeedbackBoard } from "@/components/feedback/feedback-board";
import { PageShell } from "@/components/layout/page-shell";
import { AnimatedReveal } from "@/components/shared/animated-reveal";
import { getClientPortalView } from "@/lib/portal/server";

export const metadata = {
  title: "Feedback | Strat X Advisory Portal",
};

export default async function FeedbackPage() {
  const {
    payload: { feedback, includedRevisions },
  } = await getClientPortalView();

  return (
    <PageShell title="Feedback & Revisions">
      <AnimatedReveal>
        <FeedbackBoard items={feedback} includedRevisions={includedRevisions} />
      </AnimatedReveal>
    </PageShell>
  );
}
