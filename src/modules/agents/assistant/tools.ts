import { connectDB } from "@/lib/db";
import { leaveRepository } from "@/repositories/leave.repository";
import { attendanceRepository } from "@/repositories/attendance.repository";
import { payrollRepository } from "@/repositories/payroll.repository";
import { companyRepository } from "@/repositories/company.repository";
import type { ToolHandler } from "@/modules/agents/shared/ai-client";
import type { IEmployee, IHoliday } from "@/lib/models";

/**
 * Company-wide policy lookup — the only tool that doesn't depend on an
 * employee profile, so it's also offered to admins (who authenticate via
 * `ADMIN_EMAILS` and have no `Employee` record of their own).
 */
const getCompanyPolicyTool: ToolHandler = {
  definition: {
    type: "function",
    function: {
      name: "getCompanyPolicy",
      description:
        "Returns company policy information — working hours, working days, weekly off days, leave allowance, and upcoming holidays. Use this to answer questions about office timings, leave rules, or holidays.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  handler: async () => {
    await connectDB();
    const company = await companyRepository.get();
    if (!company) {
      return { message: "Company policy settings have not been configured yet." };
    }

    const now = new Date();
    const upcomingHolidays = (company.holidays ?? [])
      .filter((h: IHoliday) => new Date(h.date) >= now)
      .sort((a: IHoliday, b: IHoliday) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5)
      .map((h: IHoliday) => ({ date: h.date, name: h.name }));

    return {
      companyName: company.name,
      maxLeavesPerMonth: company.maxLeavesPerMonth,
      workingHours: {
        officeStartTime: company.workingHoursPolicy?.officeStartTime,
        officeEndTime: company.workingHoursPolicy?.officeEndTime,
        workingDays: company.workingHoursPolicy?.workingDays,
        weeklyOff: company.workingHoursPolicy?.weeklyOff,
        totalDailyHours: company.workingHoursPolicy?.totalDailyHours,
      },
      upcomingHolidays,
    };
  },
};

/**
 * Tool registry for an authenticated admin who has no `Employee` profile —
 * limited to company-wide knowledge, since there is no personal HR data
 * (leave/attendance/payroll) to scope a lookup to.
 */
export function buildAdminAssistantTools(): ToolHandler[] {
  return [getCompanyPolicyTool];
}

/**
 * Tool registry for the Assistant Agent. Every employee-scoped tool is bound
 * to a single employee (`employee` is resolved at request time) so the model
 * can never reach across to another person's HR data — it can only ask about
 * the person it is currently chatting with.
 */
export function buildAssistantTools(employee: IEmployee & { _id: unknown }): ToolHandler[] {
  const employeeId = (employee._id as { toString(): string }).toString();

  return [
    {
      definition: {
        type: "function",
        function: {
          name: "getLeaveSummary",
          description:
            "Returns the employee's leave balance and recent leave request history, derived from their approved leave days this year and the company's monthly leave allowance.",
          parameters: { type: "object", properties: {}, additionalProperties: false },
        },
      },
      handler: async () => {
        await connectDB();
        const [recentRequests, approvedDaysThisYear, company] = await Promise.all([
          leaveRepository.findByEmployeeId(employeeId, { limit: 5 }),
          leaveRepository.approvedDaysThisYear(employeeId),
          companyRepository.get(),
        ]);

        const maxLeavesPerMonth = company?.maxLeavesPerMonth ?? 2;
        const annualAllowance = maxLeavesPerMonth * 12;
        const remainingDays = Math.max(annualAllowance - approvedDaysThisYear, 0);

        return {
          annualAllowanceDays: annualAllowance,
          approvedDaysTakenThisYear: approvedDaysThisYear,
          remainingDaysThisYear: remainingDays,
          recentRequests: recentRequests.map(r => ({
            leaveType: r.leaveType,
            fromDate: r.fromDate,
            toDate: r.toDate,
            totalDays: r.totalDays,
            status: r.status,
            reason: r.reason,
          })),
        };
      },
    },
    {
      definition: {
        type: "function",
        function: {
          name: "getAttendanceSummary",
          description:
            "Returns the employee's attendance summary (present/absent/leave/half-day counts and work hours) for a given month and year.",
          parameters: {
            type: "object",
            properties: {
              month: { type: "number", description: "Month number, 1-12. Defaults to the current month." },
              year: { type: "number", description: "Four-digit year. Defaults to the current year." },
            },
            additionalProperties: false,
          },
        },
      },
      handler: async (args) => {
        await connectDB();
        const now = new Date();
        const month = typeof args.month === "number" ? args.month : now.getMonth() + 1;
        const year = typeof args.year === "number" ? args.year : now.getFullYear();

        const [summary] = await attendanceRepository.getMonthlySummary(employeeId, month, year);
        if (!summary) {
          return { month, year, message: "No attendance records found for this period." };
        }

        return {
          month,
          year,
          presentDays: summary.presentDays,
          absentDays: summary.absentDays,
          leaveDays: summary.leaveDays,
          halfDays: summary.halfDays,
          holidays: summary.holidays,
          totalOvertimeHours: summary.totalOvertimeHours,
          totalUndertimeHours: summary.totalUndertimeHours,
          totalWorkHours: summary.totalWorkHours,
        };
      },
    },
    {
      definition: {
        type: "function",
        function: {
          name: "getLatestPayslip",
          description:
            "Returns the employee's most recently released payslip — including net salary, gross salary, and the period it covers. Only RELEASED payslips are visible to employees.",
          parameters: { type: "object", properties: {}, additionalProperties: false },
        },
      },
      handler: async () => {
        await connectDB();
        const released = await payrollRepository.findReleasedByEmployee(employeeId);
        const latest = released[0];
        if (!latest) {
          return { message: "No released payslips are available for this employee yet." };
        }

        return {
          month: latest.month,
          year: latest.year,
          grossSalary: latest.grossSalary,
          netSalary: latest.netSalary,
          releasedAt: latest.releasedAt,
          totalReleasedPayslips: released.length,
        };
      },
    },
    getCompanyPolicyTool,
  ];
}
