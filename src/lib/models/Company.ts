import mongoose, { Document, Schema } from "mongoose";

export interface IWorkingHoursPolicy {
  name: string;
  officeStartTime: string;
  officeEndTime: string;
  workingDays: string[];
  weeklyOff: string[];
  totalDailyHours: number;
}

export interface IHoliday {
  date: Date;
  name: string;
}

export interface ICompany extends Document {
  name: string;
  address?: string;
  logo?: string;
  contactNumber?: string;
  email?: string;
  gstNumber?: string;
  website?: string;

  // Payroll settings
  overtimeMultiplier: number;
  pfPercentage: number;
  taxPercentage: number;
  maxLeavesPerMonth: number;

  // Global payroll toggles & rates
  pfEnabled: boolean;
  employerPfPercentage: number;
  professionalTaxEnabled: boolean;
  professionalTaxAmount: number;
  overtimeEnabled: boolean;
  overtimeRateType: "PER_HOUR" | "PER_DAY" | "FIXED";
  defaultOvertimeRate: number;
  defaultWorkingDays: number;
  basicSalaryPercentage: number;
  hraEnabled: boolean;
  hraPercentage: number;
  autoSalaryCalculation: boolean;

  // Working hours
  workingHoursPolicy: IWorkingHoursPolicy;

  // Company holidays
  holidays: IHoliday[];

  createdAt: Date;
  updatedAt: Date;
}

const WorkingHoursPolicySchema = new Schema<IWorkingHoursPolicy>({
  name: { type: String, default: "Standard" },
  officeStartTime: { type: String, default: "09:00" },
  officeEndTime: { type: String, default: "18:00" },
  workingDays: { type: [String], default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] },
  weeklyOff: { type: [String], default: ["Sunday"] },
  totalDailyHours: { type: Number, default: 9 },
}, { _id: false });

const HolidaySchema = new Schema<IHoliday>({
  date: { type: Date, required: true },
  name: { type: String, required: true },
}, { _id: false });

const CompanySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true },
    address: { type: String },
    logo: { type: String },
    contactNumber: { type: String },
    email: { type: String },
    gstNumber: { type: String },
    website: { type: String },

    overtimeMultiplier: { type: Number, default: 1.5 },
    pfPercentage: { type: Number, default: 12 },
    taxPercentage: { type: Number, default: 10 },
    maxLeavesPerMonth: { type: Number, default: 2 },

    // Global payroll toggles & rates
    pfEnabled: { type: Boolean, default: true },
    employerPfPercentage: { type: Number, default: 12 },
    professionalTaxEnabled: { type: Boolean, default: true },
    professionalTaxAmount: { type: Number, default: 200 },
    overtimeEnabled: { type: Boolean, default: true },
    overtimeRateType: { type: String, enum: ["PER_HOUR", "PER_DAY", "FIXED"], default: "PER_HOUR" },
    defaultOvertimeRate: { type: Number, default: 200 },
    defaultWorkingDays: { type: Number, default: 26 },
    basicSalaryPercentage: { type: Number, default: 40 },
    hraEnabled: { type: Boolean, default: true },
    hraPercentage: { type: Number, default: 50 },
    autoSalaryCalculation: { type: Boolean, default: true },

    workingHoursPolicy: { type: WorkingHoursPolicySchema, default: () => ({}) },
    holidays: { type: [HolidaySchema], default: [] },
  },
  { timestamps: true }
);

export const Company = mongoose.models.Company ?? mongoose.model<ICompany>("Company", CompanySchema);
