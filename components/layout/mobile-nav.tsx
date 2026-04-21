"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 lg:hidden">
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium",
              active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50",
            )}
          >
            {item.title}
          </Link>
        );
      })}
    </div>
  );
}
