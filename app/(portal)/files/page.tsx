import { Download, Eye, FileArchive } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { AnimatedReveal } from "@/components/shared/animated-reveal";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getClientPortalView } from "@/lib/portal/server";

export const metadata = {
  title: "Files | Strat X Advisory Portal",
};

const categories = ["Brand Assets", "Wireframes", "Design Exports", "Content Docs", "Final Deliverables"] as const;

export default async function FilesPage() {
  const {
    payload: { files: portalFiles },
  } = await getClientPortalView();

  return (
    <PageShell title="Files & Deliverables">
      <div className="space-y-5">
        {categories.map((category, index) => {
          const files = portalFiles.filter((item) => item.category === category);

          return (
            <AnimatedReveal key={category} delay={index * 0.04}>
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold tracking-tight text-slate-900">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  {files.length ? (
                    <div className="space-y-3">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[1.2fr_0.8fr_0.8fr_auto]"
                        >
                          <div className="text-sm font-medium text-slate-900">{file.fileName}</div>
                          <div className="text-sm text-slate-500">{file.fileType}</div>
                          <div className="text-sm text-slate-500">{file.uploadedAt}</div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="border-slate-200">
                              <Eye className="h-4 w-4" />
                              Preview
                            </Button>
                            <Button size="sm" variant="outline" className="border-slate-200">
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
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
