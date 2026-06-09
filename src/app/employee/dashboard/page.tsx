import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CalendarCheck, AlertCircle, FileSpreadsheet, ArrowRight, UserCheck } from "lucide-react";
import { verifyAccessToken } from "@/lib/jwt";
import { dashboardService } from "@/modules/dashboard/service";
import { ClockWidget } from "@/components/shared/clock-widget";
import Link from "next/link";

export const revalidate = 0; // Force full dynamic execution for shift calculations

export default async function EmployeeDashboardPage() {
  // 1. Next.js Pattern: Await the async cookie store container
  const cookieStore = await cookies();
  const token = cookieStore.get("hirenova_access")?.value;
  const session = token ? verifyAccessToken(token) : null;

  if (!session) {
    redirect("/login");
  }

  // 2. Architecture Rule: Directly call the service layer on the server
  const metrics = await dashboardService.getEmployeeDashboardMetrics(session.userId);

  const statsCards = [
    {
      title: "Days Present",
      value: metrics.monthlySummaryStats.daysPresent,
      description: "Settled shifts this month",
      icon: UserCheck,
      color: "text-white bg-white/[0.03] border-white/10",
    },
    {
      title: "Confirmed Absences",
      value: metrics.monthlySummaryStats.daysAbsent,
      description: "Unmarked workdays recorded",
      icon: AlertCircle,
      color: "text-white bg-white/[0.03] border-white/10",
    },
    {
      title: "Approved Leaves Taken",
      value: metrics.monthlySummaryStats.approvedLeavesTaken,
      description: "Authorized time-off events",
      icon: CalendarCheck,
      color: "text-white bg-white/[0.03] border-white/10",
    },
    {
      title: "Accumulated Work Hours",
      value: `${metrics.monthlySummaryStats.accumulatedWorkHours} hrs`,
      description: "Total clock duration recorded",
      icon: FileSpreadsheet,
      color: "text-white bg-white/[0.03] border-white/10",
    },
  ];

  // Indian Currency Formatter Strategy
  const formatIndianCurrency = (val: number) => 
    new Intl.NumberFormat("en-IN", { 
      style: "currency", 
      currency: "INR",
      maximumFractionDigits: 0 
    }).format(val);

  return (
    <div className="space-y-8 sm:space-y-10 max-w-7xl mx-auto text-white">

      {/* ================= WELCOME BANNER HEADER ================= */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-white">
          Welcome back, {metrics.employeeDetails.fullName}
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 font-normal">
          Corporate ID: <span className="font-mono font-semibold text-white">{metrics.employeeDetails.id || "Pending"}</span> • {metrics.employeeDetails.role} ({metrics.employeeDetails.dept})
        </p>
      </div>

      {/* ================= MAIN CORE TRACKING OPERATIONAL GRID AREA ================= */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 items-stretch">

        {/* Interactive client-side clock widget element wrapper */}
        <div className="lg:col-span-1 min-w-0 flex flex-col">
          <ClockWidget initialStatus={metrics.todayClockStatus} />
        </div>

        {/* Informative Shift Overview Context Box */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#12141A] p-5 sm:p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-white text-base tracking-tight mb-1">Standard Shift Obligations</h3>
            <p className="text-xs text-gray-500 font-normal mb-3 sm:mb-4">Baseline corporate time attendance compliance rules.</p>
            <p className="text-sm text-gray-400 font-normal leading-relaxed hidden sm:block">
              Your profile is bound to the standard company tracking parameters. Daily sessions expect a standard 9-hour operational block. Arrivals registered past the core office startup parameters log automated undertime calculations.
            </p>
          </div>

          <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-2 text-center text-xs border-t border-white/8 pt-4 sm:pt-5 font-medium text-gray-300">
            <div>
              <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Shift Window</span>
              <span className="font-semibold text-white text-xs sm:text-sm">09:00 - 18:00</span>
            </div>
            <div>
              <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Overtime Rate</span>
              <span className="font-semibold text-white text-xs sm:text-sm">1.5x Base</span>
            </div>
            <div>
              <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Calculations</span>
              <span className="font-semibold text-white text-xs sm:text-sm">Daily Delta</span>
            </div>
          </div>
        </div>

      </div>

      {/* ================= MONTHLY DYNAMIC ANALYTICS SUMMARY ================= */}
      <div className="space-y-4">
        <h3 className="font-semibold text-white text-base sm:text-lg tracking-tight">Current Month Ledger At-A-Glance</h3>

        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {statsCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-white/10 bg-[#12141A] p-4 sm:p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] flex items-center justify-between transition-all duration-200 hover:border-white/15"
              >
                <div className="space-y-1 sm:space-y-1.5 min-w-0 pr-2">
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 truncate">{card.title}</p>
                  <p className="text-xl sm:text-2xl font-semibold tracking-tight text-white">{card.value}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-normal hidden sm:block">{card.description}</p>
                </div>
                <div className={`rounded-xl border p-2 sm:p-3 flex items-center justify-center shrink-0 ${card.color}`}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 stroke-[1.75]" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= SUB-LAYER: EARNINGS ARCHIVE SLIPS FEED ================= */}
      <div className="rounded-2xl border border-white/10 bg-[#12141A] p-5 sm:p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
        <div className="flex items-start sm:items-center justify-between mb-5 sm:mb-6 gap-3">
          <div>
            <h3 className="font-semibold text-white text-base tracking-tight mb-1">Recent Issued Payslips</h3>
            <p className="text-xs text-gray-500 font-normal hidden sm:block">Authorized fiscal releases available for download.</p>
          </div>

          <Link
            href="/employee/payroll"
            className="inline-flex items-center gap-1.5 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 text-xs font-semibold px-3 sm:px-4 py-2 rounded-full text-gray-200 transition-all cursor-pointer shadow-xs shrink-0"
          >
            Full Ledger <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="divide-y border-white/8">
          {metrics.recentPayslips.length === 0 ? (
            <p className="text-center py-8 text-xs font-normal text-gray-500">
              No salary slip files have been officially released to your ledger yet.
            </p>
          ) : (
            metrics.recentPayslips.map((slip) => (
              <div key={slip.id.toString()} className="flex items-center justify-between py-3 sm:py-4 first:pt-0 last:pb-0 hover:bg-white/[0.02] rounded-xl px-2 sm:px-3 transition-colors duration-150">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2 sm:p-2.5 text-white">
                    <FileSpreadsheet className="h-4 w-4 stroke-[1.75]" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-white">{slip.period}</p>
                    <p className="text-xs text-gray-500 font-normal hidden sm:block">Status: Confirmed Release</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm sm:text-base font-semibold text-white tracking-tight">
                    {formatIndianCurrency(slip.netTakeHome)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}