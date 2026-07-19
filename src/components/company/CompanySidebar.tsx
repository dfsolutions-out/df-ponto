"use client";

import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  ChevronLeft,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  MapPin,
  Network,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type CompanySidebarProps = {
  companyId: string;
  companyName?: string;
  roleLabel?: string;

  /*
   * Mantém compatibilidade caso o layout envie
   * propriedades adicionais para o componente.
   */
  [key: string]: unknown;
};

type NavigationItem = {
  label: string;
  segment: string | null;
  icon: typeof LayoutDashboard;
  enabled: boolean;
  description?: string;
};

const navigationItems: NavigationItem[] = [
  {
    label: "Visão geral",
    segment: null,
    icon: LayoutDashboard,
    enabled: true,
  },
  {
    label: "Funcionários",
    segment: "employees",
    icon: Users,
    enabled: true,
  },
  {
    label: "Setores",
    segment: "departments",
    icon: Building2,
    enabled: true,
  },
  {
    label: "Cargos",
    segment: "positions",
    icon: BriefcaseBusiness,
    enabled: true,
  },
  {
    label: "Equipes",
    segment: "teams",
    icon: Network,
    enabled: true,
  },
  {
    label: "Jornadas",
    segment: "schedules",
    icon: CalendarClock,
    enabled: true,
  },
  {
    label: "Locais",
    segment: "locations",
    icon: MapPin,
    enabled: true,
  },
  {
    label: "Registro de ponto",
    segment: "time-clock",
    icon: ClipboardCheck,
    enabled: true,
  },
  {
    label: "Relatórios",
    segment: "reports",
    icon: FileText,
    enabled: false,
    description: "Em breve",
  },
  {
    label: "Indicadores",
    segment: "analytics",
    icon: BarChart3,
    enabled: false,
    description: "Em breve",
  },
];

const footerItems: NavigationItem[] = [
  {
    label: "Auditoria",
    segment: "audit",
    icon: ShieldCheck,
    enabled: false,
    description: "Em breve",
  },
  {
    label: "Configurações",
    segment: "settings",
    icon: Settings,
    enabled: false,
    description: "Em breve",
  },
];

function normalizePathname(pathname: string): string {
  if (
    pathname.length > 1 &&
    pathname.endsWith("/")
  ) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function isItemActive(params: {
  pathname: string;
  basePath: string;
  segment: string | null;
}): boolean {
  const normalizedPathname =
    normalizePathname(params.pathname);

  const normalizedBasePath =
    normalizePathname(params.basePath);

  if (params.segment === null) {
    return (
      normalizedPathname ===
      normalizedBasePath
    );
  }

  const itemPath =
    `${normalizedBasePath}/${params.segment}`;

  return (
    normalizedPathname === itemPath ||
    normalizedPathname.startsWith(
      `${itemPath}/`,
    )
  );
}

export function CompanySidebar({
  companyId,
  companyName,
  roleLabel,
}: CompanySidebarProps) {
  const pathname = usePathname();

  const basePath =
    `/company/${companyId}`;

  function renderNavigationItem(
    item: NavigationItem,
  ) {
    const Icon = item.icon;

    const active = isItemActive({
      pathname,
      basePath,
      segment: item.segment,
    });

    if (!item.enabled) {
      return (
        <div
          key={item.label}
          aria-disabled="true"
          className="flex min-h-11 cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-slate-600"
        >
          <Icon className="size-4 shrink-0" />

          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {item.label}
          </span>

          {item.description ? (
            <span className="rounded-full border border-slate-800 bg-slate-900 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-600">
              {item.description}
            </span>
          ) : null}
        </div>
      );
    }

    const href =
      item.segment === null
        ? basePath
        : `${basePath}/${item.segment}`;

    return (
      <Link
        key={item.label}
        href={href}
        aria-current={
          active ? "page" : undefined
        }
        className={[
          "group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
          active
            ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
            : "text-slate-400 hover:bg-slate-800/80 hover:text-white",
        ].join(" ")}
      >
        {active ? (
          <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-blue-400" />
        ) : null}

        <Icon
          className={[
            "size-4 shrink-0 transition",
            active
              ? "text-white"
              : "text-slate-500 group-hover:text-blue-400",
          ].join(" ")}
        />

        <span className="truncate">
          {item.label}
        </span>
      </Link>
    );
  }

  return (
    <aside className="hidden h-screen w-72 shrink-0 border-r border-slate-800 bg-slate-950 lg:sticky lg:top-0 lg:flex lg:flex-col">
      <div className="border-b border-slate-800 px-5 py-5">
        <Link
          href="/access"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500 transition hover:text-white"
        >
          <ChevronLeft className="size-4" />
          Trocar ambiente
        </Link>

        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
              <Building2 className="size-5" />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">
                Empresa
              </p>

              <p className="mt-1 truncate text-sm font-bold text-white">
                {companyName ||
                  "Painel da empresa"}
              </p>

              {roleLabel ? (
                <p className="mt-1 truncate text-xs text-slate-500">
                  {roleLabel}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
          Gestão
        </p>

        <nav
          aria-label="Navegação da empresa"
          className="mt-3 space-y-1"
        >
          {navigationItems.map(
            renderNavigationItem,
          )}
        </nav>
      </div>

      <div className="border-t border-slate-800 px-4 py-4">
        <nav
          aria-label="Configurações da empresa"
          className="space-y-1"
        >
          {footerItems.map(
            renderNavigationItem,
          )}
        </nav>

        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
            DF Ponto
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Controle de jornada digital
          </p>
        </div>
      </div>
    </aside>
  );
}