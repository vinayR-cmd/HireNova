import mongoose, { Document, Schema } from "mongoose";

export interface ICustomDay extends Document {
  date: Date;
  isHoliday: boolean;
  holidayName?: string;
  officeStartTime?: string;
  officeEndTime?: string;
  totalDailyHours?: number;
  createdAt: Date;
  updatedAt: Date;
}

const CustomDaySchema = new Schema<ICustomDay>(
  {
    date: { type: Date, required: true, unique: true, index: true },
    isHoliday: { type: Boolean, default: false },
    holidayName: { type: String },
    officeStartTime: { type: String, default: "09:00" },
    officeEndTime: { type: String, default: "18:00" },
    totalDailyHours: { type: Number, default: 9 },
  },
  { timestamps: true }
);

export const CustomDay =
  mongoose.models.CustomDay ?? mongoose.model<ICustomDay>("CustomDay", CustomDaySchema);
