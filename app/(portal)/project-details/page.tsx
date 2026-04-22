import { Download, ExternalLink, Mail } from "lucide-react";
import Link from "next/link";

import { signAgreement } from "@/app/(portal)/agreement-actions";
import { PageShell } from "@/components/layout/page-shell";
import { AnimatedReveal } from "@/components/shared/animated-reveal";
import { EmptyState } from "@/components/shared/empty-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAgreementsByProjectId, getClientPortalView } from "@/lib/portal/server";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Project Details | Strat X Advisory Portal",
};

export default async function ProjectDetailsPage() {
  const {
    project,
    payload: { projectDetails },
  } = await getClientPortalView();
  const agreements = await getAgreementsByProjectId(project.id);
  const keyContacts = projectDetails.keyContacts ?? [];
  const faqItems = projectDetails.faq ?? [];
  const includedItems = projectDetails.includedItems ?? [];
  const redesignGoals = projectDetails.redesignGoals ?? [];

  return (
    <PageShell title="Project Details">
      <div className="space-y-6">
        <AnimatedReveal>
          <Card className="editorial-shell border-zinc-300/80 bg-white shadow-none">
            <CardContent className="space-y-10 p-8 md:p-12">
              <div className="grid gap-8 lg:grid-cols-12">
                <div className="space-y-3 lg:col-span-8">
                  <p className="editorial-kicker">Strategic Artifact</p>
                  <h2 className="font-heading text-7xl font-medium leading-[0.9] tracking-tight text-zinc-900">
                    Project Proposal
                  </h2>
                  <p className="max-w-3xl text-sm leading-7 text-zinc-600">
                    {projectDetails.scopeSummary || "Project scope summary will be added by your project team."}
                  </p>
                </div>
                <div className="space-y-3 lg:col-span-4 lg:text-right">
                  <p className="editorial-kicker">Project Access</p>
                  {projectDetails.stagingUrl ? (
                    <a
                      href={projectDetails.stagingUrl}
                      className="inline-flex items-center gap-1 text-sm text-zinc-900 hover:text-zinc-700"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open staging link
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <p className="text-sm text-zinc-500">No staging link shared yet.</p>
                  )}
                  <Button variant="outline" className="mt-2 border-zinc-200">
                    <Download className="h-4 w-4" />
                    Download agreement pack
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-12">
                <Card className="rounded-[1.4rem] border-zinc-300/20 bg-[#d9f2ff]/35 shadow-none lg:col-span-7">
                  <CardHeader>
                    <CardTitle className="font-heading text-4xl font-medium tracking-tight text-zinc-900">Scope of Work</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DetailList title="Included in this redesign" items={includedItems} />
                  </CardContent>
                </Card>

                <Card className="rounded-[1.4rem] border-zinc-300/20 bg-[#f9dbe2]/45 shadow-none lg:col-span-5">
                  <CardHeader>
                    <CardTitle className="font-heading text-4xl font-medium tracking-tight text-zinc-900">Primary Goals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DetailList title="Goals and outcomes" items={redesignGoals} />
                  </CardContent>
                </Card>
              </div>

              {(projectDetails.proposalSections ?? []).length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {(projectDetails.proposalSections ?? []).map((section) => (
                    <Card key={section.id} className="rounded-[1.2rem] border-zinc-300/20 bg-zinc-50/70 shadow-none">
                      <CardHeader>
                        <CardTitle className="font-heading text-4xl font-medium tracking-tight text-zinc-900">
                          {section.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {section.imageUrl ? (
                          <div className="overflow-hidden rounded-xl border border-zinc-400/15">
                            <img src={section.imageUrl} alt={section.title} className="h-44 w-full object-cover" />
                          </div>
                        ) : null}
                        <p className="text-sm leading-7 text-zinc-600">{section.body}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </AnimatedReveal>

        <AnimatedReveal delay={0.08}>
          <Card className="editorial-shell border-zinc-300/80 bg-white shadow-none">
            <CardHeader>
              <CardTitle className="font-heading text-5xl font-medium tracking-tight text-zinc-900">Key Contacts</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {keyContacts.map((contact) => (
                <div key={contact.email} className="rounded-[1.2rem] border border-zinc-400/15 bg-zinc-50/45 p-5">
                  <p className="text-sm font-medium text-zinc-900">{contact.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-zinc-500">{contact.role}</p>
                  <a href={`mailto:${contact.email}`} className="mt-3 inline-flex items-center gap-1 text-sm text-zinc-800">
                    <Mail className="h-3.5 w-3.5" />
                    {contact.email}
                  </a>
                </div>
              ))}
              {!keyContacts.length ? (
                <div className="md:col-span-3">
                  <EmptyState
                    icon={Mail}
                    title="No contacts listed yet"
                    description="Primary client and project contacts will appear here."
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </AnimatedReveal>

        <AnimatedReveal delay={0.12}>
          <Card className="editorial-shell border-zinc-300/80 bg-[#f5f4ef] shadow-none">
            <CardHeader>
              <CardTitle className="font-heading text-5xl font-medium tracking-tight text-zinc-900">Client FAQ</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {faqItems.map((item) => (
                <div key={item.question} className="rounded-[1.2rem] border border-zinc-400/15 bg-white p-5">
                  <p className="text-sm font-medium text-zinc-900">{item.question}</p>
                  <p className="mt-2 text-sm leading-7 text-zinc-600">{item.answer}</p>
                </div>
              ))}
              {!faqItems.length ? (
                <div className="md:col-span-2">
                  <EmptyState icon={Download} title="No FAQ entries yet" description="Process FAQs will be added here." />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </AnimatedReveal>

        <AnimatedReveal delay={0.16}>
          <Card className="editorial-shell border-zinc-300/80 bg-white shadow-none">
            <CardHeader>
              <CardTitle className="font-heading text-5xl font-medium tracking-tight text-zinc-900">Client Agreements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {agreements.map((agreement) => (
                <article key={agreement.id} className="rounded-[1.4rem] border border-zinc-400/15 bg-[#f8f5ef] p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="editorial-kicker">Agreement</p>
                      <h3 className="mt-2 font-heading text-4xl text-zinc-900">{agreement.title}</h3>
                      <p className="mt-2 text-xs uppercase tracking-[0.12em] text-zinc-500">{agreement.status.replaceAll("_", " ")}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/api/agreements/${agreement.id}/pdf`}
                        className={cn(buttonVariants({ variant: "outline" }), "border-zinc-300 bg-white")}
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Link>
                      <Link
                        href={`/api/agreements/${agreement.id}/pdf`}
                        className={cn(buttonVariants(), "bg-zinc-900 text-white")}
                      >
                        Open full view
                      </Link>
                    </div>
                  </div>
                  {agreement.status !== "fully_signed" ? (
                    <form action={signAgreement} className="mt-4 rounded-xl border border-zinc-300/70 bg-white p-4">
                      <input type="hidden" name="agreementId" value={agreement.id} />
                      <input type="hidden" name="projectId" value={project.id} />
                      <label className="text-xs uppercase tracking-[0.12em] text-zinc-500">Legal signature</label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <input
                          name="signatureName"
                          required
                          placeholder="Type your legal signature name"
                          className="h-10 min-w-72 rounded-full border border-zinc-300 bg-white px-4 text-sm"
                        />
                        <button className="h-10 rounded-full bg-zinc-900 px-5 text-sm text-white hover:bg-zinc-800">
                          Sign agreement
                        </button>
                      </div>
                    </form>
                  ) : null}
                </article>
              ))}
              {!agreements.length ? (
                <EmptyState
                  icon={Download}
                  title="No agreements have been issued yet"
                  description="Agreements will appear here once sent by the project team."
                />
              ) : null}
            </CardContent>
          </Card>
        </AnimatedReveal>
      </div>
    </PageShell>
  );
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="editorial-kicker">{title}</p>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item} className="text-sm leading-7 text-zinc-700">
            • {item}
          </li>
        ))}
        {!items.length ? <li className="text-sm text-zinc-400">Nothing added yet.</li> : null}
      </ul>
    </div>
  );
}
