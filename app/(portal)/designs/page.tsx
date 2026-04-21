import Link from "next/link";
import { Check, MessageCircle, MoveRight } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { AnimatedReveal } from "@/components/shared/animated-reveal";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getClientPortalView } from "@/lib/portal/server";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Designs | Strat X Advisory Portal",
};

export default async function DesignsPage() {
  const {
    payload: { designs },
  } = await getClientPortalView();

  return (
    <PageShell title="Design Directions">
      <div className="grid gap-5 lg:grid-cols-3">
        {!designs.length ? (
          <div className="lg:col-span-3">
            <EmptyState
              icon={MessageCircle}
              title="No design concepts uploaded yet"
              description="Design directions will appear here once your design team publishes them for review."
            />
          </div>
        ) : null}
        {designs.map((concept, index) => (
          <AnimatedReveal key={concept.id} delay={index * 0.06}>
            <Card className="h-full border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <div className="mb-4 flex h-48 items-end rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100 p-4">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500">
                    {concept.thumbnailLabel}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base font-semibold tracking-tight text-slate-900">
                      {concept.title}
                    </CardTitle>
                    <StatusBadge status={concept.version} className="bg-slate-50 text-slate-700" />
                  </div>
                  <StatusBadge status={concept.status} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-slate-600">{concept.shortDescription}</p>
              </CardContent>
              <CardFooter className="grid grid-cols-1 gap-2">
                <Link
                  href={`/designs/${concept.id}`}
                  className={cn(buttonVariants({ variant: "outline" }), "justify-between border-slate-200")}
                >
                  View Details
                  <MoveRight className="h-4 w-4" />
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="ghost" className="justify-start text-slate-700">
                    <MessageCircle className="h-4 w-4" />
                    Leave Feedback
                  </Button>
                  <Button variant="ghost" className="justify-start text-slate-700">
                    <Check className="h-4 w-4" />
                    Approve
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </AnimatedReveal>
        ))}
      </div>
    </PageShell>
  );
}
