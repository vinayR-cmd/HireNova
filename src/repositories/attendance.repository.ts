import { Attendance, IAttendance, AttendanceStatus } from "@/lib/models";
import { Types, UpdateQuery } from "mongoose";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";

export class AttendanceRepository {
  async findById(id: string) {
    return Attendance.findById(id).lean();
  }

  async findByEmployeeAndDate(employeeId: string, date: Date) {
    return Attendance.findOne({
      employeeId: new Types.ObjectId(employeeId),
      date: { $gte: startOfDay(date), $lte: endOfDay(date) },
    }).lean();
  }

  async findByEmployeeAndMonth(employeeId: string, month: number, year: number) {
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));
    return Attendance.find({
      employeeId: new Types.ObjectId(employeeId),
      date: { $gte: start, $lte: end },
    })
      .sort({ date: 1 })
      .lean();
  }

  async create(data: Partial<IAttendance>) {
    const attendance = new Attendance(data);
    return attendance.save();
  }

  async update(id: string, data: UpdateQuery<IAttendance>) {
    return Attendance.findByIdAndUpdate(id, data, { returnDocument: "after" }).lean();
  }

  async upsert(employeeId: string, date: Date, data: Partial<IAttendance>) {
    return Attendance.findOneAndUpdate(
      { employeeId: new Types.ObjectId(employeeId), date: startOfDay(date) },
      { ...data, employeeId: new Types.ObjectId(employeeId), date: startOfDay(date) },
      { upsert: true, returnDocument: "after" }
    ).lean();
  }

  async getMonthlySummary(employeeId: string, month: number, year: number, effectiveStartDate?: Date) {
    const monthStart = startOfMonth(new Date(year, month - 1));
    const start = effectiveStartDate && effectiveStartDate > monthStart ? startOfDay(effectiveStartDate) : monthStart;
    const end = endOfMonth(new Date(year, month - 1));

    return Attendance.aggregate([
      {
        $match: {
          employeeId: new Types.ObjectId(employeeId),
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          presentDays: { $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] } },
          absentDays: { $sum: { $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0] } },
          leaveDays: { $sum: { $cond: [{ $eq: ["$status", "LEAVE"] }, 1, 0] } },
          halfDays: { $sum: { $cond: [{ $eq: ["$status", "HALF_DAY"] }, 1, 0] } },
          holidays: { $sum: { $cond: [{ $eq: ["$status", "HOLIDAY"] }, 1, 0] } },
          totalOvertimeHours: { $sum: "$overtimeHours" },
          totalUndertimeHours: { $sum: "$undertimeHours" },
          totalWorkHours: { $sum: "$workHours" },
        },
      },
    ]);
  }

  async findByDate(date: Date) {
    return Attendance.find({
      date: { $gte: startOfDay(date), $lte: endOfDay(date) },
    }).lean();
  }

  async getTodayAttendance(date: Date) {
    return Attendance.aggregate([
      {
        $match: { date: { $gte: startOfDay(date), $lte: endOfDay(date) } },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
  }

  async deleteHolidayRecordsForDate(date: Date) {
    return Attendance.deleteMany({ date: startOfDay(date), status: "HOLIDAY" });
  }

  async bulkUpsert(records: Array<Partial<IAttendance>>) {
    const ops = records.map((r) => ({
      updateOne: {
        filter: { employeeId: r.employeeId, date: r.date },
        update: { $set: r },
        upsert: true,
      },
    }));
    return Attendance.bulkWrite(ops);
  }

  async findByDateRange(employeeId: string, startDate: Date, endDate: Date) {
    return Attendance.find({
      employeeId: new Types.ObjectId(employeeId),
      date: { $gte: startOfDay(startDate), $lte: endOfDay(endDate) },
    })
      .sort({ date: 1 })
      .lean();
  }

  /** Company-wide monthly attendance + overtime trend — powers Workforce Analytics charts. */
  async getCompanyMonthlyTrend(from: Date) {
    return Attendance.aggregate([
      { $match: { date: { $gte: from } } },
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          presentDays: { $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] } },
          absentDays: { $sum: { $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0] } },
          leaveDays: { $sum: { $cond: [{ $eq: ["$status", "LEAVE"] }, 1, 0] } },
          totalOvertimeHours: { $sum: "$overtimeHours" },
          totalRecords: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);
  }
}

export const attendanceRepository = new AttendanceRepository();
