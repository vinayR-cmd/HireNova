import mongoose, { Document, Schema, Types } from "mongoose";

export type CandidateStatus =
  | "APPLIED"
  | "SCREENED"
  | "SHORTLISTED"
  | "INTERVIEWING"
  | "INTERVIEWED"
  | "HIRED"
  | "REJECTED";

export type HiringRecommendation = "STRONG_HIRE" | "HIRE" | "CONSIDER" | "REJECT";

export interface ICandidateEducation {
  degree: string;
  institution: string;
  year?: string;
}

export interface ICandidateExperience {
  company: string;
  role: string;
  duration?: string;
  description?: string;
}

export interface IResumeSection {
  name: string;
  content: string;
}

export interface ICandidateParsedData {
  skills: string[];
  education: ICandidateEducation[];
  experience: ICandidateExperience[];
  totalExperienceYears?: number;
  sections?: IResumeSection[];
}

export interface ISkillEvidenceMatch {
  section: string;
  excerpt: string;
  similarity: number;
}

export interface ISkillEvidence {
  skill: string;
  matched: boolean;
  matches: ISkillEvidenceMatch[];
}

export interface ICandidate extends Document {
  jobPostingId: Types.ObjectId;
  fullName: string;
  email: string;
  phone?: string;
  resumeUrl: string;
  resumeText?: string;
  parsedData?: ICandidateParsedData;
  skillEvidence?: ISkillEvidence[];
  matchScore?: number;
  recommendation?: HiringRecommendation;
  strengths?: string[];
  weaknesses?: string[];
  aiSummary?: string;
  status: CandidateStatus;
  hiredEmployeeId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CandidateSchema = new Schema<ICandidate>(
  {
    jobPostingId: { type: Schema.Types.ObjectId, ref: "JobPosting", required: true, index: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String },
    resumeUrl: { type: String, required: true },
    resumeText: { type: String },
    parsedData: {
      skills: { type: [String], default: [] },
      education: [{ degree: String, institution: String, year: String }],
      experience: [{ company: String, role: String, duration: String, description: String }],
      totalExperienceYears: { type: Number },
      sections: [{ name: String, content: String }],
    },
    skillEvidence: [{
      skill: { type: String, required: true },
      matched: { type: Boolean, default: false },
      matches: [{ section: String, excerpt: String, similarity: Number }],
    }],
    matchScore: { type: Number, min: 0, max: 100 },
    recommendation: { type: String, enum: ["STRONG_HIRE", "HIRE", "CONSIDER", "REJECT"] },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    aiSummary: { type: String },
    status: {
      type: String,
      enum: ["APPLIED", "SCREENED", "SHORTLISTED", "INTERVIEWING", "INTERVIEWED", "HIRED", "REJECTED"],
      default: "APPLIED",
      index: true,
    },
    hiredEmployeeId: { type: Schema.Types.ObjectId, ref: "Employee" },
  },
  { timestamps: true }
);

CandidateSchema.index({ jobPostingId: 1, matchScore: -1 });

export const Candidate = mongoose.models.Candidate ?? mongoose.model<ICandidate>("Candidate", CandidateSchema);
