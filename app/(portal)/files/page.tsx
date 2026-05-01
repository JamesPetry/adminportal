import { Download, Eye, FileArchive, FileImage, FileSpreadsheet, FileText, FileType2, ScrollText } from "lucide-react";
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
  const imageFiles = portalFiles.filter((item) => (item.mimeType ?? "").startsWith("image/"));
  const nonImageFiles = portalFiles.filter((item) => !(item.mimeType ?? "").startsWith("image/"));
  const categories = Array.from(new Set(nonImageFiles.map((item) => item.category)));

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
        {imageFiles.length ? (
          <AnimatedReveal>
            <Card className="editorial-shell border-zinc-300/80 bg-[#faf8f2] shadow-none">
              <CardHeader>
                <CardTitle className="text-base font-semibold tracking-tight text-zinc-900">Image Deliverables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="columns-1 gap-4 md:columns-2 xl:columns-3">
                  {imageFiles.map((file) => (
                    <article key={file.id} className="mb-4 break-inside-avoid overflow-hidden rounded-[1.1rem] border border-zinc-400/15 bg-white">
                      <a href={signedMap.get(file.id) ?? "#"} target="_blank" rel="noreferrer">
                        <img src={signedMap.get(file.id) ?? ""} alt={file.fileName} className="h-auto w-full object-cover" />
                      </a>
                      <div className="space-y-2 p-3">
                        <p className="line-clamp-2 text-sm font-medium text-zinc-900">{file.fileName}</p>
                        <p className="text-xs text-zinc-500">{file.category} · {new Date(file.createdAt).toLocaleDateString()}</p>
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
                    </article>
                  ))}
                </div>
              </CardContent>
            </Card>
          </AnimatedReveal>
        ) : null}
        {nonImageFiles.length ? (
          <AnimatedReveal delay={0.06}>
            <Card className="editorial-shell border-zinc-300/80 bg-white shadow-none">
              <CardHeader>
                <CardTitle className="text-base font-semibold tracking-tight text-zinc-900">Documents & Other Files</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {nonImageFiles.map((file) => (
                    <div key={file.id} className="grid min-h-[90px] gap-3 rounded-[1.1rem] border border-zinc-400/15 bg-zinc-50/45 p-4 md:grid-cols-[auto_1fr_auto]">
                      <div className="rounded-lg border border-zinc-200 bg-white p-2 text-zinc-700">
                        <FileGlyph mimeType={file.mimeType} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-zinc-900">{file.fileName}</div>
                        <div className="text-sm text-zinc-500">{file.category}</div>
                        <div className="text-xs text-zinc-500">{file.mimeType ?? "file"} · {new Date(file.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={signedMap.get(file.id) ?? "#"}
                          rel="noreferrer"
                          target="_blank"
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-zinc-200")}
                        >
                          <Eye className="h-4 w-4" />
                          Open
                        </a>
                        <a
                          href={signedMap.get(file.id) ?? "#"}
                          download
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-zinc-200")}
                        >
                          <Download className="h-4 w-4" />
                          Save
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </AnimatedReveal>
        ) : null}
        {categories.map((category, index) => {
          const files = nonImageFiles.filter((item) => item.category === category);

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

function FileGlyph({ mimeType }: { mimeType: string | null }) {
  const mime = (mimeType ?? "").toLowerCase();
  if (mime.includes("pdf")) return <FileText className="h-4 w-4" />;
  if (mime.includes("sheet") || mime.includes("excel") || mime.includes("csv")) return <FileSpreadsheet className="h-4 w-4" />;
  if (mime.includes("image")) return <FileImage className="h-4 w-4" />;
  return <FileType2 className="h-4 w-4" />;
}
