import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  "In Progress": "bg-blue-50 text-blue-700 border-blue-200",
  Complete: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Under Review": "bg-amber-50 text-amber-700 border-amber-200",
  "Not Started": "bg-slate-100 text-slate-600 border-slate-200",
  Draft: "bg-slate-100 text-slate-700 border-slate-200",
  "Ready for Review": "bg-blue-50 text-blue-700 border-blue-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Needs Feedback": "bg-rose-50 text-rose-700 border-rose-200",
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Pending: "bg-blue-50 text-blue-700 border-blue-200",
  Overdue: "bg-rose-50 text-rose-700 border-rose-200",
  Upcoming: "bg-slate-100 text-slate-700 border-slate-200",
  Open: "bg-rose-50 text-rose-700 border-rose-200",
  "In Review": "bg-amber-50 text-amber-700 border-amber-200",
  Implemented: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Closed: "bg-slate-100 text-slate-700 border-slate-200",
  Approval: "bg-blue-50 text-blue-700 border-blue-200",
  "Content Needed": "bg-violet-50 text-violet-700 border-violet-200",
  "Decision Needed": "bg-amber-50 text-amber-700 border-amber-200",
  Finance: "bg-emerald-50 text-emerald-700 border-emerald-200",
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
