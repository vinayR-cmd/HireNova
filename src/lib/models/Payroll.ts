import mongoose, { Document, Schema, Types } from "mongoose";

export type PayrollStatus = "DRAFT" | "GENERATED" | "APPROVED" | "RELEASED";

export interface IEarnings {
  basicSalary: number;
  grossSalary: number;       // kept for backward compat — mirrors basicSalary at storage time
  hraAmount: number;
  specialAllowance: number;
  performancePay: number;
  bonus: number;
  incentives: number;
  otherAllowances: number;
  overtimePay: number;
  adjustments: number;
  total: number;             // sum of every earning above
}

export interface IDeductions {
  undertimeDeduction: number;
  leaveDeduction: number;
  tax: number;
  pf: number;
  professionalTax: number;
  otherDeductions: number;
  total: number;
}

export interface IAttendanceSummary {
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  paidLeaveDays: number;
  chargeableLeaveDays: number;
  halfDays: number;
  overtimeHours: number;
  undertimeHours: number;
}

export interface IPayroll extends Document {
  employeeId: Types.ObjectId;
  month: number;
  year: number;
  status: PayrollStatus;
  earnings: IEarnings;
  deductions: IDeductions;
  netSalary: number;
  attendanceSummary: IAttendanceSummary;
  notes?: string;
  generatedAt?: Date;
  approvedAt?: Date;
  releasedAt?: Date;
  generatedBy?: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  releasedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EarningsSchema = new Schema<IEarnings>({
  basicSalary: { type: Number, default: 0 },
  grossSalary: { type: Number, default: 0 },
  hraAmount: { type: Number, default: 0 },
  specialAllowance: { type: Number, default: 0 },
  performancePay: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  incentives: { type: Number, default: 0 },
  otherAllowances: { type: Number, default: 0 },
  overtimePay: { type: Number, default: 0 },
  adjustments: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
}, { _id: false });

const DeductionsSchema = new Schema<IDeductions>({
  undertimeDeduction: { type: Number, default: 0 },
  leaveDeduction: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  pf: { type: Number, default: 0 },
  professionalTax: { type: Number, default: 0 },
  otherDeductions: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
}, { _id: false });

const AttendanceSummarySchema = new Schema<IAttendanceSummary>({
  totalWorkingDays: { type: Number, default: 0 },
  presentDays: { type: Number, default: 0 },
  absentDays: { type: Number, default: 0 },
  leaveDays: { type: Number, default: 0 },
  paidLeaveDays: { type: Number, default: 0 },
  chargeableLeaveDays: { type: Number, default: 0 },
  halfDays: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  undertimeHours: { type: Number, default: 0 },
}, { _id: false });

const PayrollSchema = new Schema<IPayroll>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    status: { type: String, enum: ["DRAFT", "GENERATED", "APPROVED", "RELEASED"], default: "DRAFT" },
    earnings: { type: EarningsSchema, default: () => ({}) },
    deductions: { type: DeductionsSchema, default: () => ({}) },
    netSalary: { type: Number, default: 0 },
    attendanceSummary: { type: AttendanceSummarySchema, default: () => ({}) },
    notes: { type: String },
    generatedAt: { type: Date },
    approvedAt: { type: Date },
    releasedAt: { type: Date },
    generatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    releasedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

PayrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });
PayrollSchema.index({ status: 1, year: 1, month: 1 });

export const Payroll = mongoose.models.Payroll ?? mongoose.model<IPayroll>("Payroll", PayrollSchema);
