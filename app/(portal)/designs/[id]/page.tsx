import Image from "next/image";
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
          <Link href="/designs" className={cn(buttonVariants({ variant: "ghost" }), "text-zinc-600")}>
            <ArrowLeft className="h-4 w-4" />
            Back to concepts
          </Link>
        </div>
      </AnimatedReveal>

      <AnimatedReveal delay={0.05}>
        <Card className="editorial-shell border-zinc-300/80 bg-white shadow-none">
          <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="editorial-kicker">Design Direction</p>
              <CardTitle className="mt-2 font-heading text-6xl font-medium tracking-tight text-zinc-900">{concept.title}</CardTitle>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600">{concept.shortDescription}</p>
            </div>
            <div className="space-y-2">
              <StatusBadge status={concept.version} className="bg-zinc-100 text-zinc-700" />
              <StatusBadge status={concept.status} />
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            {concept.heroImageUrl ? (
              <div className="relative h-72 w-full overflow-hidden rounded-[1.2rem] border border-zinc-400/15 lg:col-span-2">
                <Image
                  src={concept.heroImageUrl}
                  alt={concept.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 896px"
                  priority
                />
              </div>
            ) : null}
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
              <Button className="bg-zinc-900 text-white hover:bg-zinc-800">
                <MessageCircle className="h-4 w-4" />
                Leave Feedback
              </Button>
              <Button variant="outline" className="border-zinc-200">
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
    <div className={cn("rounded-[1.2rem] border border-zinc-400/15 bg-zinc-50/70 p-4", className)}>
      <p className="editorial-kicker">{title}</p>
      <p className="mt-2 text-sm leading-7 text-zinc-700">{value}</p>
    </div>
  );
}
