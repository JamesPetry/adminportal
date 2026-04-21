import Link from "next/link";
import { redirect } from "next/navigation";

import { saveClientPortal } from "@/app/(admin)/admin/actions";
import { signOut } from "@/app/auth-actions";
import { ClientPortalEditorForm } from "@/components/admin/client-portal-editor-form";
import { getClientById, getPortalPayloadByClientId, getUserContext } from "@/lib/portal/server";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminClientEditorPage({ params }: PageProps) {
  const context = await getUserContext();
  if (context.role !== "admin") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const client = await getClientById(id);

  if (!client) {
    redirect("/admin");
  }

  const payload = await getPortalPayloadByClientId(client);
  const overview = payload.overview;
  const timeline = payload.timeline;
  const designs = payload.designs;
  const invoices = payload.invoices;
  const feedback = payload.feedback;
  const files = payload.files;
  const projectDetails = payload.projectDetails;
  const clientActions = payload.clientActions;
  const includedRevisions = payload.includedRevisions;

  return (
    <main className="min-h-screen bg-[#f8fafc] p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-900">
            ← Back to clients
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{client.name} Portal Content</h1>
          <p className="mt-2 text-sm text-slate-600">
            Edit overview fields and update section JSON. Empty arrays produce clean client-facing placeholders.
          </p>
          <form action={signOut} className="mt-3">
            <button type="submit" className="text-sm font-medium text-slate-500 hover:text-slate-900">
              Sign out
            </button>
          </form>
        </header>

        <ClientPortalEditorForm
          action={saveClientPortal.bind(null, client.id)}
          overview={overview}
          includedRevisions={includedRevisions}
          timeline={timeline}
          designs={designs}
          invoices={invoices}
          feedbackJson={JSON.stringify(feedback, null, 2)}
          filesJson={JSON.stringify(files, null, 2)}
          projectDetailsJson={JSON.stringify(projectDetails, null, 2)}
          clientActionsJson={JSON.stringify(clientActions, null, 2)}
        />
      </div>
    </main>
  );
}
