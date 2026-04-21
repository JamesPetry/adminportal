"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useClientActionsStore } from "@/lib/store/client-actions-store";
import type { ClientActionItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ClientActionsBoard({ items }: { items: ClientActionItem[] }) {
  const { completedIds, toggleComplete } = useClientActionsStore();

  const pending = items.filter((item) => !completedIds.includes(item.id));

  return (
    <div className="space-y-4">
      {!items.length ? (
        <EmptyState
          icon={CheckCircle2}
          title="No pending client actions"
          description="Approvals and required client inputs will appear here when needed."
        />
      ) : null}
      {pending.map((item) => (
        <Card key={item.id} className="border-slate-200 bg-white shadow-sm">
          <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={item.category} />
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Due {item.dueDate}</p>
              </div>
              <p className="text-base font-medium text-slate-900">{item.title}</p>
              {item.blocker ? (
                <p className="mt-2 inline-flex items-start gap-1 text-sm text-amber-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {item.blocker}
                </p>
              ) : null}
            </div>
            <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => toggleComplete(item.id)}>
              <CheckCircle2 className="h-4 w-4" />
              Mark complete
            </Button>
          </CardContent>
        </Card>
      ))}

      <Card
        className={cn(
          "border-slate-200 bg-white shadow-sm",
          pending.length === 0 && "border-emerald-200 bg-emerald-50/70",
        )}
      >
        <CardContent className="p-5">
          {pending.length === 0 ? (
            <p className="text-sm text-emerald-800">All action items are complete. Great momentum for final handoff.</p>
          ) : (
            <p className="text-sm text-slate-600">
              {pending.length} client actions remain. Completing these keeps Week 4 delivery on schedule.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
