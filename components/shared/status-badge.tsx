import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  "In Progress": "bg-sky-100/80 text-sky-900 border-sky-200/70",
  Complete: "bg-emerald-100/70 text-emerald-900 border-emerald-200/70",
  "Under Review": "bg-amber-100/70 text-amber-900 border-amber-200/70",
  "Not Started": "bg-zinc-100 text-zinc-700 border-zinc-200/80",
  Draft: "bg-zinc-100 text-zinc-700 border-zinc-200/80",
  "Ready for Review": "bg-sky-100/80 text-sky-900 border-sky-200/70",
  Approved: "bg-emerald-100/70 text-emerald-900 border-emerald-200/70",
  "Needs Feedback": "bg-rose-100/70 text-rose-900 border-rose-200/70",
  Paid: "bg-emerald-100/70 text-emerald-900 border-emerald-200/70",
  Pending: "bg-blue-100/70 text-blue-900 border-blue-200/70",
  Overdue: "bg-rose-100/70 text-rose-900 border-rose-200/70",
  Upcoming: "bg-zinc-100 text-zinc-700 border-zinc-200/80",
  Open: "bg-rose-100/70 text-rose-900 border-rose-200/70",
  "In Review": "bg-amber-100/70 text-amber-900 border-amber-200/70",
  Implemented: "bg-emerald-100/70 text-emerald-900 border-emerald-200/70",
  Closed: "bg-zinc-100 text-zinc-700 border-zinc-200/80",
  Approval: "bg-blue-100/70 text-blue-900 border-blue-200/70",
  "Content Needed": "bg-violet-100/70 text-violet-900 border-violet-200/70",
  "Decision Needed": "bg-amber-100/70 text-amber-900 border-amber-200/70",
  Finance: "bg-emerald-100/70 text-emerald-900 border-emerald-200/70",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border px-2.5 py-1 text-[11px] tracking-wide uppercase font-medium",
        statusStyles[status] ?? "bg-slate-100 text-slate-700 border-slate-200",
        className,
      )}
    >
      {status}
    </Badge>
  );
}
