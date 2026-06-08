import { customDayRepository } from "@/repositories/custom-day.repository";
import { companyRepository } from "@/repositories/company.repository";
import { attendanceRepository } from "@/repositories/attendance.repository";
import { employeeRepository } from "@/repositories/employee.repository";
import { auditRepository } from "@/repositories/audit.repository";
import { attendanceService } from "@/modules/attendance/service";
import { startOfDay, startOfMonth, endOfMonth, format } from "date-fns";

export class CalendarService {
  /**
   * Retrieves all custom days and default holidays for a given month and year.
   */
  async getCustomDaysAndHolidays(month: number, year: number) {
    const monthDate = new Date(year, month - 1, 1);
    const startDate = startOfMonth(monthDate);
    const endDate = endOfMonth(monthDate);

    // 1. Fetch overrides in the month range
    const customDays = await customDayRepository.findRange(startDate, endDate);

    // 2. Fetch standard company settings & holidays
    const companySettings = await companyRepository.get();
    const standardHolidays = companySettings?.holidays ?? [];
    const workingHoursPolicy = companySettings?.workingHoursPolicy ?? {
      officeStartTime: "09:00",
      officeEndTime: "18:00",
      totalDailyHours: 9,
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      weeklyOff: ["Saturday", "Sunday"],
    };

    // 3. Merge: CustomDays override standard settings and holidays
    const mergedMap: Record<
      string,
      {
        date: string;
        isHoliday: boolean;
        holidayName?: string;
        officeStartTime: string;
        officeEndTime: string;
        totalDailyHours: number;
        isCustom: boolean;
      }
    > = {};

    // First populate default working hours policy for every day of the month
    let current = new Date(startDate);
    while (current <= endDate) {
      const dateKey = format(current, "yyyy-MM-dd");
      const dayName = format(current, "EEEE");
      const isWeekend = workingHoursPolicy.weeklyOff?.includes(dayName) ?? false;

      mergedMap[dateKey] = {
        date: dateKey,
        isHoliday: isWeekend, // weekend acts as default holiday/off-day if marked
        holidayName: isWeekend ? "Weekly Off" : undefined,
        officeStartTime: workingHoursPolicy.officeStartTime,
        officeEndTime: workingHoursPolicy.officeEndTime,
        totalDailyHours: workingHoursPolicy.totalDailyHours,
        isCustom: false,
      };

      current.setDate(current.getDate() + 1);
    }

    // Overlay standard holidays
    for (const sh of standardHolidays) {
      const dateKey = format(new Date(sh.date), "yyyy-MM-dd");
      if (mergedMap[dateKey]) {
        mergedMap[dateKey].isHoliday = true;
        mergedMap[dateKey].holidayName = sh.name;
      }
    }

    // Overlay custom day overrides
    for (const cd of customDays) {
      const dateKey = format(new Date(cd.date), "yyyy-MM-dd");
      mergedMap[dateKey] = {
        date: dateKey,
        isHoliday: cd.isHoliday,
        holidayName: cd.holidayName,
        officeStartTime: cd.officeStartTime || workingHoursPolicy.officeStartTime,
        officeEndTime: cd.officeEndTime || workingHoursPolicy.officeEndTime,
        totalDailyHours: cd.totalDailyHours ?? workingHoursPolicy.totalDailyHours,
        isCustom: true,
      };
    }

    return {
      workingHoursPolicy,
      calendarDays: Object.values(mergedMap),
    };
  }

  /**
   * Sets a custom day override (either custom timings or holiday) for a specific date.
   */
  async setCustomDay(
    adminUserId: string,
    payload: {
      date: Date;
      isHoliday: boolean;
      holidayName?: string;
      officeStartTime?: string;
      officeEndTime?: string;
      totalDailyHours?: number;
    }
  ) {
    const day = startOfDay(new Date(payload.date));
    const dateStr = format(day, "yyyy-MM-dd");

    // 1. Upsert CustomDay configuration record
    const updated = await customDayRepository.upsert(day, {
      isHoliday: payload.isHoliday,
      holidayName: payload.holidayName,
      officeStartTime: payload.officeStartTime,
      officeEndTime: payload.officeEndTime,
      totalDailyHours: payload.totalDailyHours,
    });

    // 2. Perform side effects
    if (payload.isHoliday) {
      // If declared as holiday, upsert HOLIDAY attendance for all active employees
      const activeEmployees = await employeeRepository.findActiveEmployees();
      for (const employee of activeEmployees) {
        await attendanceRepository.upsert(employee._id.toString(), day, {
          employeeId: employee._id as any,
          date: day,
          status: "HOLIDAY",
          workHours: 0,
          overtimeHours: 0,
          undertimeHours: 0,
          remarks: `Calendar Holiday: ${payload.holidayName || "Holiday"}`,
          markedBy: adminUserId as any,
        });
      }

      await auditRepository.log(
        adminUserId,
        "ATTENDANCE_UPDATED",
        `Declared custom calendar holiday on ${dateStr}: "${payload.holidayName || "Holiday"}"`
      );
    } else {
      // If it is a workday, delete any previous holiday attendance records on this date
      await attendanceRepository.deleteHolidayRecordsForDate(day);

      // Recalculate attendance for all checked-in employees on this date
      const targetHours = payload.totalDailyHours ?? 9;
      await attendanceService.recalculateAttendanceForDate(day, targetHours);

      await auditRepository.log(
        adminUserId,
        "ATTENDANCE_UPDATED",
        `Configured custom working window on ${dateStr}: ${payload.officeStartTime}-${payload.officeEndTime} (${targetHours} hrs)`
      );
    }

    return updated;
  }

  /**
   * Reverts a custom day setting for a date back to company default policy.
   */
  async revertCustomDay(adminUserId: string, date: Date) {
    const day = startOfDay(new Date(date));
    const dateStr = format(day, "yyyy-MM-dd");

    // 1. Delete custom day record
    await customDayRepository.delete(day);

    // 2. Resolve default status for this day
    const companySettings = await companyRepository.get();
    const standardHoliday = companySettings?.holidays?.find(
      (h: any) => startOfDay(new Date(h.date)).getTime() === day.getTime()
    );

    if (standardHoliday) {
      // Reverts back to standard company holiday
      const activeEmployees = await employeeRepository.findActiveEmployees();
      for (const employee of activeEmployees) {
        await attendanceRepository.upsert(employee._id.toString(), day, {
          employeeId: employee._id as any,
          date: day,
          status: "HOLIDAY",
          workHours: 0,
          overtimeHours: 0,
          undertimeHours: 0,
          remarks: `Company Holiday: ${standardHoliday.name}`,
          markedBy: adminUserId as any,
        });
      }

      await auditRepository.log(
        adminUserId,
        "ATTENDANCE_UPDATED",
        `Reverted calendar day override on ${dateStr} back to company holiday: "${standardHoliday.name}"`
      );
    } else {
      // Reverts to normal workday: delete any HOLIDAY attendance records
      await attendanceRepository.deleteHolidayRecordsForDate(day);

      // Recalculate existing attendances using standard policy hours
      const defaultHours = companySettings?.workingHoursPolicy?.totalDailyHours || 9;
      await attendanceService.recalculateAttendanceForDate(day, defaultHours);

      await auditRepository.log(
        adminUserId,
        "ATTENDANCE_UPDATED",
        `Reverted calendar day override on ${dateStr} back to standard corporate shift timings.`
      );
    }

    return { success: true };
  }
}

export const calendarService = new CalendarService();
