import { CalendarClock, CircleUserRound } from "lucide-react";

import { signOut } from "@/app/auth-actions";
import { setActiveProject } from "@/app/portal-actions";
import { StatusBadge } from "@/components/shared/status-badge";
import type { ProjectRecord } from "@/lib/types";

export function PortalHeader({
  title,
  viewerName,
  clientName,
  projectStatus,
  lastUpdated,
  projects,
  activeProjectId,
}: {
  title: string;
  viewerName: string;
  clientName: string;
  projectStatus: string;
  lastUpdated: string;
  projects: ProjectRecord[];
  activeProjectId: string;
}) {
  return (
    <header className="editorial-shell mb-8 flex flex-col gap-6 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-7">
      <div className="space-y-2">
        <p className="editorial-kicker">Client workspace</p>
        <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">{title}</h2>
      </div>
      <div className="grid gap-3 text-sm text-zinc-600 sm:text-right">
        <div className="flex items-center gap-2 sm:justify-end">
          <CircleUserRound className="h-4 w-4 text-zinc-400" />
          <span>{viewerName}</span>
          <StatusBadge status={projectStatus} />
        </div>
        <div className="flex items-center gap-2 sm:justify-end">
          <CalendarClock className="h-4 w-4 text-zinc-400" />
          <span>
            {clientName} · Last updated {lastUpdated}
          </span>
        </div>
        <form action={setActiveProject} className="sm:ml-auto">
          <div className="flex items-center gap-2 sm:justify-end">
            <select
              name="projectId"
              defaultValue={activeProjectId}
              className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-xs text-zinc-700"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <button type="submit" className="text-xs text-zinc-500 hover:text-zinc-900">
              Switch
            </button>
          </div>
        </form>
        <div className="sm:text-right">
          <form action={signOut}>
            <button type="submit" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
