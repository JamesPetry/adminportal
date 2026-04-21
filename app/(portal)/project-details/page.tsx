import { Download, ExternalLink, Mail } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { AnimatedReveal } from "@/components/shared/animated-reveal";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getClientPortalView } from "@/lib/portal/server";

export const metadata = {
  title: "Project Details | Strat X Advisory Portal",
};

export default async function ProjectDetailsPage() {
  const {
    payload: { projectDetails },
  } = await getClientPortalView();

  return (
    <PageShell title="Project Details">
      <div className="grid gap-4 lg:grid-cols-3">
        <AnimatedReveal>
          <Card className="border-slate-200 bg-white shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-semibold tracking-tight text-slate-900">Scope Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {projectDetails.scopeSummary ? (
                <p className="text-sm leading-6 text-slate-600">{projectDetails.scopeSummary}</p>
              ) : (
                <EmptyState
                  icon={ExternalLink}
                  title="Project scope pending"
                  description="Your scope summary and redesign objectives will appear here once published."
                />
              )}

              <DetailList title="Included in this redesign" items={projectDetails.includedItems} />
              <DetailList title="Primary goals" items={projectDetails.redesignGoals} />
            </CardContent>
          </Card>
        </AnimatedReveal>

        <AnimatedReveal delay={0.05}>
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold tracking-tight text-slate-900">Project Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Staging Link</p>
                {projectDetails.stagingUrl ? (
                  <a
                    href={projectDetails.stagingUrl}
                    className="mt-2 inline-flex items-center gap-1 text-blue-700 hover:text-blue-900"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {projectDetails.stagingUrl}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">No staging link shared yet.</p>
                )}
              </div>
              <Button variant="outline" className="w-full justify-start border-slate-200">
                <Download className="h-4 w-4" />
                Download contract / agreement
              </Button>
            </CardContent>
          </Card>
        </AnimatedReveal>

        <AnimatedReveal delay={0.08}>
          <Card className="border-slate-200 bg-white shadow-sm lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base font-semibold tracking-tight text-slate-900">Key Contacts</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {projectDetails.keyContacts.map((contact) => (
                <div key={contact.email} className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-medium text-slate-900">{contact.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500">{contact.role}</p>
                  <a href={`mailto:${contact.email}`} className="mt-3 inline-flex items-center gap-1 text-sm text-blue-700">
                    <Mail className="h-3.5 w-3.5" />
                    {contact.email}
                  </a>
                </div>
              ))}
              {!projectDetails.keyContacts.length ? (
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
          <Card className="border-slate-200 bg-white shadow-sm lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base font-semibold tracking-tight text-slate-900">Client FAQ</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {projectDetails.faq.map((item) => (
                <div key={item.question} className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-medium text-slate-900">{item.question}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.answer}</p>
                </div>
              ))}
              {!projectDetails.faq.length ? (
                <div className="md:col-span-2">
                  <EmptyState icon={Download} title="No FAQ entries yet" description="Process FAQs will be added here." />
                </div>
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
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{title}</p>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li key={item} className="text-sm leading-6 text-slate-700">
            • {item}
          </li>
        ))}
        {!items.length ? <li className="text-sm text-slate-400">Nothing added yet.</li> : null}
      </ul>
    </div>
  );
}
