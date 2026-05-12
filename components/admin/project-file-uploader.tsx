"use client";

import { useRef, useState } from "react";
import { Loader2, Upload, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import * as tus from "tus-js-client";

import { registerProjectFileUpload } from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";

const VIDEO_RECOMMENDED_LIMIT_MB = 100;
const TUS_CHUNK_SIZE = 6 * 1024 * 1024;
const RETRY_DELAYS = [0, 3000, 5000, 10000, 20000];

type Props = {
  projectId: string;
};

const categories = [
  "Final Deliverables",
  "Design Exports",
  "Brand Assets",
  "Content Docs",
  "Wireframes",
  "Agreements",
  "Invoices",
  "General",
] as const;

export function ProjectFileUploader({ projectId }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsUploading(true);
    setProgress(0);
    setError(null);
    setSuccess(null);

    const file = formData.get("file");
    const category = String(formData.get("category") ?? "General");
    const fileName = String(formData.get("fileName") ?? "").trim();

    if (!(file instanceof File)) {
      setError("Choose a file before uploading.");
      setIsUploading(false);
      return;
    }

    const displayName = fileName || file.name;
    const storagePath = buildStoragePath(projectId, file.name, file.type);
    const supabase = createClient();
    let previewImagePath: string | null = null;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Your session has expired. Refresh the page and try again.");
      }

      let durationSeconds: number | null = null;
      if (file.type.startsWith("video/")) {
        const metadata = await extractVideoMetadata(file);
        durationSeconds = metadata.durationSeconds;
        if (metadata.posterBlob) {
          previewImagePath = `${projectId}/video-previews/${crypto.randomUUID()}.webp`;
          const { error: posterError } = await supabase.storage.from("project-files").upload(previewImagePath, metadata.posterBlob, {
            contentType: "image/webp",
            upsert: false,
            cacheControl: "3600",
          });
          if (posterError) throw posterError;
        }
      }

      if (shouldUseResumableUpload(file)) {
        await uploadWithTus({
          file,
          storagePath,
          accessToken: session.access_token,
          anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
          onProgress: setProgress,
        });
      } else {
        setProgress(15);
        const { error: uploadError } = await supabase.storage.from("project-files").upload(storagePath, file, {
          contentType: file.type || undefined,
          upsert: false,
          cacheControl: "3600",
        });
        if (uploadError) throw uploadError;
        setProgress(100);
      }

      await registerProjectFileUpload({
        projectId,
        category,
        fileName: displayName,
        storagePath,
        mimeType: file.type || null,
        sizeBytes: file.size,
        previewImagePath,
        durationSeconds,
      });

      formRef.current?.reset();
      setSuccess(`${displayName} uploaded successfully.`);
      setProgress(100);
      router.refresh();
    } catch (uploadError) {
      await cleanupPartialUpload({
        supabase,
        storagePath,
        previewImagePath,
      });
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
      setProgress(0);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="mt-3 rounded-[1.2rem] border border-zinc-200 bg-zinc-50/50 p-4">
      <form ref={formRef} action={handleSubmit} className="grid gap-3 md:grid-cols-4">
        <input
          name="fileName"
          placeholder="Display file name"
          className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm md:col-span-2"
        />
        <select name="category" defaultValue="Final Deliverables" className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm">
          {categories.map((categoryOption) => (
            <option key={categoryOption} value={categoryOption}>
              {categoryOption}
            </option>
          ))}
        </select>
        <input
          name="file"
          type="file"
          required
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.zip,.psd,.ai,.fig"
          className="h-9 rounded-lg border border-zinc-300 bg-white px-2 text-sm"
        />
        <div className="md:col-span-4 flex flex-wrap items-center gap-3">
          <Button type="submit" className="bg-zinc-900 text-white hover:bg-zinc-800" disabled={isUploading}>
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {isUploading ? "Uploading..." : "Upload file"}
          </Button>
          <span className="inline-flex items-center gap-2 text-xs text-zinc-500">
            <Video className="h-3.5 w-3.5" />
            Videos use resumable upload and are tuned for files up to roughly {VIDEO_RECOMMENDED_LIMIT_MB} MB.
          </span>
        </div>
      </form>

      {isUploading || progress > 0 ? (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.12em] text-zinc-500">
            <span>Upload progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>
      ) : null}

      {success ? <p className="mt-3 text-sm text-emerald-700">{success}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}

function shouldUseResumableUpload(file: File) {
  return file.type.startsWith("video/") || file.size > TUS_CHUNK_SIZE;
}

function buildStoragePath(projectId: string, originalName: string, mimeType: string) {
  const extension = originalName.includes(".") ? originalName.split(".").pop() : "";
  const safeBase = originalName
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 48);
  const fileGroup = mimeType.startsWith("video/") ? "videos" : mimeType.startsWith("image/") ? "images" : "files";
  return `${projectId}/${fileGroup}/${crypto.randomUUID()}-${safeBase || "asset"}${extension ? `.${extension.toLowerCase()}` : ""}`;
}

function getDirectStorageEndpoint() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  const url = new URL(supabaseUrl);
  const projectRef = url.hostname.split(".")[0];
  return `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`;
}

async function uploadWithTus({
  file,
  storagePath,
  accessToken,
  anonKey,
  onProgress,
}: {
  file: File;
  storagePath: string;
  accessToken: string;
  anonKey: string;
  onProgress: (value: number) => void;
}) {
  return new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: getDirectStorageEndpoint(),
      retryDelays: RETRY_DELAYS,
      headers: {
        authorization: `Bearer ${accessToken}`,
        apikey: anonKey,
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: TUS_CHUNK_SIZE,
      metadata: {
        bucketName: "project-files",
        objectName: storagePath,
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
      },
      onError: reject,
      onProgress(bytesUploaded, bytesTotal) {
        onProgress(Number(((bytesUploaded / bytesTotal) * 100).toFixed(2)));
      },
      onSuccess() {
        onProgress(100);
        resolve();
      },
    });

    void upload.findPreviousUploads().then((previousUploads) => {
      if (previousUploads.length > 0) {
        upload.resumeFromPreviousUpload(previousUploads[0]);
      }
      upload.start();
    }).catch(reject);
  });
}

async function extractVideoMetadata(file: File) {
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "metadata";
  video.src = objectUrl;
  video.muted = true;
  video.playsInline = true;

  try {
    await waitForEvent(video, "loadeddata");
    const durationSeconds = Number.isFinite(video.duration) ? Number(video.duration.toFixed(2)) : null;
    const posterBlob = await generatePosterBlob(video);
    return { durationSeconds, posterBlob };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function waitForEvent(target: HTMLVideoElement, eventName: keyof HTMLMediaElementEventMap) {
  return new Promise<void>((resolve, reject) => {
    const onLoaded = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("Unable to read video metadata."));
    };
    const cleanup = () => {
      target.removeEventListener(eventName, onLoaded);
      target.removeEventListener("error", onError);
    };

    target.addEventListener(eventName, onLoaded, { once: true });
    target.addEventListener("error", onError, { once: true });
  });
}

async function generatePosterBlob(video: HTMLVideoElement) {
  if (!video.videoWidth || !video.videoHeight) return null;
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/webp", 0.82);
  });
}

async function cleanupPartialUpload({
  supabase,
  storagePath,
  previewImagePath,
}: {
  supabase: ReturnType<typeof createClient>;
  storagePath: string;
  previewImagePath: string | null;
}) {
  const paths = [storagePath];
  if (previewImagePath) paths.push(previewImagePath);
  try {
    await supabase.storage.from("project-files").remove(paths);
  } catch {
    // Best-effort cleanup only.
  }
}
