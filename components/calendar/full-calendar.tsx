 "use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  FileImage,
  FileText,
  Handshake,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Save,
  StickyNote,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { createCalendarEntry, deleteCalendarEntry, updateCalendarEntry } from "@/app/(portal)/calendar-actions";
import type { CalendarEntryType, CalendarEvent, UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

const colorMap: Record<CalendarEvent["colorToken"], string> = {
  finance: "bg-rose-100 text-rose-900",
  timeline: "bg-sky-100 text-sky-900",
  approvals: "bg-violet-100 text-violet-900",
  custom: "bg-emerald-100 text-emerald-900",
};

type Props = {
  events: CalendarEvent[];
  invoices: Array<{ id: string; label: string }>;
  agreements: Array<{ id: string; label: string }>;
  projectId: string;
  viewerRole: UserRole;
  viewerUserId: string;
  year: number;
  month: number; // 0-indexed
};

const entryActions: Array<{ type: CalendarEntryType; label: string; icon: typeof StickyNote }> = [
  { type: "image", label: "Add Image", icon: FileImage },
  { type: "invoice", label: "Add Invoice", icon: FileText },
  { type: "agreement", label: "Add Agreement", icon: Handshake },
  { type: "note", label: "Add Note", icon: StickyNote },
  { type: "file", label: "Add File", icon: Upload },
];

function canCreate(role: UserRole, type: CalendarEntryType) {
  if (role === "admin") return true;
  return type === "note" || type === "file" || type === "image";
}

function isImageEvent(event: CalendarEvent) {
  if (event.entryType === "image") return true;
  const fileName = event.linkedFileName?.toLowerCase() ?? "";
  const url = event.downloadUrl?.toLowerCase() ?? "";
  return [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".avif"].some(
    (ext) => fileName.endsWith(ext) || url.includes(ext),
  );
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function eventCoversDay(event: CalendarEvent, dayKey: string) {
  if (!event.endDate) return event.date === dayKey;
  const start = parseDateKey(event.date).getTime();
  const end = parseDateKey(event.endDate).getTime();
  const target = parseDateKey(dayKey).getTime();
  return target >= Math.min(start, end) && target <= Math.max(start, end);
}

export function FullCalendar({ events, invoices, agreements, projectId, viewerRole, viewerUserId, year, month }: Props) {
  const [items, setItems] = useState(events);
  const [visibleDate, setVisibleDate] = useState(new Date(year, month, 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [entryType, setEntryType] = useState<CalendarEntryType>("note");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingNotes, setEditingNotes] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const start = useMemo(() => new Date(visibleDate.getFullYear(), visibleDate.getMonth(), 1), [visibleDate]);
  const end = useMemo(() => new Date(visibleDate.getFullYear(), visibleDate.getMonth() + 1, 0), [visibleDate]);
  const days = useMemo(
    () => Array.from({ length: end.getDate() }).map((_, idx) => new Date(start.getFullYear(), start.getMonth(), idx + 1)),
    [end, start],
  );

  const byDay = new Map<string, CalendarEvent[]>();
  for (const day of days) {
    const key = toDateKey(day);
    byDay.set(
      key,
      items.filter((event) => eventCoversDay(event, key)),
    );
  }

  const selectedDayItems = selectedDate ? byDay.get(selectedDate) ?? [] : [];
  const selectableActions = useMemo(() => entryActions.filter((action) => canCreate(viewerRole, action.type)), [viewerRole]);
  const todayKey = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const thisMonth = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
    if (!selectedDate || !selectedDate.startsWith(thisMonth)) {
      if (todayKey.startsWith(thisMonth)) {
        setSelectedDate(todayKey);
        return;
      }
      setSelectedDate(`${thisMonth}-01`);
    }
  }, [selectedDate, start, todayKey]);

  const resetForm = () => {
    setTitle("");
    setNotes("");
    setSourceId("");
    setFile(null);
    setErrorMessage(null);
  };

  const handleCreate = () => {
    if ((entryType === "invoice" || entryType === "agreement") && !sourceId) {
      setErrorMessage("Please select a linked record first.");
      return;
    }
    if ((entryType === "file" || entryType === "image") && !file) {
      setErrorMessage("Please select a file.");
      return;
    }

    if (!selectedDate) return;
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMessage("Title is required.");
      return;
    }

    const tempId = `temp-${crypto.randomUUID()}`;
    const optimisticItem: CalendarEvent = {
      id: tempId,
      title: trimmedTitle,
      date: selectedDate,
      endDate: null,
      kind: "manual",
      sourceRef: tempId,
      colorToken: entryType === "invoice" || entryType === "agreement" ? "finance" : entryType === "note" ? "approvals" : "custom",
      entryType,
      notes: notes.trim() || null,
      createdBy: "optimistic",
    };
    setItems((current) => [...current, optimisticItem]);
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const created = await createCalendarEntry({
          projectId,
          date: selectedDate,
          entryType,
          title: trimmedTitle,
          notes,
          sourceId: sourceId || undefined,
          file,
        });
        setItems((current) => current.map((event) => (event.id === tempId ? created : event)));
        resetForm();
      } catch (error) {
        setItems((current) => current.filter((event) => event.id !== tempId));
        setErrorMessage(error instanceof Error ? error.message : "Unable to save calendar entry.");
      }
    });
  };

  const handleDelete = (eventId: string) => {
    const snapshot = items;
    setItems((current) => current.filter((event) => event.id !== eventId));
    startTransition(async () => {
      try {
        await deleteCalendarEntry(projectId, eventId);
      } catch (error) {
        setItems(snapshot);
        setErrorMessage(error instanceof Error ? error.message : "Unable to delete entry.");
      }
    });
  };

  const beginEdit = (event: CalendarEvent) => {
    setEditingEntryId(event.id);
    setEditingTitle(event.title);
    setEditingNotes(event.notes ?? "");
  };

  const canEditEvent = (event: CalendarEvent) =>
    event.kind === "manual" && (viewerRole === "admin" || event.createdBy === viewerUserId || event.createdBy === "optimistic");

  const handleSaveEdit = () => {
    if (!editingEntryId) return;
    const nextTitle = editingTitle.trim();
    if (!nextTitle) {
      setErrorMessage("Title is required.");
      return;
    }

    const snapshot = items;
    setItems((current) =>
      current.map((event) =>
        event.id === editingEntryId ? { ...event, title: nextTitle, notes: editingNotes.trim() || null } : event,
      ),
    );
    setEditingEntryId(null);
    setErrorMessage(null);

    startTransition(async () => {
      try {
        await updateCalendarEntry({
          projectId,
          entryId: editingEntryId,
          title: nextTitle,
          notes: editingNotes,
        });
      } catch (error) {
        setItems(snapshot);
        setErrorMessage(error instanceof Error ? error.message : "Unable to update entry.");
      }
    });
  };

  return (
    <section className="editorial-shell border-zinc-300/80 bg-white p-6">
      <header className="mb-5">
        <div className="flex items-end justify-between gap-4">
          <h3 className="font-heading text-6xl leading-none text-zinc-900">
            {start.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500"
              onClick={() => setVisibleDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500"
              onClick={() => setVisibleDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid grid-cols-7 gap-2 rounded-[1.3rem] border border-zinc-200/70 bg-[#fcfbf8] p-3">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="px-2 py-1 text-xs uppercase tracking-[0.14em] text-zinc-500">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const key = day.toISOString().slice(0, 10);
          const weekday = day.getDay();
          const col = weekday === 0 ? 7 : weekday;
          const dayItems = byDay.get(key) ?? [];
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDate(key)}
              className={cn(
                "min-h-[128px] rounded-[1.05rem] border border-zinc-400/15 bg-zinc-50/50 p-2.5 text-left transition-colors hover:border-zinc-400/40",
                selectedDate === key && "border-zinc-900/40 bg-zinc-100/80",
                day.getDate() === new Date().getDate() &&
                  day.getMonth() === new Date().getMonth() &&
                  day.getFullYear() === new Date().getFullYear() &&
                  "border-zinc-900/30",
              )}
              style={{ gridColumnStart: day.getDate() === 1 ? col : undefined }}
            >
              <p className="text-xs font-semibold text-zinc-800">{day.getDate()}</p>
              <div className="mt-2 space-y-1">
                {dayItems.slice(0, 3).map((event) => (
                  <div key={event.id} className={cn("rounded px-2 py-1 text-[11px] font-medium", colorMap[event.colorToken])}>
                    <span className="inline-flex items-center gap-1">
                      {isImageEvent(event) ? <FileImage className="h-3 w-3" /> : null}
                      {event.title}
                    </span>
                  </div>
                ))}
                {dayItems.length > 3 ? <p className="text-[10px] text-zinc-500">+{dayItems.length - 3} more</p> : null}
              </div>
            </button>
          );
        })}
        </div>

        <aside className="rounded-[1.1rem] border border-zinc-300/70 bg-[#f8f6f2] p-4">
          <p className="editorial-kicker">Day Planner</p>
          <h4 className="mt-2 font-heading text-4xl text-zinc-900">
            {selectedDate
              ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
              : "Select a day"}
          </h4>

          <div className="mt-4 flex flex-wrap gap-2">
            {selectableActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.type}
                  type="button"
                  onClick={() => {
                    setEntryType(action.type);
                    setSourceId("");
                    setFile(null);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em]",
                    entryType === action.type
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-600",
                  )}
                  disabled={!selectedDate}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {action.label}
                </button>
              );
            })}
          </div>

          <div className="mt-4 space-y-3">
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Entry title"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-600"
              disabled={!selectedDate || isPending}
            />
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional notes"
              className="h-20 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-600"
              disabled={!selectedDate || isPending}
            />

            {entryType === "invoice" ? (
              <select
                value={sourceId}
                onChange={(event) => setSourceId(event.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-600"
                disabled={!selectedDate || isPending}
              >
                <option value="">Select invoice</option>
                {invoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.label}
                  </option>
                ))}
              </select>
            ) : null}

            {entryType === "agreement" ? (
              <select
                value={sourceId}
                onChange={(event) => setSourceId(event.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-600"
                disabled={!selectedDate || isPending}
              >
                <option value="">Select agreement</option>
                {agreements.map((agreement) => (
                  <option key={agreement.id} value={agreement.id}>
                    {agreement.label}
                  </option>
                ))}
              </select>
            ) : null}

            {entryType === "file" || entryType === "image" ? (
              <input
                type="file"
                accept={entryType === "image" ? "image/*" : undefined}
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                disabled={!selectedDate || isPending}
                className="w-full text-xs text-zinc-600 file:mr-3 file:rounded-full file:border-0 file:bg-zinc-900 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white"
              />
            ) : null}

            <button
              type="button"
              onClick={handleCreate}
              disabled={!selectedDate || isPending}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Save entry
            </button>
            {errorMessage ? <p className="text-xs text-rose-700">{errorMessage}</p> : null}
          </div>

          <div className="mt-6 space-y-2">
            <p className="editorial-kicker">Day entries</p>
            {selectedDayItems.map((event) => (
              <div key={event.id} className={cn("rounded-xl border border-zinc-200/70 bg-white p-3", colorMap[event.colorToken])}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em]">{event.entryType ?? event.kind}</p>
                    <p className="mt-1 text-sm font-semibold">{event.title}</p>
                    {event.notes ? <p className="mt-1 text-xs opacity-85">{event.notes}</p> : null}
                  </div>
                {event.kind === "manual" ? (
                  <div className="flex items-center gap-1">
                    {canEditEvent(event) ? (
                      <button
                        type="button"
                        className="rounded-full border border-current/30 p-1 hover:bg-black/5"
                        onClick={() => beginEdit(event)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="rounded-full border border-current/30 p-1 hover:bg-black/5"
                      onClick={() => handleDelete(event.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}
                </div>
                {isImageEvent(event) && (event.previewUrl || event.downloadUrl) ? (
                  <button
                    type="button"
                    onClick={() => setPreviewImageUrl(event.previewUrl ?? event.downloadUrl ?? null)}
                    className="mt-2 block h-28 w-full overflow-hidden rounded-lg border border-current/20 bg-black/5 text-left"
                  >
                    <span
                      className="block h-full w-full bg-cover bg-center"
                      style={{ backgroundImage: `url("${event.previewUrl ?? event.downloadUrl}")` }}
                    />
                    <span className="mt-1 inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold">
                      <Expand className="h-3 w-3" />
                      Open preview
                    </span>
                  </button>
                ) : null}
                {event.downloadUrl ? (
                  <a
                    href={event.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    Download attachment
                  </a>
                ) : null}
              </div>
            ))}
            {selectedDate && !selectedDayItems.length ? <p className="text-xs text-zinc-500">No entries on this day yet.</p> : null}
          </div>

          {editingEntryId ? (
            <div className="mt-4 rounded-xl border border-zinc-300/70 bg-white p-3">
              <p className="editorial-kicker">Edit entry</p>
              <div className="mt-2 space-y-2">
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(event) => setEditingTitle(event.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
                <textarea
                  value={editingNotes}
                  onChange={(event) => setEditingNotes(event.target.value)}
                  className="h-20 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-white"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingEntryId(null)}
                    className="inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-700"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      {previewImageUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={() => setPreviewImageUrl(null)}>
          <div className="w-full max-w-5xl rounded-[1.3rem] border border-white/20 bg-black/40 p-3" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="mb-2 ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="h-[70vh] w-full rounded-[1rem] bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url("${previewImageUrl}")` }} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
