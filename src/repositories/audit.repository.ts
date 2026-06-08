import { AuditLog, IAuditLog, AuditAction } from "@/lib/models";
import { Types } from "mongoose";

export class AuditRepository {
  async create(data: Partial<IAuditLog>) {
    const log = new AuditLog(data);
    return log.save();
  }

  async findByUser(userId: string, options?: { limit?: number; skip?: number }) {
    let query = AuditLog.find({ performedBy: new Types.ObjectId(userId) }).sort({ createdAt: -1 });
    if (options?.skip) query = query.skip(options.skip);
    if (options?.limit) query = query.limit(options.limit);
    return query.lean();
  }

  async findAll(options?: { action?: AuditAction; limit?: number; skip?: number }) {
    const filter: Record<string, unknown> = {};
    if (options?.action) filter.action = options.action;
    let query = AuditLog.find(filter)
      .populate("performedBy", "email role")
      .sort({ createdAt: -1 });
    if (options?.skip) query = query.skip(options.skip);
    if (options?.limit) query = query.limit(options.limit);
    return query.lean();
  }

  async log(
    performedBy: string,
    action: AuditAction,
    description: string,
    extras?: Partial<IAuditLog>
  ) {
    return this.create({
      performedBy: new Types.ObjectId(performedBy) as unknown as Types.ObjectId,
      action,
      description,
      ...extras,
    });
  }
}

export const auditRepository = new AuditRepository();
