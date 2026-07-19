import type {
  ReactNode,
} from "react";
import {
  notFound,
} from "next/navigation";

import { EmployeeHeader } from "@/components/employee/EmployeeHeader";
import { EmployeeNavigation } from "@/components/employee/EmployeeNavigation";
import { requireEmployeePortalContext } from "@/services/employee-portal";

type EmployeeCompanyLayoutProps = {
  children: ReactNode;

  params: Promise<{
    companyId: string;
  }>;
};

export default async function EmployeeCompanyLayout({
  children,
  params,
}: EmployeeCompanyLayoutProps) {
  const { companyId } =
    await params;

  let context;

  try {
    context =
      await requireEmployeePortalContext(
        companyId,
      );
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <EmployeeHeader
        context={context}
      />

      <EmployeeNavigation
        companyId={companyId}
      />

      <div className="lg:pl-64">
        <main className="min-h-[calc(100vh-4rem)] pb-24 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}