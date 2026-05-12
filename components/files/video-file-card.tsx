import { Download, ExternalLink, Film } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type { ProjectFileRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  file: ProjectFileRecord;
  fileUrl: string;
  actions?: React.ReactNode;
  compact?: boolean;
};

export function VideoFileCard({ file, fileUrl, actions, compact = false }: Props) {
  return (
    <article className="overflow-hidden rounded-[1.4rem] border border-zinc-400/15 bg-white shadow-none">
      <div className={cn("grid gap-0", compact ? "lg:grid-cols-[1.15fr_0.85fr]" : "lg:grid-cols-[1.2fr_0.8fr]")}>
        <div className="bg-zinc-950">
          <div className="relative aspect-video w-full">
            <video
              controls
              preload="metadata"
              poster={file.previewImageUrl ?? undefined}
              className="h-full w-full bg-black object-contain"
            >
              <source src={fileUrl} type={file.mimeType ?? "video/mp4"} />
            </video>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-4 p-5">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="editorial-kicker">Video Deliverable</p>
                <h3 className="mt-2 font-heading text-3xl leading-none text-zinc-900">{file.fileName}</h3>
              </div>
              <div className="rounded-full border border-zinc-200 bg-zinc-50 p-2 text-zinc-700">
                <Film className="h-4 w-4" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.12em] text-zinc-500">
              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1">{file.category}</span>
              {file.durationSeconds ? (
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1">{formatDuration(file.durationSeconds)}</span>
              ) : null}
              {file.sizeBytes ? (
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1">{formatBytes(file.sizeBytes)}</span>
              ) : null}
            </div>
            <p className="text-sm text-zinc-500">{new Date(file.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-zinc-200")}
            >
              <ExternalLink className="h-4 w-4" />
              Open
            </a>
            <a
              href={fileUrl}
              download
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-zinc-200")}
            >
              <Download className="h-4 w-4" />
              Download
            </a>
            {actions}
          </div>
        </div>
      </div>
    </article>
  );
}

function formatDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}
