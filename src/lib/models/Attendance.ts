import mongoose, { Document, Schema, Types } from "mongoose";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LEAVE" | "HALF_DAY" | "HOLIDAY";

export interface IAttendance extends Document {
  employeeId: Types.ObjectId;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  workHours: number;
  overtimeHours: number;
  undertimeHours: number;
  status: AttendanceStatus;
  remarks?: string;
  markedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    date: { type: Date, required: true },
    checkIn: { type: Date },
    checkOut: { type: Date },
    workHours: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 },
    undertimeHours: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["PRESENT", "ABSENT", "LEAVE", "HALF_DAY", "HOLIDAY"],
      required: true,
    },
    remarks: { type: String },
    markedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Unique attendance per employee per day
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ date: 1, status: 1 });

export const Attendance = mongoose.models.Attendance ?? mongoose.model<IAttendance>("Attendance", AttendanceSchema);
