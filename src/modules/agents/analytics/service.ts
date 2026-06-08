import { connectDB } from "@/lib/db";
import { employeeRepository } from "@/repositories/employee.repository";
import { attendanceRepository } from "@/repositories/attendance.repository";
import { payrollRepository } from "@/repositories/payroll.repository";
import { leaveRepository } from "@/repositories/leave.repository";
import { chatJSON } from "@/modules/agents/shared/ai-client";
import { WORKFORCE_INSIGHTS_SYSTEM_PROMPT, buildWorkforceInsightsUserPrompt } from "./prompts";
import { format, subMonths, startOfMonth } from "date-fns";

const TREND_WINDOW_MONTHS = 6;

type InsightTone = "POSITIVE" | "NEUTRAL" | "WARNING";

interface WorkforceInsightsResult {
  insights: Array<{ title: string; detail: string; tone: InsightTone }>;
  summary: string;
}

function periodLabel(year: number, month: number): string {
  return format(new Date(year, month - 1, 1), "MMM yyyy");
}

export class AnalyticsAgentService {
  /**
   * Aggregates company-wide workforce metrics, then asks the model to turn
   * the numeric snapshot into narrative insights. The numbers are always
   * computed deterministically by Mongo aggregations — the AI only narrates.
   */
  async getWorkforceAnalytics() {
    await connectDB();

    const windowStart = startOfMonth(subMonths(new Date(), TREND_WINDOW_MONTHS - 1));

    const [departmentRaw, headcountRaw, attendanceRaw, payrollRaw, leaveRaw, totalActive] = await Promise.all([
      employeeRepository.getDepartmentDistribution(),
      employeeRepository.getHeadcountGrowth(TREND_WINDOW_MONTHS, windowStart),
      attendanceRepository.getCompanyMonthlyTrend(windowStart),
      payrollRepository.getPayrollTrend(TREND_WINDOW_MONTHS),
      leaveRepository.getUtilizationByType(windowStart),
      employeeRepository.count({ employmentStatus: "ACTIVE" }),
    ]);

    const departmentDistribution = (departmentRaw as Array<{ _id: string; count: number }>).map(d => ({
      department: d._id,
      headcount: d.count,
    }));

    const headcountGrowth = (headcountRaw as Array<{ _id: { year: number; month: number }; newJoiners: number }>).map(h => ({
      period: periodLabel(h._id.year, h._id.month),
      newJoiners: h.newJoiners,
    }));

    const attendanceTrend = (
      attendanceRaw as Array<{
        _id: { year: number; month: number };
        presentDays: number;
        absentDays: number;
        leaveDays: number;
        totalOvertimeHours: number;
        totalRecords: number;
      }>
    ).map(a => ({
      period: periodLabel(a._id.year, a._id.month),
      presentDays: a.presentDays,
      absentDays: a.absentDays,
      leaveDays: a.leaveDays,
      totalOvertimeHours: Math.round(a.totalOvertimeHours * 10) / 10,
      attendanceRatePercent: a.totalRecords > 0 ? Math.round((a.presentDays / a.totalRecords) * 1000) / 10 : 0,
    }));

    const payrollTrend = (
      payrollRaw as Array<{
        _id: { year: number; month: number };
        totalGross: number;
        totalNet: number;
        totalDeductions: number;
        employeeCount: number;
      }>
    ).map(p => ({
      period: periodLabel(p._id.year, p._id.month),
      totalGross: Math.round(p.totalGross),
      totalNet: Math.round(p.totalNet),
      totalDeductions: Math.round(p.totalDeductions),
      employeesPaid: p.employeeCount,
    }));

    const leaveUtilization = (
      leaveRaw as Array<{ _id: { leaveType: string; status: string }; requestCount: number; totalDays: number }>
    ).map(l => ({
      leaveType: l._id.leaveType,
      status: l._id.status,
      requestCount: l.requestCount,
      totalDays: l.totalDays,
    }));

    const snapshot = {
      generatedAt: new Date().toISOString(),
      trendWindowMonths: TREND_WINDOW_MONTHS,
      totalActiveEmployees: totalActive,
      departmentDistribution,
      headcountGrowth,
      attendanceTrend,
      payrollTrend,
      leaveUtilization,
    };

    let aiInsights: WorkforceInsightsResult | null = null;
    try {
      aiInsights = await chatJSON<WorkforceInsightsResult>({
        system: WORKFORCE_INSIGHTS_SYSTEM_PROMPT,
        user: buildWorkforceInsightsUserPrompt(snapshot),
      });
    } catch (error) {
      console.error("Workforce Analytics Agent: AI insight generation failed:", error);
    }

    return {
      ...snapshot,
      aiInsights: aiInsights?.insights ?? [],
      aiSummary: aiInsights?.summary ?? null,
    };
  }
}

export const analyticsAgentService = new AnalyticsAgentService();
