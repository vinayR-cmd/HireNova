"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sparkles, Users, TrendingUp, Wallet, CalendarClock, Loader2, AlertCircle,
  ThumbsUp, AlertTriangle, Info,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { apiFetch } from "@/lib/api-fetch";

interface WorkforceAnalytics {
  generatedAt: string;
  trendWindowMonths: number;
  totalActiveEmployees: number;
  departmentDistribution: Array<{ department: string; headcount: number }>;
  headcountGrowth: Array<{ period: string; newJoiners: number }>;
  attendanceTrend: Array<{
    period: string; presentDays: number; absentDays: number; leaveDays: number;
    totalOvertimeHours: number; attendanceRatePercent: number;
  }>;
  payrollTrend: Array<{ period: string; totalGross: number; totalNet: number; totalDeductions: number; employeesPaid: number }>;
  leaveUtilization: Array<{ leaveType: string; status: string; requestCount: number; totalDays: number }>;
  aiInsights: Array<{ title: string; detail: string; tone: "POSITIVE" | "NEUTRAL" | "WARNING" }>;
  aiSummary: string | null;
}

const DEPARTMENT_COLORS = ["#111111", "oklch(0.55 0.2 291)", "#94A3B8", "#EA4335", "#10B981", "#F59E0B", "#8B5CF6"];

const TONE_STYLES: Record<string, { icon: typeof ThumbsUp; classes: string }> = {
  POSITIVE: { icon: ThumbsUp, classes: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" },
  WARNING: { icon: AlertTriangle, classes: "border-amber-500/20 bg-amber-500/10 text-amber-400" },
  NEUTRAL: { icon: Info, classes: "border-white/10 bg-white/[0.03] text-gray-300" },
};

function formatIndianCurrency(value: number) {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)} L`;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export default function WorkforceAnalyticsPage() {
  const [data, setData] = useState<WorkforceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/agents/analytics/workforce");
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to load workforce analytics.");
      setData(payload.data);
    } catch (err: any) {
      setError(err.message || "Failed to load workforce analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const kpis = [
    { label: "Active Workforce", value: data?.totalActiveEmployees ?? "—", icon: Users },
    {
      label: "Avg. Attendance Rate",
      value: data?.attendanceTrend.length
        ? `${(data.attendanceTrend.reduce((s, a) => s + a.attendanceRatePercent, 0) / data.attendanceTrend.length).toFixed(1)}%`
        : "—",
      icon: TrendingUp,
    },
    {
      label: "Latest Payroll Net",
      value: data?.payrollTrend.length ? formatIndianCurrency(data.payrollTrend[data.payrollTrend.length - 1].totalNet) : "—",
      icon: Wallet,
    },
    {
      label: "Trend Window",
      value: data ? `${data.trendWindowMonths} months` : "—",
      icon: CalendarClock,
    },
  ];

  return (
    <div className="space-y-8 sm:space-y-10 max-w-7xl mx-auto text-white transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)]">

      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-2 rounded-full border border-[oklch(0.62_0.21_291)]/20 bg-[oklch(0.62_0.21_291)]/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.62_0.21_291)]">
          <Sparkles className="h-3 w-3" /> Workforce Analytics Agent
        </div>
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-white">Workforce Intelligence</h1>
        <p className="text-xs sm:text-sm text-gray-400 font-normal max-w-2xl">
          Headcount, attendance, payroll, and leave trends across the company — distilled into AI-narrated insights for HR leadership.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 flex items-center gap-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-gray-500"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : data ? (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map(kpi => (
              <div key={kpi.label} className="rounded-2xl border border-white/10 bg-[#12141A] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.35)] flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-[oklch(0.62_0.21_291)]/10 flex items-center justify-center shrink-0">
                  <kpi.icon className="h-4.5 w-4.5 text-[oklch(0.62_0.21_291)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium truncate">{kpi.label}</p>
                  <p className="text-lg font-semibold text-white truncate">{kpi.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* AI Insights Panel */}
          <div className="rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[oklch(0.62_0.21_291)]" />
              <h3 className="font-semibold text-white text-base tracking-tight">AI Insights</h3>
            </div>
            {data.aiSummary && <p className="text-sm text-gray-300 leading-relaxed">{data.aiSummary}</p>}
            {data.aiInsights.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {data.aiInsights.map((insight, idx) => {
                  const tone = TONE_STYLES[insight.tone] || TONE_STYLES.NEUTRAL;
                  const ToneIcon = tone.icon;
                  return (
                    <div key={idx} className={`rounded-xl border p-4 space-y-1.5 ${tone.classes}`}>
                      <div className="flex items-center gap-2">
                        <ToneIcon className="h-3.5 w-3.5 shrink-0" />
                        <p className="text-sm font-semibold">{insight.title}</p>
                      </div>
                      <p className="text-xs leading-relaxed opacity-90">{insight.detail}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-500">AI insights are unavailable right now — the numeric trends below are still live.</p>
            )}
          </div>

          {/* Charts grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
              <h3 className="font-semibold text-white text-base tracking-tight mb-1">Department Distribution</h3>
              <p className="text-xs text-gray-500 font-normal mb-4">Active headcount split across departments.</p>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={data.departmentDistribution} dataKey="headcount" nameKey="department" cx="50%" cy="50%" innerRadius={64} outerRadius={92} paddingAngle={2}>
                    {data.departmentDistribution.map((entry, index) => (
                      <Cell key={entry.department} fill={DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
              <h3 className="font-semibold text-white text-base tracking-tight mb-1">Headcount Growth</h3>
              <p className="text-xs text-gray-500 font-normal mb-4">New joiners per month, last {data.trendWindowMonths} months.</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.headcountGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }} />
                  <Bar dataKey="newJoiners" name="New Joiners" fill="oklch(0.55 0.2 291)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
              <h3 className="font-semibold text-white text-base tracking-tight mb-1">Attendance Rate & Overtime</h3>
              <p className="text-xs text-gray-500 font-normal mb-4">Company-wide presence rate and overtime hours, monthly.</p>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Line type="monotone" dataKey="attendanceRatePercent" name="Attendance Rate (%)" stroke="#111111" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="totalOvertimeHours" name="Overtime Hours" stroke="oklch(0.55 0.2 291)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
              <h3 className="font-semibold text-white text-base tracking-tight mb-1">Payroll Cost Trend</h3>
              <p className="text-xs text-gray-500 font-normal mb-4">Net salary outlay per period, last {data.trendWindowMonths} payroll cycles.</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.payrollTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={formatIndianCurrency} />
                  <Tooltip
                    formatter={(value) => formatIndianCurrency(Number(value))}
                    contentStyle={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}
                  />
                  <Bar dataKey="totalNet" name="Net Payout" fill="#111111" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Leave utilization table */}
          <div className="rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
            <h3 className="font-semibold text-white text-base tracking-tight mb-1">Leave Utilization</h3>
            <p className="text-xs text-gray-500 font-normal mb-4">Requests and total days by leave type and approval status, last {data.trendWindowMonths} months.</p>
            {data.leaveUtilization.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500 border-b border-white/8">
                      <th className="py-2.5 font-medium">Leave Type</th>
                      <th className="py-2.5 font-medium">Status</th>
                      <th className="py-2.5 font-medium text-right">Requests</th>
                      <th className="py-2.5 font-medium text-right">Total Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.leaveUtilization.map((row, idx) => (
                      <tr key={idx} className="border-b border-white/5 last:border-0">
                        <td className="py-2.5 text-gray-100 font-medium">{row.leaveType}</td>
                        <td className="py-2.5 text-gray-400">{row.status}</td>
                        <td className="py-2.5 text-right text-gray-100">{row.requestCount}</td>
                        <td className="py-2.5 text-right text-gray-100">{row.totalDays}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-gray-500">No leave requests recorded in this window.</p>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
