import { Payroll, IPayroll, PayrollStatus } from "@/lib/models";
import { Types, UpdateQuery } from "mongoose";

export class PayrollRepository {
  async findById(id: string) {
    return Payroll.findById(id).lean();
  }

  async findByIdPopulated(id: string) {
    return Payroll.findById(id)
      .populate("employeeId", "fullName employeeId department designation bankInfo panNumber")
      .lean();
  }

  async findByEmployeeAndPeriod(employeeId: string, month: number, year: number) {
    return Payroll.findOne({
      employeeId: new Types.ObjectId(employeeId),
      month,
      year,
    }).lean();
  }

  async findByEmployee(employeeId: string, options?: { status?: PayrollStatus }) {
    const filter: Record<string, unknown> = { employeeId: new Types.ObjectId(employeeId) };
    if (options?.status) filter.status = options.status;
    return Payroll.find(filter).sort({ year: -1, month: -1 }).lean();
  }

  async findReleasedByEmployee(employeeId: string) {
    return Payroll.find({
      employeeId: new Types.ObjectId(employeeId),
      status: "RELEASED",
    })
      .populate("employeeId", "fullName employeeId department designation bankInfo panNumber")
      .sort({ year: -1, month: -1 })
      .lean();
  }

  async create(data: Partial<IPayroll>) {
    const payroll = new Payroll(data);
    return payroll.save();
  }

  async update(id: string, data: UpdateQuery<IPayroll>) {
    return Payroll.findByIdAndUpdate(id, data, { returnDocument: "after" }).lean();
  }

  async updateStatus(id: string, status: PayrollStatus, meta?: Partial<IPayroll>) {
    return Payroll.findByIdAndUpdate(id, { status, ...meta }, { returnDocument: "after" }).lean();
  }

  async findByMonthYear(month: number, year: number, status?: PayrollStatus) {
    const filter: Record<string, unknown> = { month, year };
    if (status) filter.status = status;
    return Payroll.find(filter)
      .populate("employeeId", "fullName employeeId department designation")
      .sort({ createdAt: -1 })
      .lean();
  }

  async getMonthlyPayrollSummary(year: number, month: number) {
    return Payroll.aggregate([
      { $match: { year, month, status: { $in: ["GENERATED", "APPROVED", "RELEASED"] } } },
      {
        $group: {
          _id: null,
          totalGross: { $sum: "$earnings.grossSalary" },
          totalOvertime: { $sum: "$earnings.overtimePay" },
          totalNet: { $sum: "$netSalary" },
          totalDeductions: { $sum: "$deductions.total" },
          employeeCount: { $sum: 1 },
        },
      },
    ]);
  }

  async upsert(employeeId: string, month: number, year: number, data: Partial<IPayroll>) {
    return Payroll.findOneAndUpdate(
      { employeeId: new Types.ObjectId(employeeId), month, year },
      { ...data, employeeId: new Types.ObjectId(employeeId), month, year },
      { upsert: true, returnDocument: "after" }
    ).lean();
  }

  /** Trailing payroll cost trend (gross/net/deductions per period) — powers Workforce Analytics charts. */
  async getPayrollTrend(periodsBack: number) {
    return Payroll.aggregate([
      { $match: { status: { $in: ["GENERATED", "APPROVED", "RELEASED"] } } },
      {
        $group: {
          _id: { year: "$year", month: "$month" },
          totalGross: { $sum: "$earnings.grossSalary" },
          totalNet: { $sum: "$netSalary" },
          totalDeductions: { $sum: "$deductions.total" },
          employeeCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: periodsBack },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);
  }
}

export const payrollRepository = new PayrollRepository();
