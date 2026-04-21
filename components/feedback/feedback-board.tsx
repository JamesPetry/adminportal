"use client";

import { useMemo, useState } from "react";
import { MessageSquareOff } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FeedbackItem } from "@/lib/types";

const filterOptions = ["All", "Open", "In Review", "Implemented", "Closed"] as const;

export function FeedbackBoard({ items, includedRevisions }: { items: FeedbackItem[]; includedRevisions: number }) {
  const [selected, setSelected] = useState<(typeof filterOptions)[number]>("All");

  const filteredItems = useMemo(
    () => (selected === "All" ? items : items.filter((item) => item.status === selected)),
    [items, selected],
  );

  return (
    <div className="space-y-5">
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold tracking-tight text-slate-900">Feedback Thread</CardTitle>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <Button
                key={option}
                variant={selected === option ? "default" : "outline"}
                size="sm"
                className={selected === option ? "bg-blue-600 text-white hover:bg-blue-700" : "border-slate-200"}
                onClick={() => setSelected(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredItems.length ? (
            filteredItems.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm">
                    <span className="font-medium text-slate-900">{item.author}</span>
                    <span className="mx-2 text-slate-300">•</span>
                    <span className="text-slate-500">{item.role}</span>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-sm text-slate-500">
                  Tagged to <span className="text-slate-700">{item.pageTag}</span> /{" "}
                  <span className="text-slate-700">{item.conceptTag}</span>
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-700">{item.comment}</p>
                <p className="mt-3 text-xs text-slate-400">{item.createdAt}</p>
              </div>
            ))
          ) : (
            <EmptyState
              icon={MessageSquareOff}
              title="No feedback matches this filter"
              description="Try switching status filters to view all comments and revision notes."
            />
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold tracking-tight text-slate-900">Revision Request</CardTitle>
          <p className="text-sm text-slate-500">
            {includedRevisions} structured revision rounds are included. Additional revisions can be scoped separately.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Page or concept tag (e.g. Homepage Hero)" />
          <Input placeholder="Priority (High / Medium / Low)" />
          <div className="sm:col-span-2">
            <Textarea
              rows={5}
              placeholder="Describe the requested revision clearly so we can implement it accurately."
            />
          </div>
          <div className="sm:col-span-2">
            <Button className="bg-blue-600 text-white hover:bg-blue-700">Submit revision request</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
