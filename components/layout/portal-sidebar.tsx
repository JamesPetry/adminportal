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
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-slate-200 bg-white/90 px-5 py-6 lg:block">
      <div className="mb-10 space-y-4">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
          <Building2 className="h-4 w-4 text-slate-700" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Client Portal</p>
          <h1 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">{clientName}</h1>
          <p className="mt-1 text-sm text-slate-500">Website Redesign Workspace</p>
        </div>
        <StatusBadge status={projectStatus} />
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
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
