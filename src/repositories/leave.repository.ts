import { LeaveRequest, ILeaveRequest } from "@/lib/models";
import { Types } from "mongoose";
import { startOfYear, endOfYear } from "date-fns";

export class LeaveRepository {
  async findByEmployeeId(employeeId: string, options?: { status?: ILeaveRequest["status"]; limit?: number }) {
    const query: Record<string, unknown> = { employeeId: new Types.ObjectId(employeeId) };
    if (options?.status) query.status = options.status;
    let cursor = LeaveRequest.find(query).sort({ createdAt: -1 });
    if (options?.limit) cursor = cursor.limit(options.limit);
    return cursor.lean();
  }

  /** Sum of approved leave days taken so far this calendar year, by employee. */
  async approvedDaysThisYear(employeeId: string) {
    const now = new Date();
    const result = await LeaveRequest.aggregate([
      {
        $match: {
          employeeId: new Types.ObjectId(employeeId),
          status: "APPROVED",
          fromDate: { $gte: startOfYear(now), $lte: endOfYear(now) },
        },
      },
      { $group: { _id: null, totalDays: { $sum: "$totalDays" } } },
    ]);
    return result[0]?.totalDays || 0;
  }

  /** Company-wide leave utilization broken down by type and approval status — powers Workforce Analytics. */
  async getUtilizationByType(from: Date) {
    return LeaveRequest.aggregate([
      { $match: { createdAt: { $gte: from } } },
      {
        $group: {
          _id: { leaveType: "$leaveType", status: "$status" },
          requestCount: { $sum: 1 },
          totalDays: { $sum: "$totalDays" },
        },
      },
      { $sort: { "_id.leaveType": 1, "_id.status": 1 } },
    ]);
  }
}

export const leaveRepository = new LeaveRepository();
