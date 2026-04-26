import Link from "next/link";
import { redirect } from "next/navigation";
import { Download, Send } from "lucide-react";

import { signAgreement } from "@/app/(portal)/agreement-actions";
import {
  assignClientToProject,
  createAgreement,
  createInvoice,
  updateInvoice,
  deleteAgreement,
  deleteProjectFile,
  deleteInvoice,
  saveClientPortal,
  sendAgreement,
  updateAgreementWorkflowState,
  resetAgreementSignatures,
  updateProjectBusinessSignatory,
  createCalendarEvent,
  deleteCalendarEvent,
  uploadPortalSectionImage,
  uploadProjectFile,
} from "@/app/(admin)/admin/actions";
import { signOut } from "@/app/auth-actions";
import { ClientPortalEditorForm } from "@/components/admin/client-portal-editor-form";
import { getAgreementsByProjectId, getInvoicesByProjectId, getManualCalendarEventsByProjectId, getPortalPayloadByProjectId, getProjectById, getProjectFiles, getUserContext } from "@/lib/portal/server";
import { createClient } from "@/lib/supabase/server";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminProjectEditorPage({ params }: PageProps) {
  const context = await getUserContext();
  if (context.role !== "admin") redirect("/dashboard");

  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) redirect("/admin");

  const payload = await getPortalPayloadByProjectId(project);
  const invoices = await getInvoicesByProjectId(project.id);
  const agreements = await getAgreementsByProjectId(project.id);
  const calendarEvents = await getManualCalendarEventsByProjectId(project.id);
  const { rows: files } = await getProjectFiles(project.id);
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("project_members")
    .select("id, email, role, invitation_status")
    .eq("project_id", project.id)
    .order("invited_at", { ascending: false })
    .returns<{ id: string; email: string; role: string; invitation_status: string }[]>();

  return (
    <main className="min-h-screen bg-[#ece8df] p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="editorial-shell p-6">
          <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-900">
            ← Back to projects
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">{project.name}</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Manage portal data, documents, invoices, and agreement signatures for this project.
          </p>
          <form action={signOut} className="mt-3">
            <button type="submit" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">
              Sign out
            </button>
          </form>
        </header>

        <section className="editorial-shell p-5">
          <h2 className="text-base font-semibold text-zinc-900">Client Assignment & Access</h2>
          <form action={updateProjectBusinessSignatory} className="mt-3 flex flex-wrap items-end gap-2">
            <input type="hidden" name="projectId" value={project.id} />
            <label className="text-xs uppercase tracking-[0.12em] text-zinc-500">Business signatory name</label>
            <input
              name="businessSignatoryName"
              defaultValue={project.businessSignatoryName ?? "James Marlin Studio"}
              className="h-9 min-w-72 rounded-lg border border-zinc-300 px-3 text-sm"
            />
            <button className="h-9 rounded-lg border border-zinc-300 px-4 text-sm hover:bg-zinc-50">Save signatory</button>
          </form>
          <form action={assignClientToProject.bind(null, project.id)} className="mt-3 flex flex-wrap gap-2">
            <input
              name="clientEmail"
              placeholder="client@email.com"
              required
              className="h-9 min-w-72 rounded-lg border border-zinc-300 px-3 text-sm"
            />
            <button className="inline-flex h-9 items-center gap-1 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800">
              <Send className="h-4 w-4" />
              Send secure project link
            </button>
          </form>
          <div className="mt-4 space-y-2">
            {(members ?? []).map((member) => (
              <div key={member.id} className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                <span>{member.email}</span>
                <span className="text-zinc-500">
                  {member.role} · {member.invitation_status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="editorial-shell p-5">
          <h2 className="text-base font-semibold text-zinc-900">Document Uploads</h2>
          <form action={uploadProjectFile.bind(null, project.id)} className="mt-3 grid gap-2 md:grid-cols-4">
            <input name="fileName" placeholder="Display file name" className="h-9 rounded-lg border border-zinc-300 px-3 text-sm md:col-span-2" />
            <input name="category" placeholder="Category (Invoices, Agreements, Files...)" className="h-9 rounded-lg border border-zinc-300 px-3 text-sm" />
            <input name="file" type="file" required className="h-9 rounded-lg border border-zinc-300 px-2 text-sm" />
            <button className="h-9 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 md:col-span-4 md:w-fit">
              Upload file
            </button>
          </form>
          <div className="mt-4 space-y-2">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50/60 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-zinc-900">{file.fileName}</p>
                  <p className="text-xs text-zinc-500">{file.category}</p>
                </div>
                <form action={deleteProjectFile}>
                  <input type="hidden" name="fileId" value={file.id} />
                  <input type="hidden" name="projectId" value={project.id} />
                  <button className="rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50">
                    Remove
                  </button>
                </form>
              </div>
            ))}
            {!files.length ? <p className="text-sm text-zinc-500">No uploaded files yet.</p> : null}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="editorial-shell p-5">
            <h2 className="text-base font-semibold text-zinc-900">Invoice Generator</h2>
            <form action={createInvoice.bind(null, project.id)} className="mt-3 space-y-2">
              <input name="invoiceNumber" required placeholder="INV-004" className="h-9 w-full rounded-lg border border-zinc-300 px-3 text-sm" />
              <input name="title" required placeholder="Invoice title" className="h-9 w-full rounded-lg border border-zinc-300 px-3 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input name="issueDate" type="date" required className="h-9 rounded-lg border border-zinc-300 px-3 text-sm" />
                <input name="dueDate" type="date" required className="h-9 rounded-lg border border-zinc-300 px-3 text-sm" />
              </div>
              <select name="status" className="h-9 w-full rounded-lg border border-zinc-300 px-3 text-sm">
                <option>Pending</option>
                <option>Paid</option>
                <option>Overdue</option>
                <option>Upcoming</option>
              </select>
              <div className="grid grid-cols-4 gap-2">
                <input name="lineDescription" placeholder="Line item 1" className="h-9 rounded-lg border border-zinc-300 px-3 text-sm col-span-2" />
                <input name="lineQty" placeholder="Qty" className="h-9 rounded-lg border border-zinc-300 px-3 text-sm" defaultValue="1" />
                <input name="lineUnitPrice" placeholder="Unit $" className="h-9 rounded-lg border border-zinc-300 px-3 text-sm" defaultValue="0" />
                <input name="lineDescription" placeholder="Line item 2" className="h-9 rounded-lg border border-zinc-300 px-3 text-sm col-span-2" />
                <input name="lineQty" placeholder="Qty" className="h-9 rounded-lg border border-zinc-300 px-3 text-sm" defaultValue="1" />
                <input name="lineUnitPrice" placeholder="Unit $" className="h-9 rounded-lg border border-zinc-300 px-3 text-sm" defaultValue="0" />
                <input name="lineDescription" placeholder="Line item 3" className="h-9 rounded-lg border border-zinc-300 px-3 text-sm col-span-2" />
                <input name="lineQty" placeholder="Qty" className="h-9 rounded-lg border border-zinc-300 px-3 text-sm" defaultValue="1" />
                <input name="lineUnitPrice" placeholder="Unit $" className="h-9 rounded-lg border border-zinc-300 px-3 text-sm" defaultValue="0" />
                <input name="lineDescription" placeholder="Line item 4" className="h-9 rounded-lg border border-zinc-300 px-3 text-sm col-span-2" />
                <input name="lineQty" placeholder="Qty" className="h-9 rounded-lg border border-zinc-300 px-3 text-sm" defaultValue="1" />
                <input name="lineUnitPrice" placeholder="Unit $" className="h-9 rounded-lg border border-zinc-300 px-3 text-sm" defaultValue="0" />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" name="taxEnabled" defaultChecked />
                  Include tax
                </label>
                <input
                  name="taxRatePercent"
                  type="number"
                  step="0.01"
                  defaultValue="10"
                  className="h-9 w-28 rounded-lg border border-zinc-300 px-3 text-sm"
                />
                <span className="text-xs text-zinc-500">Tax rate %</span>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Pay details</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input name="paymentName" placeholder="Name" defaultValue="JamesMarlinDesign" className="h-9 rounded-lg border border-zinc-300 px-3 text-sm" />
                  <input name="paymentAbn" placeholder="ABN" defaultValue="63 611 535 706" className="h-9 rounded-lg border border-zinc-300 px-3 text-sm" />
                  <input name="paymentPayId" placeholder="PayID" defaultValue="0423 624 863" className="h-9 rounded-lg border border-zinc-300 px-3 text-sm" />
                  <input name="paymentReference" placeholder="Reference" defaultValue="0019" className="h-9 rounded-lg border border-zinc-300 px-3 text-sm" />
                  <input name="paymentAmount" placeholder="Amount" defaultValue="2150" type="number" step="0.01" className="h-9 rounded-lg border border-zinc-300 px-3 text-sm col-span-2" />
                </div>
              </div>
              <textarea name="notes" rows={3} placeholder="Notes" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
              <button className="h-9 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800">
                Save invoice
              </button>
            </form>
            <div className="mt-4 space-y-2">
              {invoices.map((invoice) => (
                <details key={invoice.id} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                  <summary className="flex cursor-pointer items-center justify-between gap-2">
                    <span>{invoice.invoiceNumber} · {invoice.title}</span>
                    <a href={`/api/invoices/${invoice.id}/pdf`} className="inline-flex items-center gap-1 text-zinc-700 hover:text-zinc-900">
                      <Download className="h-4 w-4" />
                      PDF
                    </a>
                  </summary>
                  <form action={updateInvoice} className="mt-3 grid gap-2 rounded-lg border border-zinc-200 bg-zinc-50/40 p-3">
                    <input type="hidden" name="invoiceId" value={invoice.id} />
                    <input type="hidden" name="projectId" value={project.id} />
                    <input name="title" defaultValue={invoice.title} className="h-9 rounded-lg border border-zinc-300 px-3 text-sm" />
                    <div className="grid grid-cols-2 gap-2">
                      <input name="issueDate" type="date" defaultValue={invoice.issueDate} className="h-9 rounded-lg border border-zinc-300 px-3 text-sm" />
                      <input name="dueDate" type="date" defaultValue={invoice.dueDate} className="h-9 rounded-lg border border-zinc-300 px-3 text-sm" />
                    </div>
                    <select name="status" defaultValue={invoice.status} className="h-9 rounded-lg border border-zinc-300 px-3 text-sm">
                      <option>Pending</option>
                      <option>Paid</option>
                      <option>Overdue</option>
                      <option>Upcoming</option>
                    </select>
                    <div className="grid grid-cols-4 gap-2">
                      {[...invoice.lineItems, ...Array.from({ length: Math.max(0, 6 - invoice.lineItems.length) }).map(() => null)].map(
                        (line, index) => (
                          <div key={`${invoice.id}-${index}`} className="contents">
                            <input
                              name="lineDescription"
                              defaultValue={line?.description ?? ""}
                              placeholder={`Line ${index + 1}`}
                              className="h-9 rounded-lg border border-zinc-300 px-3 text-sm col-span-2"
                            />
                            <input
                              name="lineQty"
                              defaultValue={line?.quantity ?? 1}
                              className="h-9 rounded-lg border border-zinc-300 px-3 text-sm"
                            />
                            <input
                              name="lineUnitPrice"
                              defaultValue={line?.unitPrice ?? 0}
                              className="h-9 rounded-lg border border-zinc-300 px-3 text-sm"
                            />
                          </div>
                        ),
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" name="taxEnabled" defaultChecked={invoice.taxEnabled} />
                        Include tax
                      </label>
                      <input
                        name="taxRatePercent"
                        type="number"
                        step="0.01"
                        defaultValue={(invoice.taxRate * 100).toFixed(2)}
                        className="h-9 w-28 rounded-lg border border-zinc-300 px-3 text-sm"
                      />
                      <span className="text-xs text-zinc-500">Tax rate %</span>
                    </div>
                    <div className="rounded-lg border border-zinc-200 bg-white p-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Pay details</p>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <input
                          name="paymentName"
                          defaultValue={invoice.paymentDetails.name}
                          className="h-9 rounded-lg border border-zinc-300 px-3 text-sm"
                        />
                        <input
                          name="paymentAbn"
                          defaultValue={invoice.paymentDetails.abn}
                          className="h-9 rounded-lg border border-zinc-300 px-3 text-sm"
                        />
                        <input
                          name="paymentPayId"
                          defaultValue={invoice.paymentDetails.payId}
                          className="h-9 rounded-lg border border-zinc-300 px-3 text-sm"
                        />
                        <input
                          name="paymentReference"
                          defaultValue={invoice.paymentDetails.reference}
                          className="h-9 rounded-lg border border-zinc-300 px-3 text-sm"
                        />
                        <input
                          name="paymentAmount"
                          type="number"
                          step="0.01"
                          defaultValue={invoice.paymentDetails.amount}
                          className="h-9 rounded-lg border border-zinc-300 px-3 text-sm col-span-2"
                        />
                      </div>
                    </div>
                    <textarea name="notes" rows={2} defaultValue={invoice.notes ?? ""} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                    <div className="flex flex-wrap gap-2">
                      <button className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50">Save changes</button>
                    </div>
                  </form>
                  <form action={deleteInvoice} className="mt-2">
                    <input type="hidden" name="invoiceId" value={invoice.id} />
                    <input type="hidden" name="projectId" value={project.id} />
                    <button className="rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50">
                      Delete
                    </button>
                  </form>
                </details>
              ))}
            </div>
          </div>

          <div className="editorial-shell p-5">
            <h2 className="text-base font-semibold text-zinc-900">Agreements & Signatures</h2>
            <form action={createAgreement.bind(null, project.id)} className="mt-3 space-y-2">
              <input name="title" required placeholder="Agreement title" className="h-9 w-full rounded-lg border border-zinc-300 px-3 text-sm" />
              <textarea
                name="content"
                rows={6}
                required
                placeholder="Agreement content"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
              <button className="h-9 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800">
                Save draft
              </button>
            </form>
            <div className="mt-4 space-y-2">
              {agreements.map((agreement) => (
                <div key={agreement.id} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-zinc-900">{agreement.title}</p>
                    <span className="text-xs uppercase tracking-wide text-zinc-500">
                      {agreement.status} · {agreement.workflowState}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <a href={`/api/agreements/${agreement.id}/pdf`} className="inline-flex items-center gap-1 rounded-md border border-zinc-300 px-2 py-1 text-xs">
                      <Download className="h-3.5 w-3.5" />
                      PDF
                    </a>
                    <form action={sendAgreement}>
                      <input type="hidden" name="agreementId" value={agreement.id} />
                      <input type="hidden" name="projectId" value={project.id} />
                      <button className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50">
                        Mark as sent
                      </button>
                    </form>
                    <form action={updateAgreementWorkflowState} className="flex gap-1">
                      <input type="hidden" name="agreementId" value={agreement.id} />
                      <input type="hidden" name="projectId" value={project.id} />
                      <select name="workflowState" defaultValue={agreement.workflowState} className="h-7 rounded-md border border-zinc-300 px-2 text-xs">
                        <option value="pending_review">Pending review</option>
                        <option value="actioned">Actioned</option>
                      </select>
                      <button className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50">
                        Set state
                      </button>
                    </form>
                    <form action={signAgreement} className="flex gap-1">
                      <input type="hidden" name="agreementId" value={agreement.id} />
                      <input type="hidden" name="projectId" value={project.id} />
                      <input
                        name="signatureName"
                        placeholder="Admin sign name"
                        className="h-7 rounded-md border border-zinc-300 px-2 text-xs"
                      />
                      <button className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50">
                        Sign
                      </button>
                    </form>
                    <form action={resetAgreementSignatures}>
                      <input type="hidden" name="agreementId" value={agreement.id} />
                      <input type="hidden" name="projectId" value={project.id} />
                      <button className="rounded-md border border-amber-200 px-2 py-1 text-xs text-amber-800 hover:bg-amber-50">
                        Reset signatures
                      </button>
                    </form>
                    <form action={deleteAgreement}>
                      <input type="hidden" name="agreementId" value={agreement.id} />
                      <input type="hidden" name="projectId" value={project.id} />
                      <button className="rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50">
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="editorial-shell p-5">
            <h2 className="text-base font-semibold text-zinc-900">Manual Calendar Events</h2>
            <form action={createCalendarEvent.bind(null, project.id)} className="mt-3 grid gap-2">
              <input name="title" required placeholder="Event title" className="h-9 rounded-lg border border-zinc-300 px-3 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input name="startDate" type="date" required className="h-9 rounded-lg border border-zinc-300 px-3 text-sm" />
                <input name="endDate" type="date" className="h-9 rounded-lg border border-zinc-300 px-3 text-sm" />
              </div>
              <select name="colorToken" className="h-9 rounded-lg border border-zinc-300 px-3 text-sm">
                <option value="custom">Custom</option>
                <option value="finance">Finance</option>
                <option value="timeline">Timeline</option>
                <option value="approvals">Approvals</option>
              </select>
              <textarea name="notes" rows={2} placeholder="Optional notes" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
              <button className="h-9 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 md:w-fit">Create event</button>
            </form>
            <div className="mt-4 space-y-2">
              {calendarEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium text-zinc-900">{event.title}</p>
                    <p className="text-xs text-zinc-500">{event.startDate}{event.endDate ? ` → ${event.endDate}` : ""} · {event.colorToken}</p>
                  </div>
                  <form action={deleteCalendarEvent}>
                    <input type="hidden" name="eventId" value={event.id} />
                    <input type="hidden" name="projectId" value={project.id} />
                    <button className="rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50">Delete</button>
                  </form>
                </div>
              ))}
              {!calendarEvents.length ? <p className="text-sm text-zinc-500">No manual events yet.</p> : null}
            </div>
          </div>

          <div className="editorial-shell p-5">
            <h2 className="text-base font-semibold text-zinc-900">Section Image Uploads</h2>
            <form action={uploadPortalSectionImage.bind(null, project.id)} className="mt-3 grid gap-2">
              <select name="sectionType" className="h-9 rounded-lg border border-zinc-300 px-3 text-sm">
                <option value="timeline">Timeline week image</option>
                <option value="design">Design concept image</option>
                <option value="proposal">Proposal section image</option>
              </select>
              <input
                name="sectionId"
                required
                placeholder="Section ID (timeline/design/proposal section id)"
                className="h-9 rounded-lg border border-zinc-300 px-3 text-sm"
              />
              <input name="file" type="file" accept="image/*" required className="h-9 rounded-lg border border-zinc-300 px-2 text-sm" />
              <button className="h-9 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 md:w-fit">Upload section image</button>
            </form>
            <p className="mt-3 text-xs text-zinc-500">
              Use IDs from the timeline/design/proposal editors below. Uploaded images are securely stored and rendered across portal and docs.
            </p>
          </div>
        </section>

        <ClientPortalEditorForm
          action={saveClientPortal.bind(null, project.id)}
          overview={payload.overview}
          includedRevisions={payload.includedRevisions}
          timeline={payload.timeline}
          designs={payload.designs}
          invoices={[]}
          feedbackJson={JSON.stringify(payload.feedback, null, 2)}
          filesJson={JSON.stringify(payload.files, null, 2)}
          projectDetailsJson={JSON.stringify(payload.projectDetails, null, 2)}
          clientActionsJson={JSON.stringify(payload.clientActions, null, 2)}
        />
      </div>
    </main>
  );
}
