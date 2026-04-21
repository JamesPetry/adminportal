import Link from "next/link";
import { redirect } from "next/navigation";
import { PencilLine } from "lucide-react";

import { signOut } from "@/app/auth-actions";
import { getClientsList, getUserContext } from "@/lib/portal/server";

export const metadata = {
  title: "Admin | James Marlin Client Dashboard",
};

export default async function AdminPage() {
  const context = await getUserContext();
  if (context.role !== "admin") {
    redirect("/dashboard");
  }

  const clients = await getClientsList();

  return (
    <main className="min-h-screen bg-[#f8fafc] p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Admin Workspace</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Client Portal Management</h1>
          <p className="mt-2 text-sm text-slate-600">
            Select a client to edit portal content, update milestones, and publish dashboard updates.
          </p>
          <form action={signOut} className="mt-3">
            <button type="submit" className="text-sm font-medium text-slate-500 hover:text-slate-900">
              Sign out
            </button>
          </form>
        </header>

        <section className="grid gap-3">
          {clients.map((client) => (
            <div
              key={client.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{client.name}</p>
                <p className="text-xs uppercase tracking-[0.1em] text-slate-500">{client.slug}</p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/clients/${client.id}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <PencilLine className="h-4 w-4" />
                  Edit
                </Link>
              </div>
            </div>
          ))}
          {!clients.length ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
              No clients found yet. Add clients in the `clients` Supabase table first.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
