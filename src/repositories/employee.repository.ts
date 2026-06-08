import { Employee, IEmployee } from "@/lib/models";
import { QueryFilter, UpdateQuery, Types } from "mongoose";

export class EmployeeRepository {
  async findById(id: string) {
    return Employee.findById(id).lean();
  }

  async findByUserId(userId: string) {
    return Employee.findOne({ userId: new Types.ObjectId(userId) }).lean();
  }

  async findByEmail(email: string) {
    return Employee.findOne({ email: email.toLowerCase() }).lean();
  }

  async findByEmployeeId(employeeId: string) {
    return Employee.findOne({ employeeId }).lean();
  }

  async create(data: Partial<IEmployee>) {
    const employee = new Employee(data);
    return employee.save();
  }

  async update(id: string, data: UpdateQuery<IEmployee>) {
    return Employee.findByIdAndUpdate(id, data, { returnDocument: "after", runValidators: true }).lean();
  }

  async updateByUserId(userId: string, data: UpdateQuery<IEmployee>) {
    return Employee.findOneAndUpdate({ userId: new Types.ObjectId(userId) }, data, { returnDocument: "after" }).lean();
  }

  async findAll(filter: QueryFilter<IEmployee> = {}, options?: { skip?: number; limit?: number; sort?: Record<string, 1 | -1> }) {
    let query = Employee.find(filter);
    if (options?.sort) query = query.sort(options.sort);
    if (options?.skip) query = query.skip(options.skip);
    if (options?.limit) query = query.limit(options.limit);
    return query.lean();
  }

  async count(filter: QueryFilter<IEmployee> = {}) {
    return Employee.countDocuments(filter);
  }

  async findPendingApprovals() {
    return Employee.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      { $match: { "user.status": "PENDING" } },
      { $sort: { createdAt: -1 } },
    ]);
  }

  async findActiveEmployees() {
    return Employee.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      { $match: { "user.status": "ACTIVE", employmentStatus: "ACTIVE" } },
    ]);
  }

  async getNextEmployeeId(): Promise<string> {
    const last = await Employee.findOne({ employeeId: { $exists: true } }, {}, { sort: { employeeId: -1 } }).lean();
    if (!last?.employeeId) return "EMP001";
    const num = parseInt(last.employeeId.replace("EMP", ""), 10) + 1;
    return `EMP${String(num).padStart(3, "0")}`;
  }

  /** Active headcount grouped by department — powers the workforce distribution chart. */
  async getDepartmentDistribution() {
    return Employee.aggregate([
      { $match: { employmentStatus: "ACTIVE" } },
      { $group: { _id: { $ifNull: ["$department", "Unassigned"] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
  }

  /** New joiners per month over the trailing window — powers the headcount growth chart. */
  async getHeadcountGrowth(monthsBack: number, from: Date) {
    return Employee.aggregate([
      { $match: { joiningDate: { $gte: from } } },
      {
        $group: {
          _id: { year: { $year: "$joiningDate" }, month: { $month: "$joiningDate" } },
          newJoiners: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: monthsBack },
    ]);
  }
}

export const employeeRepository = new EmployeeRepository();
