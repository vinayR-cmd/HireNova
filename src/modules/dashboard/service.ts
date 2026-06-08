import { employeeRepository } from "@/repositories/employee.repository";
import { attendanceRepository } from "@/repositories/attendance.repository";
import { payrollRepository } from "@/repositories/payroll.repository";
import { Employee, User } from "@/lib/models";
import { connectDB } from "@/lib/db";
import { format } from "date-fns";

export class DashboardService {
  /**
   * Compiles data to power the primary Administrative Control Dashboard graphs and KPIs.
   */
  async getAdminDashboardMetrics() {
    await connectDB();
    const today = new Date();
    
    // 1. Gather baseline total population distributions
    const totalActiveCount = await employeeRepository.count({ employmentStatus: "ACTIVE" });
    const outstandingApprovalsCount = await User.countDocuments({ status: "PENDING" });

    // 2. Track today's workspace clock-in statuses
    const todayAttendanceMatrix = await attendanceRepository.getTodayAttendance(today);
    
    let presentToday = 0;
    let absentToday = 0;
    let onLeaveToday = 0;

    todayAttendanceMatrix.forEach((bucket) => {
      if (bucket._id === "PRESENT" || bucket._id === "HALF_DAY") presentToday += bucket.count;
      if (bucket._id === "ABSENT") absentToday += bucket.count;
      if (bucket._id === "LEAVE") onLeaveToday += bucket.count;
    });

    // 3. Extract the financial outlays for the current operational payroll period
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const payrollSummaryAggregation = await payrollRepository.getMonthlyPayrollSummary(currentYear, currentMonth);
    const financeSummary = payrollSummaryAggregation[0] || { totalNet: 0, totalGross: 0, totalDeductions: 0 };

    // 4. Retrieve recent activity items to populate activity feeds
    const recentOnboardingApplications = await Employee.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return {
      kpis: {
        totalWorkforce: totalActiveCount,
        pendingApprovals: outstandingApprovalsCount,
        attendanceRateToday: totalActiveCount > 0 ? parseFloat(((presentToday / totalActiveCount) * 100).toFixed(1)) : 0,
        monthlyPayrollOutlayNet: financeSummary.totalNet,
      },
      attendanceTodayBreakdown: {
        present: presentToday,
        absent: absentToday,
        leave: onLeaveToday,
        unmarked: Math.max(0, totalActiveCount - (presentToday + absentToday + onLeaveToday)),
      },
      recentRegistrations: recentOnboardingApplications.map(r => ({
        id: r._id,
        name: r.fullName,
        email: r.email,
        dept: r.desiredDepartment || "Unassigned",
        date: r.createdAt,
      })),
    };
  }

  /**
   * Generates restricted personal summaries for standalone employee dashboard interfaces.
   */
  async getEmployeeDashboardMetrics(userId: string) {
    await connectDB();
    const employee = await employeeRepository.findByUserId(userId);
    if (!employee) throw new Error("Employee contextual file matching request parameters is absent.");

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    // Fetch the employee's current monthly ledger metrics
    const attendanceSummaryAggregation = await attendanceRepository.getMonthlySummary(
      employee._id.toString(),
      currentMonth,
      currentYear
    );
    const attendanceStats = attendanceSummaryAggregation[0] || { presentDays: 0, absentDays: 0, leaveDays: 0, totalWorkHours: 0 };

    // Retrieve today's specific check-in state record
    const dailyAttendanceFile = await attendanceRepository.findByEmployeeAndDate(employee._id.toString(), today);

    // Fetch historical issued payslips
    const latestPayslipSlipFiles = await payrollRepository.findReleasedByEmployee(employee._id.toString());

    return {
      employeeDetails: {
        fullName: employee.fullName,
        id: employee.employeeId,
        dept: employee.department,
        role: employee.designation,
      },
      todayClockStatus: {
        hasCheckedIn: !!dailyAttendanceFile?.checkIn,
        hasCheckedOut: !!dailyAttendanceFile?.checkOut,
        checkInTime: dailyAttendanceFile?.checkIn || null,
        checkOutTime: dailyAttendanceFile?.checkOut || null,
      },
      monthlySummaryStats: {
        daysPresent: attendanceStats.presentDays,
        daysAbsent: attendanceStats.absentDays,
        approvedLeavesTaken: attendanceStats.leaveDays,
        accumulatedWorkHours: attendanceStats.totalWorkHours,
      },
      recentPayslips: latestPayslipSlipFiles.slice(0, 3).map(p => ({
        id: p._id,
        period: `${format(new Date(p.year, p.month - 1, 1), "MMMM")} ${p.year}`,
        netTakeHome: p.netSalary,
      })),
    };
  }
}

export const dashboardService = new DashboardService();