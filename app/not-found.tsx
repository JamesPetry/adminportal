import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Not Found</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Page unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The requested portal page could not be found. Return to the dashboard to continue reviewing the project.
        </p>
        <Link
          href="/"
          className={cn(buttonVariants(), "mt-5 inline-flex bg-blue-600 text-white hover:bg-blue-700")}
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
