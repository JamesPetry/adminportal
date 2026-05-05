import Image from "next/image";
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
      <div className="grid gap-6 lg:grid-cols-12">
        {!designs.length ? (
          <div className="lg:col-span-12">
            <EmptyState
              icon={MessageCircle}
              title="No design concepts uploaded yet"
              description="Design directions will appear here once your design team publishes them for review."
            />
          </div>
        ) : null}
        {designs.map((concept, index) => (
          <AnimatedReveal key={concept.id} delay={index * 0.06}>
            <div className="lg:col-span-4">
              <Card
                className={cn(
                  "editorial-shell h-full border-zinc-300/80 shadow-none",
                  index % 3 === 0 && "bg-[#fff9e5]",
                  index % 3 === 1 && "bg-[#ecf5ee]",
                  index % 3 === 2 && "bg-[#ebf5f9]",
                )}
              >
                <CardHeader>
                  <div className="relative mb-4 flex h-52 items-end overflow-hidden rounded-[1.6rem] border border-zinc-400/15 bg-white/70 p-5">
                    {concept.heroImageUrl ? (
                      <Image
                        src={concept.heroImageUrl}
                        alt={concept.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 33vw"
                        priority={index === 0}
                      />
                    ) : null}
                    <span className="relative rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-500">
                      {concept.thumbnailLabel}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="font-heading text-4xl font-medium tracking-tight text-zinc-900">
                        {concept.title}
                      </CardTitle>
                      <StatusBadge status={concept.version} className="bg-zinc-100 text-zinc-700" />
                    </div>
                    <StatusBadge status={concept.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-7 text-zinc-600">{concept.shortDescription}</p>
                </CardContent>
                <CardFooter className="grid grid-cols-1 gap-2 border-none bg-transparent pt-0">
                  <Link
                    href={`/designs/${concept.id}`}
                    className={cn(buttonVariants({ variant: "outline" }), "justify-between border-zinc-300 bg-white/85")}
                  >
                    View Details
                    <MoveRight className="h-4 w-4" />
                  </Link>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="ghost" className="justify-start text-zinc-700">
                      <MessageCircle className="h-4 w-4" />
                      Leave Feedback
                    </Button>
                    <Button variant="ghost" className="justify-start text-zinc-700">
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </AnimatedReveal>
        ))}
      </div>
    </PageShell>
  );
}
