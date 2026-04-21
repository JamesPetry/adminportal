import { CalendarClock, CircleUserRound } from "lucide-react";

import { signOut } from "@/app/auth-actions";
import { StatusBadge } from "@/components/shared/status-badge";

export function PortalHeader({
  title,
  viewerName,
  clientName,
  projectStatus,
  lastUpdated,
}: {
  title: string;
  viewerName: string;
  clientName: string;
  projectStatus: string;
  lastUpdated: string;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Client workspace</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{title}</h2>
      </div>
      <div className="grid gap-3 text-sm text-slate-600 sm:text-right">
        <div className="flex items-center gap-2 sm:justify-end">
          <CircleUserRound className="h-4 w-4 text-slate-400" />
          <span>{viewerName}</span>
          <StatusBadge status={projectStatus} />
        </div>
        <div className="flex items-center gap-2 sm:justify-end">
          <CalendarClock className="h-4 w-4 text-slate-400" />
          <span>
            {clientName} · Last updated {lastUpdated}
          </span>
        </div>
        <div className="sm:text-right">
          <form action={signOut}>
            <button type="submit" className="text-sm font-medium text-slate-500 hover:text-slate-900">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
