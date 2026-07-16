"use client";

import {
  Building2,
  LayoutDashboard,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavigationItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  enabled: boolean;
};

const navigationItems: NavigationItem[] = [
  {
    label: "Visão geral",
    href: "/master",
    icon: LayoutDashboard,
    enabled: true,
  },
  {
    label: "Empresas",
    href: "/master/companies",
    icon: Building2,
    enabled: true,
  },
  {
    label: "Usuários Master",
    href: "/master/users",
    icon: Users,
    enabled: false,
  },
  {
    label: "Auditoria",
    href: "/master/audit",
    icon: ScrollText,
    enabled: true,
  },
  {
    label: "Configurações",
    href: "/master/settings",
    icon: Settings,
    enabled: false,
  },
];

function isItemActive(pathname: string, href: string): boolean {
  if (href === "/master") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MasterSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-slate-800 bg-slate-950 lg:flex lg:flex-col">
      <div className="flex h-20 items-center border-b border-slate-800 px-6">
        <Link
          href="/master"
          className="flex items-center gap-3"
        >
          <div className="flex size-11 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-950/40">
            DF
          </div>

          <div>
            <p className="font-bold text-white">
              DF Ponto
            </p>

            <p className="text-xs text-slate-500">
              Administração Master
            </p>
          </div>
        </Link>
      </div>

      <nav
        aria-label="Navegação do painel Master"
        className="flex-1 space-y-1 px-4 py-6"
      >
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
          Plataforma
        </p>

        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(pathname, item.href);

          if (!item.enabled) {
            return (
              <div
                key={item.href}
                className="flex cursor-not-allowed items-center justify-between rounded-xl px-3 py-3 text-sm text-slate-600"
                title="Recurso disponível em uma próxima etapa"
              >
                <div className="flex items-center gap-3">
                  <Icon
                    aria-hidden="true"
                    className="size-5"
                  />

                  <span>{item.label}</span>
                </div>

                <span className="rounded-full border border-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase">
                  Em breve
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
                active
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white",
              ].join(" ")}
            >
              <Icon
                aria-hidden="true"
                className="size-5"
              />

              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-300">
            <ShieldCheck
              aria-hidden="true"
              className="size-4"
            />

            Acesso protegido
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Área exclusiva da administração da DF Solutions.
          </p>
        </div>
      </div>
    </aside>
  );
}