import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, MessageCircle } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { AnimatedReveal } from "@/components/shared/animated-reveal";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getClientPortalView } from "@/lib/portal/server";
import { cn } from "@/lib/utils";

type ConceptPageProps = { params: Promise<{ id: string }> };

export default async function ConceptDetailsPage({ params }: ConceptPageProps) {
  const { id } = await params;
  const {
    payload: { designs },
  } = await getClientPortalView();
  const concept = designs.find((item) => item.id === id);

  if (!concept) {
    notFound();
  }

  return (
    <PageShell title={concept.title}>
      <AnimatedReveal>
        <div className="mb-4">
          <Link href="/designs" className={cn(buttonVariants({ variant: "ghost" }), "text-slate-600")}>
            <ArrowLeft className="h-4 w-4" />
            Back to concepts
          </Link>
        </div>
      </AnimatedReveal>

      <AnimatedReveal delay={0.05}>
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">{concept.title}</CardTitle>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{concept.shortDescription}</p>
            </div>
            <div className="space-y-2">
              <StatusBadge status={concept.version} className="bg-slate-50 text-slate-700" />
              <StatusBadge status={concept.status} />
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            <DetailBlock title="Hero section notes" value={concept.details.heroNotes} />
            <DetailBlock title="Layout rationale" value={concept.details.layoutRationale} />
            <DetailBlock title="Typography rationale" value={concept.details.typographyRationale} />
            <DetailBlock title="Color notes" value={concept.details.colorNotes} />
            <DetailBlock title="UX notes" value={concept.details.uxNotes} />
            <DetailBlock title="Mobile responsiveness" value={concept.details.mobileConsiderations} />
            <DetailBlock
              title="Why this direction fits Strat X Advisory"
              value={concept.details.fitReason}
              className="lg:col-span-2"
            />
            <div className="lg:col-span-2 flex flex-wrap gap-3 pt-2">
              <Button className="bg-blue-600 text-white hover:bg-blue-700">
                <MessageCircle className="h-4 w-4" />
                Leave Feedback
              </Button>
              <Button variant="outline" className="border-slate-200">
                <Check className="h-4 w-4" />
                Approve Direction
              </Button>
            </div>
          </CardContent>
        </Card>
      </AnimatedReveal>
    </PageShell>
  );
}

function DetailBlock({ title, value, className }: { title: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}
