import mongoose, { Document, Schema, Types } from "mongoose";

export type EmploymentStatus = "ACTIVE" | "ON_LEAVE" | "SUSPENDED" | "TERMINATED";
export type Gender = "MALE" | "FEMALE" | "OTHER";
export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";

export interface IBankInfo {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
}

export interface IEmergencyContact {
  name: string;
  phone: string;
  relation?: string;
}

export interface IEmployee extends Document {
  userId: Types.ObjectId;

  // Personal
  fullName: string;
  email: string;
  mobile: string;
  dateOfBirth?: Date;
  gender?: Gender;
  address?: string;
  emergencyContact?: IEmergencyContact;
  profilePicture?: string;

  // Employment (set by Admin on approval)
  employeeId?: string;
  department?: string;
  designation?: string;
  officialDepartment?: string;
  officialDesignation?: string;
  joiningDate?: Date;
  employmentStatus?: EmploymentStatus;
  employmentType?: EmploymentType;
  grossSalary?: number;
  basicSalary?: number;
  leavePolicyId?: Types.ObjectId;
  workingHoursPolicyId?: Types.ObjectId;
  overtimeMultiplier?: number;

  // Salary components (editable by admin)
  specialAllowance?: number;
  performancePay?: number;
  bonus?: number;
  incentive?: number;
  otherAllowances?: number;
  pfEnabled?: boolean;
  uanNumber?: string;

  // Desired (submitted by Employee)
  desiredDepartment?: string;
  desiredDesignation?: string;

  // Identity
  aadhaarNumber?: string;
  panNumber?: string;

  // Banking
  bankInfo?: IBankInfo;

  // HRA
  hraEnabled?: boolean;
  hraAmount?: number;

  // Rejection
  rejectionReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },

    // Personal
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    mobile: { type: String, required: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["MALE", "FEMALE", "OTHER"] },
    address: { type: String },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },
    profilePicture: { type: String },

    // Employment
    employeeId: { type: String, unique: true, sparse: true, index: true },
    department: { type: String },
    designation: { type: String },
    officialDepartment: { type: String },
    officialDesignation: { type: String },
    joiningDate: { type: Date },
    employmentStatus: { type: String, enum: ["ACTIVE", "ON_LEAVE", "SUSPENDED", "TERMINATED"] },
    employmentType: { type: String, enum: ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"], default: "FULL_TIME" },
    grossSalary: { type: Number, min: 0 },
    basicSalary: { type: Number, min: 0 },
    leavePolicyId: { type: Schema.Types.ObjectId, ref: "LeavePolicy" },
    workingHoursPolicyId: { type: Schema.Types.ObjectId, ref: "WorkingHoursPolicy" },
    overtimeMultiplier: { type: Number, default: 1.5 },

    // Salary components
    specialAllowance: { type: Number, default: 0, min: 0 },
    performancePay: { type: Number, default: 0, min: 0 },
    bonus: { type: Number, default: 0, min: 0 },
    incentive: { type: Number, default: 0, min: 0 },
    otherAllowances: { type: Number, default: 0, min: 0 },
    pfEnabled: { type: Boolean, default: true },
    uanNumber: { type: String },

    // Desired
    desiredDepartment: { type: String },
    desiredDesignation: { type: String },

    // Identity
    aadhaarNumber: { type: String },
    panNumber: { type: String },

    // Banking
    bankInfo: {
      accountHolderName: String,
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      branchName: String,
    },

    // HRA
    hraEnabled: { type: Boolean, default: false },
    hraAmount: { type: Number, default: 0, min: 0 },

    // Rejection
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

EmployeeSchema.index({ department: 1, employmentStatus: 1 });

export const Employee = mongoose.models.Employee ?? mongoose.model<IEmployee>("Employee", EmployeeSchema);
