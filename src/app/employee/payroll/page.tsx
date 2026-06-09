import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "@/lib/jwt";
import { payrollService } from "@/modules/payroll/service";
import { CreditCard, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

export default async function EmployeePayrollPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("hirenova_access")?.value;
  const session = token ? verifyAccessToken(token) : null;

  if (!session) redirect("/login");

  const releasedSlips = await payrollService.getEmployeePayslipArchive(session.userId);

  const formatIndianCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

  const getMonthName = (monthNum: number) =>
    new Date(2026, monthNum - 1, 1).toLocaleString("en-US", { month: "long" });

  return (
    <div className="space-y-10 max-w-7xl mx-auto text-white">
      
      {/* Header Profile Info */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-white">My Compensation Archive</h1>
        <p className="text-xs sm:text-sm text-gray-400 font-normal">View secure corporate salary disclosures, historical slips, and download printable records.</p>
      </div>

      {releasedSlips.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#12141A] p-12 text-center shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.03] text-gray-500 mb-4 border border-white/10">
            <CreditCard className="h-5 w-5 stroke-[1.75]" />
          </div>
          <h3 className="text-sm font-semibold text-white tracking-tight">No Released Payslips Located</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed font-normal">
            Your historical records ledger is currently empty. Slips become accessible here as soon as management finalizes the cycle.
          </p>
        </div>
      ) : (
        /* Premium Minimalist History Ledger Table Matrix */
        <div className="rounded-2xl border border-white/10 bg-[#12141A] overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-white/[0.05] text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-white/10">
                <tr>
                  <th className="px-4 sm:px-6 py-4">Statement Period</th>
                  <th className="px-4 sm:px-6 py-4 hidden sm:table-cell">Gross Earnings</th>
                  <th className="px-4 sm:px-6 py-4 hidden md:table-cell">Total Retentions</th>
                  <th className="px-4 sm:px-6 py-4">Net Take-Home</th>
                  <th className="px-4 sm:px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y border-white/8">
                {releasedSlips.map((slip: any) => (
                  <tr key={slip._id.toString()} className="hover:bg-white/[0.02] transition-colors duration-150">
                    <td className="px-4 sm:px-6 py-4 font-medium text-white">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-gray-200 shrink-0">
                          <FileText className="h-4 w-4 stroke-[1.75]" />
                        </div>
                        <span className="font-medium text-sm">{getMonthName(slip.month)} {slip.year}</span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-xs font-medium text-emerald-400 hidden sm:table-cell">
                      +{formatIndianCurrency(slip.earnings.total)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-xs font-medium text-rose-400 hidden md:table-cell">
                      -{formatIndianCurrency(slip.deductions.total)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-white">
                      {formatIndianCurrency(slip.netSalary)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <Link
                        href={`/employee/payroll/${slip._id.toString()}`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] text-white text-xs font-semibold px-3 sm:px-4 py-1.5 hover:opacity-90 shadow-sm transition-all cursor-pointer"
                      >
                        View <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}