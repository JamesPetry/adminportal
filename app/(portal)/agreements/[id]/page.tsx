import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";

import { signAgreement } from "@/app/(portal)/agreement-actions";
import { PageShell } from "@/components/layout/page-shell";
import { AnimatedReveal } from "@/components/shared/animated-reveal";
import { Card, CardContent } from "@/components/ui/card";
import { getAgreementsByProjectId, getClientPortalView } from "@/lib/portal/server";

type Props = { params: Promise<{ id: string }> };

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

export default async function AgreementViewPage({ params }: Props) {
  const { id } = await params;
  const { project } = await getClientPortalView();
  const agreements = await getAgreementsByProjectId(project.id);
  const agreement = agreements.find((entry) => entry.id === id);
  if (!agreement) notFound();

  const waitingForReview =
    agreement.workflowState === "pending_review" && agreement.status !== "fully_signed";

  return (
    <PageShell title="Agreement">
      <div className="space-y-5">
        <Link href="/project-details" className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900">
          <ArrowLeft className="h-4 w-4" />
          Back to project details
        </Link>

        <AnimatedReveal>
          <Card className="editorial-shell border-zinc-300/80 bg-white shadow-none">
            <CardContent className="space-y-10 p-10 lg:p-14">
              <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="editorial-kicker">Client Agreement</p>
                  <h2 className="mt-2 font-heading text-6xl tracking-tight text-zinc-900">{agreement.title}</h2>
                  <p className="mt-3 text-sm text-zinc-600">
                    Status: {formatStatus(agreement.status)} · Workflow: {formatStatus(agreement.workflowState)}
                  </p>
                  {waitingForReview ? (
                    <p className="mt-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-900">
                      Waiting for review
                    </p>
                  ) : null}
                </div>
                <Link
                  href={`/api/agreements/${agreement.id}/pdf`}
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </Link>
              </div>

              <div className="rounded-[1.2rem] border border-zinc-200 bg-zinc-50/70 p-6">
                <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-700">{agreement.content}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1rem] border border-zinc-200 bg-white p-4">
                  <p className="editorial-kicker">Client signature</p>
                  <p className="mt-2 text-sm font-medium text-zinc-900">{agreement.clientSigName ?? "Not signed yet"}</p>
                  <p className="mt-1 text-xs text-zinc-500">{agreement.clientSignedAt ?? "-"}</p>
                </div>
                <div className="rounded-[1rem] border border-zinc-200 bg-white p-4">
                  <p className="editorial-kicker">Studio signature</p>
                  <p className="mt-2 text-sm font-medium text-zinc-900">{agreement.adminSigName ?? "Not signed yet"}</p>
                  <p className="mt-1 text-xs text-zinc-500">{agreement.adminSignedAt ?? "-"}</p>
                </div>
              </div>

              {agreement.status !== "fully_signed" ? (
                <form action={signAgreement} className="rounded-[1rem] border border-zinc-200 bg-white p-4">
                  <input type="hidden" name="agreementId" value={agreement.id} />
                  <input type="hidden" name="projectId" value={project.id} />
                  <label className="text-xs uppercase tracking-[0.12em] text-zinc-500">Legal signature name</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <input
                      name="signatureName"
                      required
                      placeholder="Type your full legal name"
                      className="h-10 min-w-72 rounded-full border border-zinc-300 bg-white px-4 text-sm"
                    />
                    <button className="h-10 rounded-full bg-zinc-900 px-5 text-sm text-white hover:bg-zinc-800">
                      Sign agreement
                    </button>
                  </div>
                </form>
              ) : null}
            </CardContent>
          </Card>
        </AnimatedReveal>
      </div>
    </PageShell>
  );
}
