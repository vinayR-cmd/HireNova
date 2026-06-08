import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { attendanceService } from "@/modules/attendance/service";
import { verifyAccessToken } from "@/lib/jwt";
import { Info, HelpCircle } from "lucide-react";
import { AttendanceFilterForm } from "@/components/shared/attendance-filter-form";
import Link from "next/link";

export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ month?: string; year?: string; view?: string }>;
}

const STATUS_STYLE: Record<string, string> = {
  PRESENT:  "bg-white/[0.05] text-gray-100 border-white/5",
  HALF_DAY: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  LEAVE:    "bg-white/[0.07] text-gray-300 border-white/10",
  HOLIDAY:  "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ABSENT:   "bg-rose-500/15 text-rose-400 border-rose-500/20",
};

const CELL_BG: Record<string, string> = {
  PRESENT:  "border-white/15 hover:border-white/20",
  HALF_DAY: "border-amber-500/20 bg-amber-500/10 hover:border-amber-300",
  ABSENT:   "border-rose-500/20 bg-rose-500/10 hover:border-rose-500/20",
  LEAVE:    "border-white/10 bg-white/[0.04] hover:border-white/15",
  HOLIDAY:  "border-dashed border-white/15 bg-white/[0.02]",
};

const STATUS_LABEL: Record<string, string> = {
  PRESENT: "Present", HALF_DAY: "Half Day", ABSENT: "Absent",
  LEAVE: "On Leave", HOLIDAY: "Holiday",
};

export default async function EmployeeAttendancePage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get("recruitiq_access")?.value;
  const session = token ? verifyAccessToken(token) : null;
  if (!session) redirect("/login");

  const today = new Date();
  const currentMonth = resolvedParams.month ? parseInt(resolvedParams.month, 10) : today.getMonth() + 1;
  const currentYear  = resolvedParams.year  ? parseInt(resolvedParams.year,  10) : today.getFullYear();
  const currentView  = resolvedParams.view  || "calendar";

  const { ledger, summary, payslipReleaseDates } = await attendanceService.getEmployeeMonthlyLedger(
    session.userId, currentMonth, currentYear
  );

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2026, i, 1).toLocaleString("en-US", { month: "long" }),
  }));

  const formatTime = (dateString?: Date) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  const firstDayOfMonthIndex = new Date(currentYear, currentMonth - 1, 1).getDay();
  const daysInCurrentMonth   = new Date(currentYear, currentMonth, 0).getDate();
  const totalGridCells       = Math.ceil((firstDayOfMonthIndex + daysInCurrentMonth) / 7) * 7;

  const calendarCells = Array.from({ length: totalGridCells }, (_, i) => {
    const dayNumber = i - firstDayOfMonthIndex + 1;
    if (dayNumber < 1 || dayNumber > daysInCurrentMonth) return null;
    const iso = new Date(currentYear, currentMonth - 1, dayNumber).toISOString().split("T")[0];
    const record   = ledger.find((d: any) => new Date(d.date).toISOString().split("T")[0] === iso) || null;
    const payslip  = payslipReleaseDates.find((p: any) => p.date === iso) || null;
    return { dayNumber, iso, record, payslip };
  });

  // Ordered list of days (no nulls) for mobile list view
  const daysList = calendarCells.filter(Boolean) as NonNullable<typeof calendarCells[number]>[];

  const weekHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6 sm:space-y-10 max-w-7xl mx-auto text-white relative z-0">

      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between relative z-10">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-white">My Attendance Logs</h1>
          <p className="text-sm text-gray-400 font-normal">Review daily shift punches, total work hours, and compliance breakdowns.</p>
        </div>
        <AttendanceFilterForm currentMonth={currentMonth} currentYear={currentYear} monthOptions={monthOptions} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-5 relative z-0">
        {[
          { title: "Present",    value: summary.presentDays,          color: "text-white" },
          { title: "Half Days",  value: summary.halfDays,             color: "text-amber-400" },
          { title: "Absences",   value: summary.absentDays,           color: "text-rose-400" },
          { title: "On Leave",   value: summary.leaveDays,            color: "text-gray-400" },
          { title: "Overtime",   value: `${summary.totalOvertimeHours}h`, color: "text-[oklch(0.62_0.21_291)]" },
        ].map((card, idx) => (
          <div key={idx} className="rounded-2xl border border-white/10 bg-[#12141A] p-4 sm:p-5 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">{card.title}</span>
            <span className={`text-xl sm:text-2xl font-semibold tracking-tight ${card.color} mt-1 block`}>{card.value}</span>
          </div>
        ))}
      </div>

      {currentView === "calendar" ? (
        <div className="rounded-2xl border border-white/10 bg-[#12141A] shadow-[0_12px_30px_rgba(0,0,0,0.35)] overflow-hidden relative z-0">

          {/* ── DESKTOP calendar (sm+) ── */}
          <div className="hidden sm:block p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-7 gap-2 text-center border-b border-white/8 pb-3">
              {weekHeaders.map((d, i) => (
                <span key={i} className="text-xs font-semibold tracking-wide text-gray-500 uppercase">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {calendarCells.map((cell, idx) => {
                if (!cell) return <div key={`e-${idx}`} className="bg-white/[0.02] rounded-xl min-h-[90px] lg:min-h-[105px] border border-transparent" />;
                const { dayNumber, record, payslip } = cell;
                const s = record?.status as string | undefined;
                return (
                  <div
                    key={`d-${dayNumber}`}
                    className={`group relative rounded-xl border p-2 lg:p-3.5 min-h-[90px] lg:min-h-[105px] flex flex-col justify-between transition-all duration-200 bg-[#12141A] ${s ? CELL_BG[s] : "border-white/10"} ${payslip ? "ring-1 ring-emerald-300/60" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-white">{dayNumber}</span>
                      {s && (
                        <span className={`text-[8px] lg:text-[9px] uppercase font-bold tracking-wider px-1 lg:px-1.5 py-0.5 rounded-md border ${STATUS_STYLE[s]}`}>
                          {s === "HALF_DAY" ? "½" : s === "HOLIDAY" ? "Hol" : s.slice(0, 3)}
                        </span>
                      )}
                    </div>
                    {record && (s === "PRESENT" || s === "HALF_DAY") && (
                      <div className="space-y-0.5 mt-2">
                        <div className="flex justify-between text-[9px] lg:text-[10px] font-mono text-gray-500">
                          <span>{formatTime(record.checkIn)}</span>
                          <span>{formatTime(record.checkOut)}</span>
                        </div>
                        <div className="text-[10px] lg:text-xs font-semibold text-gray-100 flex justify-between">
                          <span>{record.workHours}h</span>
                          {record.overtimeHours > 0 && <span className="text-[9px] text-emerald-400 font-bold">+{record.overtimeHours}OT</span>}
                        </div>
                      </div>
                    )}
                    {(!record || (s !== "PRESENT" && s !== "HALF_DAY")) && (
                      <div className="text-[9px] text-gray-500 font-normal mt-auto italic">
                        {s === "HOLIDAY" ? "Holiday" : s === "LEAVE" ? "Leave" : ""}
                      </div>
                    )}
                    {payslip && (
                      <Link href={`/employee/payroll/${payslip.slipId}`} className="mt-1.5 flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-1 lg:px-1.5 py-0.5 text-[8px] lg:text-[9px] font-semibold text-emerald-400 hover:bg-emerald-500/15 transition-colors">
                        <span className="text-emerald-500">₹</span>
                        <span className="truncate hidden lg:inline">Payslip</span>
                        <span className="truncate lg:hidden">Pay</span>
                      </Link>
                    )}
                    {record?.remarks && (
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <div className="relative group/tooltip">
                          <HelpCircle className="h-3 w-3 text-gray-500 hover:text-white cursor-help" />
                          <div className="absolute right-0 bottom-full mb-2 w-44 bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] text-white text-[10px] p-2 rounded-lg shadow-xl pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-opacity leading-normal">
                            {record.remarks}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── MOBILE list view (< sm) ── */}
          <div className="sm:hidden divide-y border-white/8">
            {daysList.length === 0 ? (
              <p className="py-12 text-center text-xs text-gray-500">No records this month.</p>
            ) : daysList.map(({ dayNumber, iso, record, payslip }) => {
              const s = record?.status as string | undefined;
              const weekday = new Date(iso).toLocaleDateString("en-US", { weekday: "short" });
              return (
                <div key={iso} className={`flex items-center gap-3 px-4 py-3 ${s === "ABSENT" ? "bg-rose-500/10" : s === "HALF_DAY" ? "bg-amber-500/10" : ""}`}>
                  {/* Date pill */}
                  <div className="w-10 shrink-0 text-center">
                    <span className="block text-[10px] font-bold text-gray-500 uppercase">{weekday}</span>
                    <span className="block text-base font-semibold text-white leading-tight">{dayNumber}</span>
                  </div>
                  {/* Status + times */}
                  <div className="flex-1 min-w-0">
                    {s ? (
                      <>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${STATUS_STYLE[s]}`}>
                          {STATUS_LABEL[s] || s}
                        </span>
                        {(s === "PRESENT" || s === "HALF_DAY") && record && (
                          <span className="ml-2 text-[10px] font-mono text-gray-500">
                            {formatTime(record.checkIn)} – {formatTime(record.checkOut)}
                            {record.workHours > 0 && <span className="ml-1 text-gray-300 font-semibold">{record.workHours}h</span>}
                            {record.overtimeHours > 0 && <span className="ml-1 text-emerald-400 font-bold">+{record.overtimeHours}OT</span>}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-[11px] text-gray-600">—</span>
                    )}
                    {payslip && (
                      <Link href={`/employee/payroll/${payslip.slipId}`} className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        ₹ Payslip
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      ) : (
        /* Table view — already responsive via overflow-x-auto */
        <div className="rounded-2xl border border-white/10 bg-[#12141A] overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.35)] relative z-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-white/[0.05] text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 sm:px-6 sm:py-4">Date</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4">In</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4">Out</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 hidden sm:table-cell">Hours</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-center">Status</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 hidden md:table-cell">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y border-white/8 font-medium text-gray-200">
                {ledger.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-xs text-gray-500">No records for this period.</td></tr>
                ) : (
                  ledger.map((day: any) => (
                    <tr key={day._id.toString()} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 sm:px-6 sm:py-4 text-white font-medium text-xs">
                        {new Date(day.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 font-mono text-xs text-gray-400">{formatTime(day.checkIn)}</td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 font-mono text-xs text-gray-400">{formatTime(day.checkOut)}</td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 text-white font-semibold text-xs hidden sm:table-cell">
                        {day.workHours > 0 ? `${day.workHours}h` : "—"}
                        {day.overtimeHours > 0 && <span className="block text-[10px] text-emerald-400">+{day.overtimeHours}h OT</span>}
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${STATUS_STYLE[day.status] || ""}`}>
                          {STATUS_LABEL[day.status] || day.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 text-xs text-gray-500 max-w-[160px] truncate hidden md:table-cell">{day.remarks || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notice */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 sm:p-5 flex items-start gap-3.5 text-xs text-gray-400 leading-relaxed relative z-0">
        <Info className="h-4 w-4 text-white shrink-0 mt-0.5" />
        <div>
          <strong className="text-white font-semibold block mb-0.5">Discrepancy Correction Protocol</strong>
          If you spot a missing log entry or calculation error, contact the HR operations desk. Admins can apply historical corrections via the override tool.
        </div>
      </div>
    </div>
  );
}
