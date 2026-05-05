import type { NextConfig } from "next";
import path from "node:path";

/** Allow `next/image` for Supabase Storage signed URLs (same host as `NEXT_PUBLIC_SUPABASE_URL`). */
function supabaseStorageRemotePattern(): {
  protocol: "https";
  hostname: string;
  pathname: string;
} | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    return {
      protocol: "https",
      hostname: url.hostname,
      pathname: "/storage/v1/**",
    };
  } catch {
    return null;
  }
}

const supabasePattern = supabaseStorageRemotePattern();

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  poweredByHeader: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  images: {
    remotePatterns: supabasePattern ? [supabasePattern] : [],
  },
};

export default nextConfig;
