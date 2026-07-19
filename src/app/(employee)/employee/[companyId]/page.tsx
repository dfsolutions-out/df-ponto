import {
  notFound,
} from "next/navigation";

import { EmployeeDashboard } from "@/components/employee/EmployeeDashboard";
import { getEmployeePortalDashboard } from "@/services/employee-portal";

type EmployeeDashboardPageProps = {
  params: Promise<{
    companyId: string;
  }>;
};

export default async function EmployeeDashboardPage({
  params,
}: EmployeeDashboardPageProps) {
  const { companyId } =
    await params;

  let dashboard;

  try {
    dashboard =
      await getEmployeePortalDashboard(
        companyId,
      );
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <EmployeeDashboard
        dashboard={dashboard}
      />
    </div>
  );
}