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
    <div className="grid gap-6 lg:grid-cols-12">
      <Card className="editorial-shell border-zinc-300/80 bg-white shadow-none lg:col-span-8">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <p className="editorial-kicker">Conversation Stream</p>
            <CardTitle className="mt-2 font-heading text-5xl font-medium tracking-tight text-zinc-900">Feedback Thread</CardTitle>
          </div>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <Button
                key={option}
                variant={selected === option ? "default" : "outline"}
                size="sm"
                className={selected === option ? "bg-zinc-900 text-white hover:bg-zinc-800" : "border-zinc-200 bg-white"}
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
              <div key={item.id} className="rounded-[1.1rem] border border-zinc-400/15 bg-zinc-50/45 p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm">
                    <span className="font-medium text-zinc-900">{item.author}</span>
                    <span className="mx-2 text-zinc-300">•</span>
                    <span className="text-zinc-500">{item.role}</span>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-sm text-zinc-500">
                  Tagged to <span className="text-zinc-700">{item.pageTag}</span> /{" "}
                  <span className="text-zinc-700">{item.conceptTag}</span>
                </p>
                <p className="mt-3 text-sm leading-7 text-zinc-700">{item.comment}</p>
                <p className="mt-3 text-xs text-zinc-400">{item.createdAt}</p>
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

      <Card className="editorial-shell border-zinc-300/80 bg-[#f5f4ef] shadow-none lg:col-span-4">
        <CardHeader>
          <p className="editorial-kicker">Revision Intake</p>
          <CardTitle className="mt-2 font-heading text-5xl font-medium tracking-tight text-zinc-900">Request Revision</CardTitle>
          <p className="text-sm leading-7 text-zinc-600">
            {includedRevisions} structured revision rounds are included. Additional revisions can be scoped separately.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Input placeholder="Page or concept tag (e.g. Homepage Hero)" />
          <Input placeholder="Priority (High / Medium / Low)" />
          <Textarea
            rows={6}
            placeholder="Describe the requested revision clearly so we can implement it accurately."
          />
          <Button className="mt-2 bg-zinc-900 text-white hover:bg-zinc-800">Submit revision request</Button>
        </CardContent>
      </Card>
    </div>
  );
}
