import { Download, Eye, FileArchive, FileText, ScrollText } from "lucide-react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { AnimatedReveal } from "@/components/shared/animated-reveal";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getClientPortalView, getProjectFiles } from "@/lib/portal/server";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Files | Strat X Advisory Portal",
};

export default async function FilesPage() {
  const { project } = await getClientPortalView();
  const { rows: portalFiles, signedMap } = await getProjectFiles(project.id);
  const categories = Array.from(new Set(portalFiles.map((item) => item.category)));

  return (
    <PageShell title="Files & Deliverables">
      <div className="space-y-5">
        <AnimatedReveal>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/invoices" className="editorial-shell min-h-[120px] flex items-center justify-between border-zinc-300/80 bg-rose-50/75 p-6">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-zinc-800"><FileText className="h-4 w-4" />Invoice archive</span>
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-500">Open</span>
            </Link>
            <Link href="/project-details" className="editorial-shell min-h-[120px] flex items-center justify-between border-zinc-300/80 bg-sky-50/75 p-6">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-zinc-800"><ScrollText className="h-4 w-4" />Proposals & agreements</span>
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-500">Open</span>
            </Link>
            <div className="editorial-shell min-h-[120px] border-zinc-300/80 bg-zinc-50 p-6">
              <p className="editorial-kicker">Library status</p>
              <p className="mt-3 text-sm text-zinc-800">{portalFiles.length} files across {categories.length || 0} categories</p>
            </div>
          </div>
        </AnimatedReveal>

        {!categories.length ? (
          <EmptyState
            icon={FileArchive}
            title="No files uploaded yet"
            description="Project files, invoices, agreements, and deliverables will appear here once published."
          />
        ) : null}
        {categories.map((category, index) => {
          const files = portalFiles.filter((item) => item.category === category);

          return (
            <AnimatedReveal key={category} delay={index * 0.04}>
              <Card className="editorial-shell border-zinc-300/80 bg-white shadow-none">
                <CardHeader>
                  <CardTitle className="text-base font-semibold tracking-tight text-zinc-900">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  {files.length ? (
                    <div className="space-y-3">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          className="grid min-h-[90px] gap-3 rounded-[1.1rem] border border-zinc-400/15 bg-zinc-50/45 p-4 md:grid-cols-[1.2fr_0.8fr_0.8fr_auto]"
                        >
                          <div className="text-sm font-medium text-zinc-900">{file.fileName}</div>
                          <div className="text-sm text-zinc-500">{file.mimeType ?? "file"}</div>
                          <div className="text-sm text-zinc-500">{new Date(file.createdAt).toLocaleDateString()}</div>
                          <div className="flex gap-2">
                            <a
                              href={signedMap.get(file.id) ?? "#"}
                              rel="noreferrer"
                              target="_blank"
                              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-zinc-200")}
                            >
                              <Eye className="h-4 w-4" />
                              Preview
                            </a>
                            <a
                              href={signedMap.get(file.id) ?? "#"}
                              download
                              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-zinc-200")}
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={FileArchive}
                      title="No files in this category yet"
                      description="Uploads will appear here as deliverables are prepared for review and handoff."
                    />
                  )}
                </CardContent>
              </Card>
            </AnimatedReveal>
          );
        })}
      </div>
    </PageShell>
  );
}
