"use client";

import {
  Clock3,
  FileClock,
  Home,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import {
  usePathname,
} from "next/navigation";

type EmployeeNavigationProps = {
  companyId: string;
};

type NavigationItem = {
  label: string;
  href: string;
  icon: typeof Home;
};

function normalizePath(
  pathname: string,
): string {
  if (
    pathname.length > 1 &&
    pathname.endsWith("/")
  ) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

export function EmployeeNavigation({
  companyId,
}: EmployeeNavigationProps) {
  const pathname =
    normalizePath(
      usePathname(),
    );

  const base =
    `/employee/${companyId}`;

  const items: NavigationItem[] = [
    {
      label: "Início",
      href: base,
      icon: Home,
    },
    {
      label: "Registrar",
      href: `${base}/time-clock`,
      icon: Clock3,
    },
    {
      label: "Espelho",
      href: `${base}/timesheet`,
      icon: FileClock,
    },
    {
      label: "Perfil",
      href: `${base}/profile`,
      icon: UserRound,
    },
  ];

  return (
    <>
      <aside className="fixed bottom-0 left-0 top-16 z-30 hidden w-64 border-r border-slate-800 bg-slate-950 lg:block">
        <div className="p-4">
          <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
            Meu ponto
          </p>

          <nav className="mt-2 space-y-1">
            {items.map((item) => {
              const Icon =
                item.icon;

              const active =
                item.href === base
                  ? pathname === base
                  : pathname ===
                        item.href ||
                    pathname.startsWith(
                      `${item.href}/`,
                    );

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={
                    active
                      ? "page"
                      : undefined
                  }
                  className={[
                    "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                    active
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white",
                  ].join(" ")}
                >
                  <Icon className="size-4 shrink-0" />

                  <span>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-800 bg-slate-950/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
          {items.map((item) => {
            const Icon =
              item.icon;

            const active =
              item.href === base
                ? pathname === base
                : pathname ===
                      item.href ||
                  pathname.startsWith(
                    `${item.href}/`,
                  );

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={
                  active
                    ? "page"
                    : undefined
                }
                className={[
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[10px] font-bold transition",
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-500 hover:bg-slate-900 hover:text-white",
                ].join(" ")}
              >
                <Icon className="size-4" />

                <span>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}