"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2 } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { navItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function PortalSidebar({ clientName, projectStatus }: { clientName: string; projectStatus: string }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-zinc-800 bg-zinc-950 px-5 py-7 lg:block">
      <div className="mb-10 space-y-4">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900">
          <Building2 className="h-4 w-4 text-zinc-200" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Client Portal</p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-white">{clientName}</h1>
          <p className="mt-1 text-sm text-zinc-400">Website Redesign Workspace</p>
        </div>
        <StatusBadge status={projectStatus} />
      </div>

      <nav className="space-y-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                isActive
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-300 hover:bg-zinc-900 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="font-medium">{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
