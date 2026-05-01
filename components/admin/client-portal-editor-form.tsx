"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DesignConcept, PortalFile, ProjectDetails, ProjectOverview, WeekTimeline } from "@/lib/types";

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
const weekColors: NonNullable<WeekTimeline["weekColor"]>[] = ["sand", "rose", "mint", "sky", "lavender"];
const legacyFileCategories: PortalFile["category"][] = [
  "Brand Assets",
  "Wireframes",
  "Design Exports",
  "Content Docs",
  "Final Deliverables",
];
function createTimelineItem(): WeekTimeline {
  return {
    id: crypto.randomUUID(),
    weekLabel: "",
    title: "",
    status: "Not Started",
    progress: 0,
    dateRange: "",
    startDate: null,
    endDate: null,
    weekColor: "sand",
    checklist: [{ id: crypto.randomUUID(), label: "", completed: false }],
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

function normalizeChecklist(
  value: unknown,
): Array<{ id: string; label: string; completed: boolean }> {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") {
        return { id: crypto.randomUUID(), label: item, completed: false };
      }
      if (item && typeof item === "object") {
        const row = item as { id?: unknown; label?: unknown; completed?: unknown };
        return {
          id: typeof row.id === "string" && row.id ? row.id : crypto.randomUUID(),
          label: String(row.label ?? "").trim(),
          completed: Boolean(row.completed),
        };
      }
      return null;
    })
    .filter((item): item is { id: string; label: string; completed: boolean } => Boolean(item?.label));
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

function createProjectContact(): ProjectDetails["keyContacts"][number] {
  return { name: "", role: "", email: "" };
}

function createLegacyFileItem(): PortalFile {
  return {
    id: crypto.randomUUID(),
    fileName: "",
    category: "Final Deliverables",
    uploadedAt: new Date().toISOString().slice(0, 10),
    fileType: "",
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
  const parsedProjectDetails = useMemo<ProjectDetails>(() => {
    try {
      return JSON.parse(projectDetailsJson) as ProjectDetails;
    } catch {
      return {
        scopeSummary: "",
        includedItems: [],
        redesignGoals: [],
        keyContacts: [],
        stagingUrl: "",
        proposalSections: [],
        faq: [],
      };
    }
  }, [projectDetailsJson]);
  const parsedLegacyFiles = useMemo<PortalFile[]>(() => {
    try {
      const rows = JSON.parse(filesJson) as PortalFile[];
      return Array.isArray(rows) ? rows : [];
    } catch {
      return [];
    }
  }, [filesJson]);
  const sanitizedTimeline = useMemo(
    () =>
      timeline.map((week, index) => ({
        ...week,
        weekColor: week.weekColor ?? weekColors[index % weekColors.length],
        checklist: normalizeChecklist(week.checklist),
        linkedAssets: normalizeStringArray(week.linkedAssets),
        startDate: week.startDate ?? extractDateRange(week.dateRange).startDate,
        endDate: week.endDate ?? extractDateRange(week.dateRange).endDate,
      })),
    [timeline],
  );
  const [timelineItems, setTimelineItems] = useState<WeekTimeline[]>(
    sanitizedTimeline.length ? sanitizedTimeline : [createTimelineItem()],
  );
  const [designItems, setDesignItems] = useState<DesignConcept[]>(designs.length ? designs : [createDesignItem()]);
  const [scopeSummary, setScopeSummary] = useState(parsedProjectDetails.scopeSummary ?? "");
  const [includedItems, setIncludedItems] = useState<string[]>(parsedProjectDetails.includedItems ?? []);
  const [redesignGoals, setRedesignGoals] = useState<string[]>(parsedProjectDetails.redesignGoals ?? []);
  const [keyContacts, setKeyContacts] = useState<ProjectDetails["keyContacts"]>(parsedProjectDetails.keyContacts ?? []);
  const [legacyFiles, setLegacyFiles] = useState<PortalFile[]>(parsedLegacyFiles.length ? parsedLegacyFiles : []);

  const timelineJson = useMemo(() => JSON.stringify(timelineItems), [timelineItems]);
  const designsJson = useMemo(() => JSON.stringify(designItems), [designItems]);
  const nextProjectDetailsJson = useMemo(
    () =>
      JSON.stringify({
        ...parsedProjectDetails,
        scopeSummary,
        includedItems: includedItems.map((item) => item.trim()).filter(Boolean),
        redesignGoals: redesignGoals.map((item) => item.trim()).filter(Boolean),
        keyContacts: keyContacts
          .map((contact) => ({
            name: contact.name.trim(),
            role: contact.role.trim(),
            email: contact.email.trim(),
          }))
          .filter((contact) => contact.name || contact.role || contact.email),
      } satisfies ProjectDetails),
    [includedItems, keyContacts, parsedProjectDetails, redesignGoals, scopeSummary],
  );
  const nextFilesJson = useMemo(
    () =>
      JSON.stringify(
        legacyFiles
          .map((item) => ({
            ...item,
            fileName: item.fileName.trim(),
            fileType: item.fileType.trim(),
            uploadedAt: item.uploadedAt.trim(),
          }))
          .filter((item) => item.fileName),
      ),
    [legacyFiles],
  );
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="timelineJson" value={timelineJson} />
      <input type="hidden" name="designsJson" value={designsJson} />
      <input type="hidden" name="invoicesJson" value="[]" />
      <input type="hidden" name="projectDetailsJson" value={nextProjectDetailsJson} />
      <input type="hidden" name="filesJson" value={nextFilesJson} />

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
                <InlineSelect
                  value={week.weekColor ?? weekColors[0]}
                  options={weekColors}
                  onChange={(value) => updateTimeline(setTimelineItems, index, { weekColor: value as WeekTimeline["weekColor"] })}
                />
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
                <DateInput
                  label="Start date"
                  value={week.startDate ?? ""}
                  onChange={(value) => {
                    const nextRange = buildDateRangeLabel(value, week.endDate ?? null);
                    updateTimeline(setTimelineItems, index, {
                      startDate: value || null,
                      dateRange: nextRange || week.dateRange,
                    });
                  }}
                />
                <DateInput
                  label="End date"
                  value={week.endDate ?? ""}
                  onChange={(value) => {
                    const nextRange = buildDateRangeLabel(week.startDate ?? null, value);
                    updateTimeline(setTimelineItems, index, {
                      endDate: value || null,
                      dateRange: nextRange || week.dateRange,
                    });
                  }}
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
                <div className="rounded-md border border-zinc-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Deliverables</p>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-7 border-zinc-200 px-2 text-xs"
                      onClick={() =>
                        updateTimeline(setTimelineItems, index, {
                          checklist: [...(week.checklist ?? []), { id: crypto.randomUUID(), label: "", completed: false }],
                        })
                      }
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(week.checklist ?? []).map((item, itemIndex) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={(event) =>
                            updateTimeline(setTimelineItems, index, {
                              checklist: (week.checklist ?? []).map((row, idx) =>
                                idx === itemIndex ? { ...row, completed: event.target.checked } : row,
                              ),
                            })
                          }
                        />
                        <Input
                          value={item.label}
                          onChange={(event) =>
                            updateTimeline(setTimelineItems, index, {
                              checklist: (week.checklist ?? []).map((row, idx) =>
                                idx === itemIndex ? { ...row, label: event.target.value } : row,
                              ),
                            })
                          }
                          placeholder={`Deliverable ${itemIndex + 1}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-8 px-2 text-zinc-500 hover:text-rose-600"
                          onClick={() =>
                            updateTimeline(setTimelineItems, index, {
                              checklist: (week.checklist ?? []).filter((_, idx) => idx !== itemIndex),
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {!(week.checklist ?? []).length ? <p className="text-xs text-zinc-500">No deliverables yet.</p> : null}
                  </div>
                </div>
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
        <section className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">Project Proposal Editor</h3>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="proposalScopeSummary">Scope of work summary</Label>
              <Textarea
                id="proposalScopeSummary"
                rows={4}
                value={scopeSummary}
                onChange={(event) => setScopeSummary(event.target.value)}
                placeholder="Outline the scope of work for this project."
              />
            </div>
            <LineListEditor
              title="Primary scope items"
              placeholder="Add included item"
              values={includedItems}
              onChange={setIncludedItems}
            />
            <LineListEditor
              title="Primary goals"
              placeholder="Add primary goal"
              values={redesignGoals}
              onChange={setRedesignGoals}
            />
            <div className="rounded-md border border-zinc-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Key contacts</p>
                <Button type="button" variant="outline" className="h-7 border-zinc-200 px-2 text-xs" onClick={() => setKeyContacts((prev) => [...prev, createProjectContact()])}>
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {keyContacts.map((contact, index) => (
                  <div key={`contact-${index}`} className="grid gap-2 md:grid-cols-[1fr_1fr_1.2fr_auto]">
                    <Input
                      value={contact.name}
                      placeholder="Name"
                      onChange={(event) =>
                        setKeyContacts((prev) =>
                          prev.map((row, idx) => (idx === index ? { ...row, name: event.target.value } : row)),
                        )
                      }
                    />
                    <Input
                      value={contact.role}
                      placeholder="Role"
                      onChange={(event) =>
                        setKeyContacts((prev) =>
                          prev.map((row, idx) => (idx === index ? { ...row, role: event.target.value } : row)),
                        )
                      }
                    />
                    <Input
                      value={contact.email}
                      placeholder="Email"
                      onChange={(event) =>
                        setKeyContacts((prev) =>
                          prev.map((row, idx) => (idx === index ? { ...row, email: event.target.value } : row)),
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-9 px-2 text-zinc-500 hover:text-rose-600"
                      onClick={() => setKeyContacts((prev) => prev.filter((_, idx) => idx !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {!keyContacts.length ? <p className="text-xs text-zinc-500">No contacts added yet.</p> : null}
              </div>
            </div>
          </div>
        </section>
        <section className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">Legacy Deliverables Metadata</h3>
            <Button type="button" variant="outline" className="h-8 border-zinc-200 text-xs" onClick={() => setLegacyFiles((prev) => [...prev, createLegacyFileItem()])}>
              <Plus className="h-4 w-4" />
              Add file row
            </Button>
          </div>
          <div className="space-y-2">
            {legacyFiles.map((item, index) => (
              <div key={item.id || index} className="grid gap-2 rounded-md border border-zinc-200 bg-white p-3 md:grid-cols-[1.3fr_1fr_0.8fr_0.8fr_auto]">
                <Input
                  value={item.fileName}
                  placeholder="File name"
                  onChange={(event) =>
                    setLegacyFiles((prev) =>
                      prev.map((row, idx) => (idx === index ? { ...row, fileName: event.target.value } : row)),
                    )
                  }
                />
                <select
                  value={item.category}
                  onChange={(event) =>
                    setLegacyFiles((prev) =>
                      prev.map((row, idx) =>
                        idx === index ? { ...row, category: event.target.value as PortalFile["category"] } : row,
                      ),
                    )
                  }
                  className="flex h-8 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                >
                  {legacyFileCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <Input
                  value={item.fileType}
                  placeholder="Type (pdf/png)"
                  onChange={(event) =>
                    setLegacyFiles((prev) =>
                      prev.map((row, idx) => (idx === index ? { ...row, fileType: event.target.value } : row)),
                    )
                  }
                />
                <Input
                  value={item.uploadedAt}
                  placeholder="Uploaded at"
                  onChange={(event) =>
                    setLegacyFiles((prev) =>
                      prev.map((row, idx) => (idx === index ? { ...row, uploadedAt: event.target.value } : row)),
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 px-2 text-zinc-500 hover:text-rose-600"
                  onClick={() => setLegacyFiles((prev) => prev.filter((_, idx) => idx !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {!legacyFiles.length ? <p className="text-xs text-zinc-500">No legacy metadata rows.</p> : null}
          </div>
        </section>
        <div className="mt-3 space-y-3">
          <JsonField label="Feedback JSON" name="feedbackJson" defaultValue={feedbackJson} />
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

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input type="date" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
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

function buildDateRangeLabel(startDate?: string | null, endDate?: string | null) {
  if (startDate && endDate) return `${startDate} → ${endDate}`;
  if (startDate) return startDate;
  return "";
}

function toLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function LineListEditor({
  title,
  placeholder,
  values,
  onChange,
}: {
  title: string;
  placeholder: string;
  values: string[];
  onChange: Dispatch<SetStateAction<string[]>>;
}) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">{title}</p>
        <Button type="button" variant="outline" className="h-7 border-zinc-200 px-2 text-xs" onClick={() => onChange((prev) => [...prev, ""])}>
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>
      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={`${title}-${index}`} className="flex items-center gap-2">
            <Input
              value={value}
              placeholder={placeholder}
              onChange={(event) =>
                onChange((prev) => prev.map((row, idx) => (idx === index ? event.target.value : row)))
              }
            />
            <Button
              type="button"
              variant="ghost"
              className="h-8 px-2 text-zinc-500 hover:text-rose-600"
              onClick={() => onChange((prev) => prev.filter((_, idx) => idx !== index))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {!values.length ? <p className="text-xs text-zinc-500">No items yet.</p> : null}
      </div>
    </div>
  );
}

function extractDateRange(dateRange: string) {
  const matches = dateRange.match(/\b\d{4}-\d{2}-\d{2}\b/g) ?? [];
  return {
    startDate: matches[0] ?? null,
    endDate: matches[1] ?? null,
  };
}
