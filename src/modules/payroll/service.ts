import { payrollRepository } from "@/repositories/payroll.repository";
import { employeeRepository } from "@/repositories/employee.repository";
import { companyRepository } from "@/repositories/company.repository";
import { attendanceRepository } from "@/repositories/attendance.repository";
import { auditRepository } from "@/repositories/audit.repository";
import { notificationRepository } from "@/repositories/notification.repository";
import { emailService } from "@/services/email";
import mongoose, { Types } from "mongoose";
import { format, getDaysInMonth } from "date-fns";

export class PayrollService {
  [x: string]: any;
  /**
   * Helper utility to convert a numeric month index to an English text descriptor.
   */
  private getMonthName(month: number): string {
    return format(new Date(2026, month - 1, 1), "MMMM");
  }

  /**
   * Generates or refreshes payroll for all active employees for the given period.
   * RELEASED slips are immutable and excluded from processing — once released, the
   * record is final and locked.
   */
  async generateMonthlyPayroll(adminUserId: string, month: number, year: number) {
    const companySettings = await companyRepository.get();
    if (!companySettings) {
      throw new Error("Company configuration must be defined before running the payroll engine.");
    }

    const activeEmployees = await employeeRepository.findActiveEmployees();
    if (activeEmployees.length === 0) {
      throw new Error("No active employees found for payroll processing.");
    }

    const processedRecords = [];
    let skippedReleased = 0;

    for (const employee of activeEmployees) {
      // ── IMMUTABILITY GUARD ──────────────────────────────────────────────
      // Released payroll for this period is final. Skip without touching it.
      const existing = await payrollRepository.findByEmployeeAndPeriod(
        employee._id.toString(), month, year
      );
      if (existing && existing.status === "RELEASED") {
        skippedReleased += 1;
        continue;
      }

      // ── ATTENDANCE WINDOW ──────────────────────────────────────────────
      const joiningDate = employee.joiningDate ? new Date(employee.joiningDate) : null;
      const isFirstMonth =
        joiningDate &&
        joiningDate.getFullYear() === year &&
        joiningDate.getMonth() === month - 1;
      const effectiveStartDate = isFirstMonth ? joiningDate : undefined;

      const summaryAggregation = await attendanceRepository.getMonthlySummary(
        employee._id.toString(), month, year, effectiveStartDate
      );
      const attendanceSummary = summaryAggregation[0] || {
        presentDays: 0, absentDays: 0, leaveDays: 0, halfDays: 0, holidays: 0,
        totalOvertimeHours: 0, totalUndertimeHours: 0, totalWorkHours: 0,
      };

      // ── EARNING COMPONENTS (admin enters these on Employee record) ─────
      // The admin enters Basic + each component. Gross = SUM of all components.
      const fullMonthDays = getDaysInMonth(new Date(year, month - 1));
      const workingDays = companySettings.defaultWorkingDays ?? 26;
      const proRateFactor = isFirstMonth && joiningDate
        ? (fullMonthDays - joiningDate.getDate() + 1) / fullMonthDays
        : 1;
      const r2 = (n: number) => parseFloat(n.toFixed(2));

      const basic = (employee.basicSalary ?? 0) * proRateFactor;

      // Respect global toggles for HRA, PF, PT, OT
      const hraOn = (companySettings.hraEnabled ?? true) && (employee.hraEnabled ?? false);
      const hra = hraOn ? (employee.hraAmount ?? 0) * proRateFactor : 0;

      const specialAllowance = (employee.specialAllowance ?? 0) * proRateFactor;
      const performancePay = (employee.performancePay ?? 0) * proRateFactor;
      const bonus = (employee.bonus ?? 0) * proRateFactor;
      const incentive = (employee.incentive ?? 0) * proRateFactor;
      const otherAllowances = (employee.otherAllowances ?? 0) * proRateFactor;

      // Overtime — only if globally enabled
      const otOn = companySettings.overtimeEnabled ?? true;
      const multiplier = employee.overtimeMultiplier || companySettings.overtimeMultiplier || 1.5;
      const dailyRate = (basic + hra + specialAllowance) / workingDays;
      const hourlyRate = dailyRate / (companySettings.workingHoursPolicy?.totalDailyHours || 9);
      const overtimePay = otOn
        ? r2(attendanceSummary.totalOvertimeHours * hourlyRate * multiplier)
        : 0;

      // ── GROSS = SUM OF ALL EARNINGS ────────────────────────────────────
      const gross = r2(
        basic + hra + specialAllowance + performancePay +
        bonus + incentive + otherAllowances + overtimePay
      );

      // ── DEDUCTIONS ─────────────────────────────────────────────────────
      // PF computed on basic (statutory rule), only if globally + per-employee enabled.
      const pfOn = (companySettings.pfEnabled ?? true) && (employee.pfEnabled ?? true);
      const pfDeduction = pfOn ? r2(basic * ((companySettings.pfPercentage ?? 12) / 100)) : 0;

      // Professional tax — fixed amount, only if globally enabled.
      const ptOn = companySettings.professionalTaxEnabled ?? true;
      const professionalTax = ptOn ? (companySettings.professionalTaxAmount ?? 0) : 0;

      // Income tax — % of gross.
      const taxDeduction = r2(gross * ((companySettings.taxPercentage ?? 0) / 100));

      // Leave & undertime deductions (chargeable leaves only).
      const freeLeavesAllowed = companySettings.maxLeavesPerMonth ?? 2;
      const chargeableLeaveDays = Math.max(0, (attendanceSummary.leaveDays || 0) - freeLeavesAllowed);
      const leaveDeduction = r2(
        (attendanceSummary.absentDays +
          chargeableLeaveDays +
          (attendanceSummary.halfDays || 0) * 0.5) *
          dailyRate
      );
      const undertimeDeduction = r2(attendanceSummary.totalUndertimeHours * hourlyRate);

      const totalDeductions = r2(
        pfDeduction + professionalTax + taxDeduction +
        leaveDeduction + undertimeDeduction
      );

      const netSalary = Math.max(0, r2(gross - totalDeductions));

      const payrollData = {
        employeeId: employee._id as mongoose.Types.ObjectId,
        month,
        year,
        status: "GENERATED" as const,
        earnings: {
          basicSalary: r2(basic),
          grossSalary: r2(basic),       // kept for backward compat
          hraAmount: r2(hra),
          specialAllowance: r2(specialAllowance),
          performancePay: r2(performancePay),
          bonus: r2(bonus),
          incentives: r2(incentive),
          otherAllowances: r2(otherAllowances),
          overtimePay,
          adjustments: 0,
          total: gross,
        },
        deductions: {
          undertimeDeduction,
          leaveDeduction,
          tax: taxDeduction,
          pf: pfDeduction,
          professionalTax,
          otherDeductions: 0,
          total: totalDeductions,
        },
        netSalary,
        attendanceSummary: {
          totalWorkingDays: workingDays,
          presentDays: attendanceSummary.presentDays,
          absentDays: attendanceSummary.absentDays,
          leaveDays: attendanceSummary.leaveDays,
          paidLeaveDays: Math.min(attendanceSummary.leaveDays || 0, freeLeavesAllowed),
          chargeableLeaveDays,
          halfDays: attendanceSummary.halfDays,
          overtimeHours: attendanceSummary.totalOvertimeHours,
          undertimeHours: attendanceSummary.totalUndertimeHours,
        },
        generatedAt: new Date(),
        generatedBy: new Types.ObjectId(adminUserId) as any,
      };

      const record = await payrollRepository.upsert(
        employee._id.toString(), month, year, payrollData
      );
      processedRecords.push(record);
    }

    await auditRepository.log(
      adminUserId,
      "SALARY_GENERATED",
      `Payroll engine ran for ${this.getMonthName(month)} ${year}. Processed: ${processedRecords.length}, locked (already released): ${skippedReleased}.`
    );

    return { processedCount: processedRecords.length, skippedReleased };
  }

  /**
   * Advances individual generated accounts past verification parameters into APPROVED status states.
   */
  async approvePayroll(adminUserId: string, payrollId: string) {
    const record = await payrollRepository.findById(payrollId);
    if (!record || record.status !== "GENERATED") {
      throw new Error("Target payroll slip must reside within a valid GENERATED phase state to trigger approval.");
    }

    const updated = await payrollRepository.updateStatus(payrollId, "APPROVED", {
      approvedAt: new Date(),
      approvedBy: new Types.ObjectId(adminUserId) as any,
    });

    await auditRepository.log(
      adminUserId,
      "SALARY_APPROVED",
      `Payroll item entry reference ID ${payrollId} authorized for onward transmission.`
    );

    return updated;
  }

  /**
   * Finalizes accounts by triggering RELEASED status states, updating data visualization, and sending notification emails.
   */
  async releasePayroll(adminUserId: string, payrollId: string) {
    const record = await payrollRepository.findById(payrollId);
    if (!record || record.status !== "APPROVED") {
      throw new Error("Target payroll slip must be structurally APPROVED prior to dispatch release execution operations.");
    }

    const employee = await employeeRepository.findById(record.employeeId.toString());
    if (!employee) throw new Error("Linked employee reference document mapping is corrupted or unresolvable.");

    const updated = await payrollRepository.updateStatus(payrollId, "RELEASED", {
      releasedAt: new Date(),
      releasedBy: new Types.ObjectId(adminUserId) as any,
    });

    const periodMonthName = this.getMonthName(record.month);

    // 1. Dispatch in-app alerts system payload items
    await notificationRepository.create({
      userId: employee.userId as mongoose.Types.ObjectId,
      type: "SALARY_RELEASED",
      title: "Salary Slip Dispatched",
      message: `Your official corporate earnings payslip documentation for ${periodMonthName} ${record.year} is now online.`,
    });

    // 2. Dispatch external mail components cleanly
    emailService.sendPayrollReleasedEmail(
      employee.email,
      employee.fullName,
      periodMonthName,
      record.year
    ).catch(err => console.error("Transactional salary alert mail routine failed to execute:", err));

    await auditRepository.log(
      adminUserId,
      "SALARY_RELEASED",
      `Payslip ledger issued securely to employee user profile ${employee.fullName} for period ${periodMonthName} ${record.year}.`
    );

    return updated;
  }

  /**
   * Resolves safe restricted ledger queries checking user role clearances.
   */
  async getEmployeePayslipArchive(userId: string) {
    const employee = await employeeRepository.findByUserId(userId);
    if (!employee) throw new Error("Worker data matching session references cannot be extracted.");

    // Strict constraint rule check validation protection logic enforcement: Employees only see RELEASED slips
    return payrollRepository.findReleasedByEmployee(employee._id.toString());
  }
}

export const payrollService = new PayrollService();