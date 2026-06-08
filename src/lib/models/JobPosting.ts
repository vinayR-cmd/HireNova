import mongoose, { Document, Schema, Types } from "mongoose";

export type JobPostingStatus = "DRAFT" | "OPEN" | "CLOSED";

export interface IJobPosting extends Document {
  title: string;
  department: string;
  designation: string;
  description: string;
  requiredSkills: string[];
  experienceLevel: string;
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";
  status: JobPostingStatus;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const JobPostingSchema = new Schema<IJobPosting>(
  {
    title: { type: String, required: true, trim: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    description: { type: String, required: true },
    requiredSkills: { type: [String], default: [] },
    experienceLevel: { type: String, required: true },
    employmentType: { type: String, enum: ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"], default: "FULL_TIME" },
    status: { type: String, enum: ["DRAFT", "OPEN", "CLOSED"], default: "OPEN", index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const JobPosting = mongoose.models.JobPosting ?? mongoose.model<IJobPosting>("JobPosting", JobPostingSchema);
