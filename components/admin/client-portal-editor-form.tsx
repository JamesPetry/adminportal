"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DesignConcept, ProjectOverview, WeekTimeline } from "@/lib/types";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  overview: ProjectOverview;
  includedRevisions: number;
  timeline: WeekTimeline[];
  designs: DesignConcept[];
  invoices: unknown[];
  feedbackJson: string;
  filesJson: string;
  projectDetailsJson: string;
  clientActionsJson: string;
};

const projectStatuses: ProjectOverview["projectStatus"][] = [
  "Not Started",
  "In Progress",
  "Under Review",
  "Complete",
];

const timelineStatuses: WeekTimeline["status"][] = ["Not Started", "In Progress", "Under Review", "Complete"];
const designStatuses: DesignConcept["status"][] = ["Draft", "Ready for Review", "Approved", "Needs Feedback"];
const versions: DesignConcept["version"][] = ["V1", "V2", "V3"];
function createTimelineItem(): WeekTimeline {
  return {
    id: crypto.randomUUID(),
    weekLabel: "",
    title: "",
    status: "Not Started",
    progress: 0,
    dateRange: "",
    checklist: [],
    notes: "",
    details: "",
    linkedAssets: [],
    imagePath: "",
  };
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }
  return [];
}

function createDesignItem(): DesignConcept {
  return {
    id: crypto.randomUUID(),
    title: "",
    version: "V1",
    status: "Draft",
    shortDescription: "",
    thumbnailLabel: "",
    heroImagePath: "",
    details: {
      heroNotes: "",
      layoutRationale: "",
      typographyRationale: "",
      colorNotes: "",
      uxNotes: "",
      mobileConsiderations: "",
      fitReason: "",
    },
  };
}

export function ClientPortalEditorForm({
  action,
  overview,
  includedRevisions,
  timeline,
  designs,
  invoices: _invoices,
  feedbackJson,
  filesJson,
  projectDetailsJson,
  clientActionsJson,
}: Props) {
  void _invoices;
  const sanitizedTimeline = useMemo(
    () =>
      timeline.map((week) => ({
        ...week,
        checklist: normalizeStringArray(week.checklist),
        linkedAssets: normalizeStringArray(week.linkedAssets),
      })),
    [timeline],
  );
  const [timelineItems, setTimelineItems] = useState<WeekTimeline[]>(
    sanitizedTimeline.length ? sanitizedTimeline : [createTimelineItem()],
  );
  const [designItems, setDesignItems] = useState<DesignConcept[]>(designs.length ? designs : [createDesignItem()]);

  const timelineJson = useMemo(() => JSON.stringify(timelineItems), [timelineItems]);
  const designsJson = useMemo(() => JSON.stringify(designItems), [designItems]);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="timelineJson" value={timelineJson} />
      <input type="hidden" name="designsJson" value={designsJson} />
      <input type="hidden" name="invoicesJson" value="[]" />

      <section className="editorial-shell p-5">
        <h2 className="text-base font-semibold text-zinc-900">Overview</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Project Name" name="projectName" defaultValue={overview.projectName} />
          <SelectField
            label="Project Status"
            name="projectStatus"
            options={projectStatuses}
            defaultValue={overview.projectStatus}
          />
          <Field label="Completion %" name="completionPercent" defaultValue={String(overview.completionPercent)} />
          <Field
            label="Estimated Completion Date"
            name="estimatedCompletionDate"
            defaultValue={overview.estimatedCompletionDate}
          />
          <Field label="Last Updated" name="lastUpdated" defaultValue={overview.lastUpdated} />
          <Field label="Included Revisions" name="includedRevisions" defaultValue={String(includedRevisions)} />
          <div className="md:col-span-2">
            <Label htmlFor="weeklySummary">Weekly Summary</Label>
            <Textarea id="weeklySummary" name="weeklySummary" rows={4} defaultValue={overview.weeklySummary} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="nextActionRequired">Next Action Required</Label>
            <Textarea id="nextActionRequired" name="nextActionRequired" rows={3} defaultValue={overview.nextActionRequired} />
          </div>
        </div>
      </section>

      <section className="editorial-shell p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900">Timeline Editor</h2>
          <Button type="button" variant="outline" className="border-zinc-200" onClick={() => setTimelineItems((prev) => [...prev, createTimelineItem()])}>
            <Plus className="h-4 w-4" />
            Add week
          </Button>
        </div>
        <div className="space-y-4">
          {timelineItems.map((week, index) => (
            <div key={week.id || index} className="rounded-xl border border-zinc-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-900">Week {index + 1}</p>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-zinc-500 hover:text-rose-600"
                  onClick={() => setTimelineItems((prev) => prev.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <InlineInput value={week.weekLabel} onChange={(value) => updateTimeline(setTimelineItems, index, { weekLabel: value })} placeholder="Week label" />
                <InlineInput value={week.title} onChange={(value) => updateTimeline(setTimelineItems, index, { title: value })} placeholder="Title" />
                <InlineInput value={week.dateRange} onChange={(value) => updateTimeline(setTimelineItems, index, { dateRange: value })} placeholder="Date range" />
                <InlineSelect value={week.status} options={timelineStatuses} onChange={(value) => updateTimeline(setTimelineItems, index, { status: value as WeekTimeline["status"] })} />
                <InlineInput
                  value={String(week.progress)}
                  onChange={(value) => updateTimeline(setTimelineItems, index, { progress: Number(value || 0) })}
                  placeholder="Progress %"
                />
                <InlineInput
                  value={week.imagePath ?? ""}
                  onChange={(value) => updateTimeline(setTimelineItems, index, { imagePath: value })}
                  placeholder="Image storage path (optional)"
                />
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Textarea
                  rows={4}
                  value={week.notes}
                  onChange={(event) => updateTimeline(setTimelineItems, index, { notes: event.target.value })}
                  placeholder="Notes summary"
                />
                <Textarea
                  rows={4}
                  value={week.details}
                  onChange={(event) => updateTimeline(setTimelineItems, index, { details: event.target.value })}
                  placeholder="Expanded details"
                />
                <Textarea
                  rows={4}
                  value={normalizeStringArray(week.checklist).join("\n")}
                  onChange={(event) =>
                    updateTimeline(setTimelineItems, index, { checklist: toLines(event.target.value) })
                  }
                  placeholder="Checklist items (one per line)"
                />
                <Textarea
                  rows={4}
                  value={normalizeStringArray(week.linkedAssets).join("\n")}
                  onChange={(event) =>
                    updateTimeline(setTimelineItems, index, { linkedAssets: toLines(event.target.value) })
                  }
                  placeholder="Linked assets (one per line)"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="editorial-shell p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900">Design Concepts Editor</h2>
          <Button type="button" variant="outline" className="border-zinc-200" onClick={() => setDesignItems((prev) => [...prev, createDesignItem()])}>
            <Plus className="h-4 w-4" />
            Add concept
          </Button>
        </div>
        <div className="space-y-4">
          {designItems.map((concept, index) => (
            <div key={concept.id || index} className="rounded-xl border border-zinc-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-900">Concept {index + 1}</p>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-zinc-500 hover:text-rose-600"
                  onClick={() => setDesignItems((prev) => prev.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <InlineInput value={concept.id} onChange={(value) => updateDesign(setDesignItems, index, { id: value })} placeholder="ID (slug)" />
                <InlineSelect value={concept.version} options={versions} onChange={(value) => updateDesign(setDesignItems, index, { version: value as DesignConcept["version"] })} />
                <InlineSelect value={concept.status} options={designStatuses} onChange={(value) => updateDesign(setDesignItems, index, { status: value as DesignConcept["status"] })} />
                <InlineInput value={concept.title} onChange={(value) => updateDesign(setDesignItems, index, { title: value })} placeholder="Concept title" />
                <InlineInput
                  value={concept.thumbnailLabel}
                  onChange={(value) => updateDesign(setDesignItems, index, { thumbnailLabel: value })}
                  placeholder="Thumbnail label"
                />
                <InlineInput
                  value={concept.heroImagePath ?? ""}
                  onChange={(value) => updateDesign(setDesignItems, index, { heroImagePath: value })}
                  placeholder="Hero image storage path (optional)"
                />
              </div>
              <div className="mt-3 space-y-3">
                <Textarea
                  rows={3}
                  value={concept.shortDescription}
                  onChange={(event) => updateDesign(setDesignItems, index, { shortDescription: event.target.value })}
                  placeholder="Short description"
                />
                <Textarea
                  rows={2}
                  value={concept.details.heroNotes}
                  onChange={(event) => updateDesignDetail(setDesignItems, index, "heroNotes", event.target.value)}
                  placeholder="Hero notes"
                />
                <Textarea
                  rows={2}
                  value={concept.details.layoutRationale}
                  onChange={(event) => updateDesignDetail(setDesignItems, index, "layoutRationale", event.target.value)}
                  placeholder="Layout rationale"
                />
                <Textarea
                  rows={2}
                  value={concept.details.typographyRationale}
                  onChange={(event) =>
                    updateDesignDetail(setDesignItems, index, "typographyRationale", event.target.value)
                  }
                  placeholder="Typography rationale"
                />
                <Textarea
                  rows={2}
                  value={concept.details.colorNotes}
                  onChange={(event) => updateDesignDetail(setDesignItems, index, "colorNotes", event.target.value)}
                  placeholder="Color notes"
                />
                <Textarea
                  rows={2}
                  value={concept.details.uxNotes}
                  onChange={(event) => updateDesignDetail(setDesignItems, index, "uxNotes", event.target.value)}
                  placeholder="UX notes"
                />
                <Textarea
                  rows={2}
                  value={concept.details.mobileConsiderations}
                  onChange={(event) =>
                    updateDesignDetail(setDesignItems, index, "mobileConsiderations", event.target.value)
                  }
                  placeholder="Mobile considerations"
                />
                <Textarea
                  rows={2}
                  value={concept.details.fitReason}
                  onChange={(event) => updateDesignDetail(setDesignItems, index, "fitReason", event.target.value)}
                  placeholder="Why this fits the client"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="editorial-shell p-5">
        <h2 className="text-base font-semibold text-zinc-900">Advanced JSON (Optional)</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Keep using JSON for remaining sections until those editors are added.
        </p>
        <div className="mt-3 space-y-3">
          <JsonField label="Feedback JSON" name="feedbackJson" defaultValue={feedbackJson} />
          <JsonField label="Files JSON" name="filesJson" defaultValue={filesJson} />
          <JsonField label="Project Details JSON" name="projectDetailsJson" defaultValue={projectDetailsJson} />
          <JsonField label="Client Actions JSON" name="clientActionsJson" defaultValue={clientActionsJson} />
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" className="bg-zinc-900 text-white hover:bg-zinc-800">
          Save portal content
        </Button>
      </div>
    </form>
  );
}

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue} />
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: readonly string[];
  defaultValue: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="flex h-8 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function JsonField({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} rows={8} className="mt-1 font-mono text-xs" defaultValue={defaultValue} />
    </div>
  );
}

function InlineInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />;
}

function InlineSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="flex h-8 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function updateTimeline(
  setState: Dispatch<SetStateAction<WeekTimeline[]>>,
  index: number,
  patch: Partial<WeekTimeline>,
) {
  setState((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
}

function updateDesign(
  setState: Dispatch<SetStateAction<DesignConcept[]>>,
  index: number,
  patch: Partial<DesignConcept>,
) {
  setState((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
}

function updateDesignDetail(
  setState: Dispatch<SetStateAction<DesignConcept[]>>,
  index: number,
  key: keyof DesignConcept["details"],
  value: string,
) {
  setState((prev) =>
    prev.map((item, i) =>
      i === index
        ? {
            ...item,
            details: {
              ...item.details,
              [key]: value,
            },
          }
        : item,
    ),
  );
}

function toLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
