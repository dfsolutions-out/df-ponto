"use client";

import {
  CalendarClock,
  LayoutDashboard,
  Network,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function CompanyMobileNavigation({
  companyId,
}: {
  companyId: string;
}) {
  const pathname = usePathname();
  const base = `/company/${companyId}`;

  const items = [
    {
      label: "Início",
      href: base,
      icon: LayoutDashboard,
    },
    {
      label: "Equipes",
      href: `${base}/teams`,
      icon: Network,
    },
    {
      label: "Pessoas",
      href: `${base}/employees`,
      icon: Users,
    },
    {
      label: "Jornadas",
      href: `${base}/schedules`,
      icon: CalendarClock,
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-slate-950/95 px-2 py-2 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
        {items.map((item) => {
          const Icon = item.icon;

          const active =
            item.href === base
              ? pathname === item.href
              : pathname === item.href ||
                pathname.startsWith(
                  `${item.href}/`,
                );

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-semibold transition",
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-500 hover:bg-slate-900 hover:text-white",
              ].join(" ")}
            >
              <Icon className="size-5" />

              <span className="truncate">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}