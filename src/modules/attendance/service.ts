import { attendanceRepository } from "@/repositories/attendance.repository";
import { companyRepository } from "@/repositories/company.repository";
import { employeeRepository } from "@/repositories/employee.repository";
import { auditRepository } from "@/repositories/audit.repository";
import { payrollRepository } from "@/repositories/payroll.repository";
import { customDayRepository } from "@/repositories/custom-day.repository";
import { startOfDay, differenceInMinutes, parse, format } from "date-fns";

export class AttendanceService {
  /**
   * Helper to compute decimal hour values from minute intervals
   */
  private convertMinutesToHours(minutes: number): number {
    return parseFloat((minutes / 60).toFixed(2));
  }

  /**
   * Resolves the shift policy and working window parameters for a specific date.
   */
  async getShiftPolicyForDate(date: Date) {
    const day = startOfDay(new Date(date));
    const customDay = await customDayRepository.findByDate(day);
    if (customDay) {
      return {
        officeStartTime: customDay.officeStartTime || "09:00",
        officeEndTime: customDay.officeEndTime || "18:00",
        totalDailyHours: customDay.totalDailyHours ?? 9,
        isHoliday: customDay.isHoliday,
        holidayName: customDay.holidayName,
      };
    }

    const companySettings = await companyRepository.get();
    const dayStr = day.getTime();
    const holiday = companySettings?.holidays?.find(
      (h: any) => startOfDay(new Date(h.date)).getTime() === dayStr
    );
    if (holiday) {
      return {
        officeStartTime: companySettings?.workingHoursPolicy?.officeStartTime || "09:00",
        officeEndTime: companySettings?.workingHoursPolicy?.officeEndTime || "18:00",
        totalDailyHours: companySettings?.workingHoursPolicy?.totalDailyHours || 9,
        isHoliday: true,
        holidayName: holiday.name,
      };
    }

    return {
      officeStartTime: companySettings?.workingHoursPolicy?.officeStartTime || "09:00",
      officeEndTime: companySettings?.workingHoursPolicy?.officeEndTime || "18:00",
      totalDailyHours: companySettings?.workingHoursPolicy?.totalDailyHours || 9,
      isHoliday: false,
    };
  }

  /**
   * Recalculates overtime, undertime, work hours and status for all employee attendance records
   * on a given date based on a new target daily hours policy limit.
   */
  async recalculateAttendanceForDate(date: Date, targetDailyHours: number) {
    const day = startOfDay(new Date(date));
    const records = await attendanceRepository.findByDate(day);
    for (const record of records) {
      if (record.checkIn && record.checkOut) {
        const checkInTime = new Date(record.checkIn);
        const checkOutTime = new Date(record.checkOut);
        const totalWorkMinutes = differenceInMinutes(checkOutTime, checkInTime);
        const totalWorkHours = this.convertMinutesToHours(totalWorkMinutes);

        let overtimeHours = 0;
        let undertimeHours = 0;

        if (totalWorkHours > targetDailyHours) {
          overtimeHours = parseFloat((totalWorkHours - targetDailyHours).toFixed(2));
        } else if (totalWorkHours < targetDailyHours) {
          undertimeHours = parseFloat((targetDailyHours - totalWorkHours).toFixed(2));
        }

        let status: "PRESENT" | "HALF_DAY" | "ABSENT" = "PRESENT";
        if (totalWorkHours < targetDailyHours * 0.5) {
          status = "ABSENT";
        } else if (totalWorkHours < targetDailyHours) {
          status = "HALF_DAY";
        }

        await attendanceRepository.update(record._id.toString(), {
          workHours: totalWorkHours,
          overtimeHours,
          undertimeHours,
          status,
        });
      }
    }
  }

  /**
   * Records a daily check-in timestamp for an employee worker profile.
   */
  async checkIn(userId: string) {
    const employee = await employeeRepository.findByUserId(userId);
    if (!employee || employee.employmentStatus !== "ACTIVE") {
      throw new Error("Active employee profile context could not be resolved.");
    }

    const today = new Date();
    const existingRecord = await attendanceRepository.findByEmployeeAndDate(
      employee._id.toString(),
      today
    );

    if (existingRecord?.checkIn) {
      throw new Error("An existing check-in event timestamp has already been committed for today.");
    }

    // Default status setting for a direct check-in invocation
    const checkInData = {
      employeeId: employee._id as any,
      date: startOfDay(today),
      checkIn: today,
      status: "PRESENT" as const,
      remarks: "Self check-in via web application dashboard portal.",
    };

    const attendance = await attendanceRepository.upsert(
      employee._id.toString(),
      today,
      checkInData
    );

    await auditRepository.log(
      userId,
      "ATTENDANCE_MARKED",
      `Employee check-in logged for ${employee.fullName} at ${format(today, "HH:mm:ss")}`
    );

    return attendance;
  }

  /**
   * Records a check-out timestamp and computes hours, overtime, and undertime metrics.
   */
  async checkOut(userId: string) {
    const employee = await employeeRepository.findByUserId(userId);
    if (!employee) throw new Error("Employee profile matching user instance not found.");

    const today = new Date();
    const attendance = await attendanceRepository.findByEmployeeAndDate(
      employee._id.toString(),
      today
    );

    if (!attendance || !attendance.checkIn) {
      throw new Error("No active check-in transaction matching today's date parameter is available.");
    }

    if (attendance.checkOut) {
      throw new Error("A check-out event timestamp has already been registered for today.");
    }

    // Retrieve active business operation parameters to benchmark work duration
    const policy = await this.getShiftPolicyForDate(today);
    const targetDailyHours = policy.totalDailyHours;

    const checkInTime = new Date(attendance.checkIn);
    const totalWorkMinutes = differenceInMinutes(today, checkInTime);
    const totalWorkHours = this.convertMinutesToHours(totalWorkMinutes);

    let overtimeHours = 0;
    let undertimeHours = 0;

    if (totalWorkHours > targetDailyHours) {
      overtimeHours = parseFloat((totalWorkHours - targetDailyHours).toFixed(2));
    } else if (totalWorkHours < targetDailyHours) {
      undertimeHours = parseFloat((targetDailyHours - totalWorkHours).toFixed(2));
    }

    // Determine status based on the working window
    let status: "PRESENT" | "HALF_DAY" | "ABSENT" = "PRESENT";
    if (totalWorkHours < targetDailyHours * 0.5) {
      status = "ABSENT";
    } else if (totalWorkHours < targetDailyHours) {
      status = "HALF_DAY";
    }

    const updatedData = {
      checkOut: today,
      workHours: totalWorkHours,
      overtimeHours,
      undertimeHours,
      status,
    };

    const updatedRecord = await attendanceRepository.update(attendance._id.toString(), updatedData);

    await auditRepository.log(
      userId,
      "ATTENDANCE_UPDATED",
      `Employee check-out completed for ${employee.fullName}. Calculated Hours: ${totalWorkHours} hrs.`
    );

    return updatedRecord;
  }

  /**
   * Enables administrators to forcefully insert/overwrite historical data items.
   */
  async administrativeOverride(
    adminUserId: string,
    payload: {
      employeeId: string;
      date: Date;
      status: "PRESENT" | "ABSENT" | "LEAVE" | "HALF_DAY" | "HOLIDAY";
      checkIn?: string; // Expects "HH:mm" format string
      checkOut?: string; // Expects "HH:mm" format string
      remarks?: string;
    }
  ) {
    const targetEmployee = await employeeRepository.findById(payload.employeeId);
    if (!targetEmployee) throw new Error("Target employee allocation profile not found.");

    const baseDate = startOfDay(new Date(payload.date));
    let checkInDate: Date | undefined;
    let checkOutDate: Date | undefined;
    let workHours = 0;
    let overtimeHours = 0;
    let undertimeHours = 0;

    if (payload.status === "PRESENT" || payload.status === "HALF_DAY") {
      const policy = await this.getShiftPolicyForDate(payload.date);
      const targetDailyHours = policy.totalDailyHours;

      if (payload.checkIn) {
        checkInDate = parse(payload.checkIn, "HH:mm", baseDate);
      }
      if (payload.checkOut) {
        checkOutDate = parse(payload.checkOut, "HH:mm", baseDate);
      }

      if (checkInDate && checkOutDate) {
        const totalMinutes = differenceInMinutes(checkOutDate, checkInDate);
        workHours = this.convertMinutesToHours(totalMinutes);

        if (workHours > targetDailyHours) {
          overtimeHours = parseFloat((workHours - targetDailyHours).toFixed(2));
        } else if (workHours < targetDailyHours) {
          undertimeHours = parseFloat((targetDailyHours - workHours).toFixed(2));
        }
      }
    }

    const recordPayload = {
      employeeId: targetEmployee._id as any,
      date: baseDate,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      workHours,
      overtimeHours,
      undertimeHours,
      status: payload.status,
      remarks: payload.remarks || "Overridden manually via administrative compliance module interface.",
      markedBy: adminUserId as any,
    };

    const record = await attendanceRepository.upsert(
      targetEmployee._id.toString(),
      baseDate,
      recordPayload
    );

    await auditRepository.log(
      adminUserId,
      "ATTENDANCE_UPDATED",
      `Administrative override applied for employee ${targetEmployee.fullName} on date ${format(baseDate, "yyyy-MM-dd")}. Status set to: ${payload.status}`
    );

    return record;
  }

  /**
   * Fetches data records matching specific month and year parameters.
   * Also returns payslip release dates so the calendar can show salary disbursement markers.
   */
  async getEmployeeMonthlyLedger(userId: string, month: number, year: number) {
    const employee = await employeeRepository.findByUserId(userId);
    if (!employee) throw new Error("Could not extract corresponding employee metrics mapping.");

    const [ledger, summaries, releasedSlips] = await Promise.all([
      attendanceRepository.findByEmployeeAndMonth(employee._id.toString(), month, year),
      attendanceRepository.getMonthlySummary(employee._id.toString(), month, year),
      payrollRepository.findByEmployee(employee._id.toString(), { status: "RELEASED" }),
    ]);

    // Extract dates (ISO date strings) where a payslip was released this month
    const payslipReleaseDates = releasedSlips
      .filter((s: any) => s.month === month && s.year === year && s.releasedAt)
      .map((s: any) => ({
        date: new Date(s.releasedAt).toISOString().split("T")[0],
        slipId: s._id.toString(),
        netSalary: s.netSalary,
      }));

    return {
      ledger,
      payslipReleaseDates,
      summary: summaries[0] || {
        presentDays: 0,
        absentDays: 0,
        leaveDays: 0,
        halfDays: 0,
        holidays: 0,
        totalOvertimeHours: 0,
        totalUndertimeHours: 0,
        totalWorkHours: 0,
      },
    };
  }
}

export const attendanceService = new AttendanceService();