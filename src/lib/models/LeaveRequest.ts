import mongoose, { Document, Schema, Types } from "mongoose";

export type LeaveType = "SICK" | "CASUAL" | "EARNED" | "UNPAID" | "OTHER";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ILeaveRequest extends Document {
  employeeId: Types.ObjectId;
  leaveType: LeaveType;
  fromDate: Date;
  toDate: Date;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  adminRemark?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveRequestSchema = new Schema<ILeaveRequest>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    leaveType: { type: String, enum: ["SICK", "CASUAL", "EARNED", "UNPAID", "OTHER"], required: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    totalDays: { type: Number, required: true, min: 0.5 },
    reason: { type: String, required: true, trim: true },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING", index: true },
    adminRemark: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

LeaveRequestSchema.index({ employeeId: 1, status: 1 });
LeaveRequestSchema.index({ fromDate: 1, toDate: 1 });

export const LeaveRequest = mongoose.models.LeaveRequest ?? mongoose.model<ILeaveRequest>("LeaveRequest", LeaveRequestSchema);
