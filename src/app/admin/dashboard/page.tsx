import Link from "next/link";
import {
  Users,
  Clock,
  CreditCard,
  UserPlus,
  ArrowUpRight,
  AlertCircle,
  Sparkles,
  Briefcase,
  Trophy,
  LineChart,
} from "lucide-react";
import { dashboardService } from "@/modules/dashboard/service";
import { DashboardCharts } from "@/components/shared/dashboard-charts";
import { hiringAgentService } from "@/modules/agents/hiring/service";

export const revalidate = 0; // Maintain absolute dynamic computation parameters

export default async function AdminDashboardPage() {
  const [metrics, funnel] = await Promise.all([
    dashboardService.getAdminDashboardMetrics(),
    hiringAgentService.getFunnelOverview(),
  ]);

  const kpiCards = [
    {
      title: "Active Workforce",
      value: metrics.kpis.totalWorkforce,
      description: "Total onboarded active employees",
      icon: Users,
      color: "text-white bg-white/[0.03] border-white/10",
    },
    {
      title: "Pending Onboarding",
      value: metrics.kpis.pendingApprovals,
      description: "Applications awaiting evaluation",
      icon: UserPlus,
      color: "text-white bg-white/[0.03] border-white/10",
    },
    {
      title: "Attendance Rate Today",
      value: `${metrics.kpis.attendanceRateToday}%`,
      description: "Proportion of active staff checked in",
      icon: Clock,
      color: "text-white bg-white/[0.03] border-white/10",
    },
    {
      title: "Monthly Payroll Committed",
      value: new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
      }).format(metrics.kpis.monthlyPayrollOutlayNet),
      description: "Net settlement aggregate outlay",
      icon: CreditCard,
      color: "text-white bg-white/[0.03] border-white/10",
    },
  ];

  return (
    /* The layout uses global transition variables (`duration-300 ease-[cubic-bezier(...)]`)
      to move exactly in sync with the collapsing sidebar layout changes.
    */
    <div className="space-y-8 sm:space-y-10 max-w-7xl mx-auto text-white transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)]">

      {/* ================= HEADER PANEL ================= */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-white">
          System Analytics Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 font-normal">
          Real-time governance oversight and payroll telemetry operations console.
        </p>
      </div>

      {/* ================= AGENTIC OPERATIONS PANEL ================= */}
      <div className="rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition-all duration-300">
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <div className="inline-flex items-center gap-2 rounded-full border border-[oklch(0.62_0.21_291)]/20 bg-[oklch(0.62_0.21_291)]/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.62_0.21_291)]">
            <Sparkles className="h-3 w-3" /> AI Agents
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/hiring"
              className="inline-flex items-center gap-1.5 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 text-xs font-semibold px-4 py-2 rounded-full text-gray-200 transition-all cursor-pointer shadow-xs"
            >
              Open Hiring Agent <ArrowUpRight className="h-3 w-3" />
            </Link>
            <Link
              href="/admin/analytics"
              className="inline-flex items-center gap-1.5 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 text-xs font-semibold px-4 py-2 rounded-full text-gray-200 transition-all cursor-pointer shadow-xs"
            >
              Workforce Analytics <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Open Roles", value: funnel.openJobs, icon: Briefcase, href: "/admin/hiring" },
            { label: "Candidates in Pipeline", value: funnel.totalCandidates, icon: Users, href: "/admin/hiring" },
            { label: "Shortlisted by AI", value: funnel.shortlisted, icon: Sparkles, href: "/admin/hiring" },
            { label: "Hired via AI", value: funnel.hired, icon: Trophy, href: "/admin/hiring" },
          ].map(tile => (
            <Link
              key={tile.label}
              href={tile.href}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center gap-3 hover:border-[oklch(0.62_0.21_291)]/30 hover:bg-[oklch(0.62_0.21_291)]/5 transition-all duration-200"
            >
              <div className="h-9 w-9 rounded-lg bg-[#12141A] border border-white/10 flex items-center justify-center shrink-0">
                <tile.icon className="h-4 w-4 text-[oklch(0.62_0.21_291)]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium truncate">{tile.label}</p>
                <p className="text-lg font-semibold text-white">{tile.value}</p>
              </div>
            </Link>
          ))}
        </div>

        <Link
          href="/admin/analytics"
          className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-[oklch(0.62_0.21_291)]/30 hover:bg-[oklch(0.62_0.21_291)]/5 transition-all duration-200"
        >
          <div className="h-9 w-9 rounded-lg bg-[#12141A] border border-white/10 flex items-center justify-center shrink-0">
            <LineChart className="h-4 w-4 text-[oklch(0.62_0.21_291)]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">AI-narrated workforce insights are ready</p>
            <p className="text-xs text-gray-500">Headcount, attendance, payroll, and leave trends — distilled by the Workforce Analytics Agent.</p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-gray-600 ml-auto shrink-0" />
        </Link>
      </div>

      {/* ================= KPI CARD PANEL ================= */}
      {/* Grid adjusts configuration fluidly based on the responsive container query tree.
        When sidebar collapses (`has-[:aside.w-20]`), the layout opens up extra subpixel width values.
      */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 transition-all duration-300">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-white/10 bg-[#12141A] p-4 sm:p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] flex items-center justify-between transition-all duration-200 hover:border-white/15"
            >
              <div className="space-y-1 sm:space-y-1.5 min-w-0 pr-2">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 truncate">
                  {kpi.title}
                </p>
                <p className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
                  {kpi.value}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 font-normal hidden sm:block">
                  {kpi.description}
                </p>
              </div>
              <div className={`rounded-xl border p-2 sm:p-3 flex items-center justify-center shrink-0 ${kpi.color}`}>
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 stroke-[1.75]" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= CHARTS WRAPPER ================= */}
      <div className="rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition-all duration-300">
        <DashboardCharts
          attendanceData={metrics.attendanceTodayBreakdown}
          monthlyNetOutlay={metrics.kpis.monthlyPayrollOutlayNet}
        />
      </div>

      {/* ================= DATA FEEDS & COMPLIANCE SPLIT ================= */}
      {/* Dynamically reacts to parent sidebar alterations.
        Changes structural split behaviors smoothly on wide displays based on layout limits.
      */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 transition-all duration-300">

        {/* Compliance Status Block */}
        <div className="rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] flex flex-col justify-between transition-all duration-300">
          <div>
            <h3 className="font-semibold text-white text-base tracking-tight mb-1">
              Compliance Status
            </h3>
            <p className="text-xs text-gray-500 mb-5">Operations monitoring items.</p>
            <p className="text-sm text-gray-400 font-normal leading-relaxed">
              Daily clock transactions are benchmarked against the standard system configuration profile rules. Missed check-points require administrative overrides.
            </p>
          </div>

          <div className="mt-6 rounded-xl bg-white/[0.03] border border-white/10 p-4 flex items-start gap-3 text-xs text-gray-300 leading-normal">
            <AlertCircle className="h-4 w-4 text-gray-500 shrink-0 mt-0.5" />
            <span>
              Currently <strong>{metrics.attendanceTodayBreakdown.unmarked}</strong> active employees have not posted a checkpoint today.
            </span>
          </div>
        </div>

        {/* Pending Registration Requests Grid Feed */}
        <div className="xl:col-span-2 rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-white text-base tracking-tight mb-1">
                Recent Registry Submissions
              </h3>
              <p className="text-xs text-gray-500">Latest workforce profiles awaiting system approval entries.</p>
            </div>

            <Link
              href="/admin/employees"
              className="inline-flex items-center gap-1.5 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 text-xs font-semibold px-4 py-2 rounded-full text-gray-200 transition-all cursor-pointer shadow-xs"
            >
              Manage Queue <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="overflow-x-auto transition-all duration-300">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-white/[0.05] text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 font-semibold">Employee Candidate</th>
                  <th className="px-4 py-3 font-semibold hidden sm:table-cell">Department</th>
                  <th className="px-4 py-3 font-semibold hidden md:table-cell">Date</th>
                  <th className="px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y border-white/8">
                {metrics.recentRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-xs text-gray-500 font-normal">
                      The application queue is completely clear. No registrations are pending review.
                    </td>
                  </tr>
                ) : (
                  metrics.recentRegistrations.map((request) => (
                    <tr key={request.id.toString()} className="hover:bg-white/[0.02] transition-colors duration-150">
                      <td className="px-4 py-4 font-medium text-white">
                        <div className="flex flex-col">
                          <span className="font-medium">{request.name}</span>
                          <span className="text-xs text-gray-500 font-normal mt-0.5">{request.email}</span>
                          <span className="text-xs text-gray-400 mt-0.5 sm:hidden">{request.dept}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs font-normal text-gray-300 hidden sm:table-cell">
                        {request.dept}
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-500 font-normal hidden md:table-cell">
                        {new Date(request.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link
                          href="/admin/employees"
                          className="inline-flex items-center justify-center rounded-full border border-white/10 bg-[#12141A] px-3 sm:px-4 py-1.5 text-xs font-semibold text-gray-200 hover:bg-white/[0.03] transition-all cursor-pointer shadow-xs"
                        >
                          Evaluate
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}