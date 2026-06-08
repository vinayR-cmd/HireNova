import mongoose, { Document, Schema, Types } from "mongoose";

export type AuditAction =
  | "USER_REGISTERED"
  | "USER_LOGIN"
  | "USER_LOGOUT"
  | "EMPLOYEE_APPROVED"
  | "EMPLOYEE_REJECTED"
  | "EMPLOYEE_UPDATED"
  | "ATTENDANCE_MARKED"
  | "ATTENDANCE_UPDATED"
  | "SALARY_GENERATED"
  | "SALARY_APPROVED"
  | "SALARY_RELEASED"
  | "COMPANY_SETTINGS_UPDATED"
  | "PASSWORD_CHANGED"
  | "JOB_POSTING_CREATED"
  | "CANDIDATE_SCREENED"
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEW_COMPLETED"
  | "CANDIDATE_HIRED";

export interface IAuditLog extends Document {
  performedBy: Types.ObjectId;
  action: AuditAction;
  targetId?: Types.ObjectId;
  targetModel?: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: {
      type: String,
      enum: [
        "USER_REGISTERED", "USER_LOGIN", "USER_LOGOUT",
        "EMPLOYEE_APPROVED", "EMPLOYEE_REJECTED", "EMPLOYEE_UPDATED",
        "ATTENDANCE_MARKED", "ATTENDANCE_UPDATED",
        "SALARY_GENERATED", "SALARY_APPROVED", "SALARY_RELEASED",
        "COMPANY_SETTINGS_UPDATED", "PASSWORD_CHANGED",
        "JOB_POSTING_CREATED", "CANDIDATE_SCREENED", "INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED", "CANDIDATE_HIRED",
      ],
      required: true,
    },
    targetId: { type: Schema.Types.ObjectId },
    targetModel: { type: String },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ performedBy: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLog = mongoose.models.AuditLog ?? mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
