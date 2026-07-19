import type { ReactNode } from "react";

import { CompanyHeader } from "@/components/company/CompanyHeader";
import { CompanyMobileNavigation } from "@/components/company/CompanyMobileNavigation";
import { CompanySidebar } from "@/components/company/CompanySidebar";
import { requireCompanyAccess } from "@/services/company-access";

type CompanyLayoutProps = {
  children: ReactNode;
  params: Promise<{ companyId: string }>;
};

export default async function CompanyLayout({ children, params }: CompanyLayoutProps) {
  const { companyId } = await params;
  const access = await requireCompanyAccess(companyId);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        <CompanySidebar companyId={companyId} companyName={access.companyName} />
        <div className="min-w-0 flex-1 pb-20 lg:pb-0">
          <CompanyHeader
            companyName={access.companyName}
            roleLabel={access.roleLabel}
            fullName={access.fullName}
            email={access.email}
          />
          {children}
        </div>
      </div>
      <CompanyMobileNavigation companyId={companyId} />
    </div>
  );
}
