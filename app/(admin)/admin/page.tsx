import Link from "next/link";
import { redirect } from "next/navigation";
import { FolderPlus, PencilLine, Trash2 } from "lucide-react";

import { createProject, deleteProject } from "@/app/(admin)/admin/actions";
import { signOut } from "@/app/auth-actions";
import { getAccessibleProjects, getUserContext } from "@/lib/portal/server";

export const metadata = {
  title: "Admin | James Marlin Client Dashboard",
};

export default async function AdminPage() {
  const context = await getUserContext();
  if (context.role !== "admin") {
    redirect("/dashboard");
  }

  const projects = await getAccessibleProjects();

  return (
    <main className="min-h-screen bg-[#ece8df] p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="editorial-shell p-6">
          <p className="editorial-kicker">Admin Workspace</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">Client Portal Management</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Create, assign, and manage multiple client projects from one workspace.
          </p>
          <form action={signOut} className="mt-3">
            <button type="submit" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">
              Sign out
            </button>
          </form>
        </header>

        <section className="editorial-shell p-5">
          <h2 className="text-lg font-semibold text-zinc-900">Create Project</h2>
          <form action={createProject} className="mt-4 grid gap-3 md:grid-cols-3">
            <input
              name="projectName"
              placeholder="Project name"
              required
              className="h-9 rounded-lg border border-zinc-300 px-3 text-sm"
            />
            <input
              name="clientName"
              placeholder="Client name"
              required
              className="h-9 rounded-lg border border-zinc-300 px-3 text-sm"
            />
            <input
              name="clientEmail"
              placeholder="Client email for invite"
              className="h-9 rounded-lg border border-zinc-300 px-3 text-sm"
            />
            <button className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 md:col-span-3 md:w-fit">
              <FolderPlus className="h-4 w-4" />
              Create project
            </button>
          </form>
        </section>

        <section className="grid gap-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="editorial-shell flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div>
                <p className="text-sm font-medium text-zinc-900">{project.name}</p>
                <p className="text-xs uppercase tracking-[0.1em] text-zinc-500">
                  {project.clientName} · {project.slug}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/projects/${project.id}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  <PencilLine className="h-4 w-4" />
                  Edit
                </Link>
                <form action={deleteProject}>
                  <input type="hidden" name="projectId" value={project.id} />
                  <button className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
          {!projects.length ? (
            <div className="editorial-shell p-6 text-sm text-zinc-600">
              No projects found yet. Create your first project above.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
