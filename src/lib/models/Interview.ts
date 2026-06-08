import mongoose, { Document, Schema, Types } from "mongoose";

export type InterviewStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
export type InterviewQuestionCategory = "TECHNICAL" | "BEHAVIORAL" | "PROBLEM_SOLVING";
export type InterviewDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface IInterviewQuestion {
  question: string;
  category: InterviewQuestionCategory;
  difficulty: InterviewDifficulty;
  answer?: string;
  score?: number;
  feedback?: string;
}

export interface IInterviewReport {
  technicalScore: number;
  communicationScore: number;
  confidenceScore: number;
  problemSolvingScore: number;
  overallScore: number;
  recommendation: "STRONG_HIRE" | "HIRE" | "CONSIDER" | "REJECT";
  summary: string;
  strengths: string[];
  weaknesses: string[];
}

export interface IInterview extends Document {
  candidateId: Types.ObjectId;
  jobPostingId: Types.ObjectId;
  token: string;
  status: InterviewStatus;
  questions: IInterviewQuestion[];
  currentIndex: number;
  report?: IInterviewReport;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewQuestionSchema = new Schema<IInterviewQuestion>(
  {
    question: { type: String, required: true },
    category: { type: String, enum: ["TECHNICAL", "BEHAVIORAL", "PROBLEM_SOLVING"], required: true },
    difficulty: { type: String, enum: ["EASY", "MEDIUM", "HARD"], required: true },
    answer: { type: String },
    score: { type: Number, min: 0, max: 10 },
    feedback: { type: String },
  },
  { _id: false }
);

const InterviewReportSchema = new Schema<IInterviewReport>(
  {
    technicalScore: { type: Number, min: 0, max: 100 },
    communicationScore: { type: Number, min: 0, max: 100 },
    confidenceScore: { type: Number, min: 0, max: 100 },
    problemSolvingScore: { type: Number, min: 0, max: 100 },
    overallScore: { type: Number, min: 0, max: 100 },
    recommendation: { type: String, enum: ["STRONG_HIRE", "HIRE", "CONSIDER", "REJECT"] },
    summary: { type: String },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
  },
  { _id: false }
);

const InterviewSchema = new Schema<IInterview>(
  {
    candidateId: { type: Schema.Types.ObjectId, ref: "Candidate", required: true, index: true },
    jobPostingId: { type: Schema.Types.ObjectId, ref: "JobPosting", required: true },
    token: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"], default: "NOT_STARTED", index: true },
    questions: { type: [InterviewQuestionSchema], default: [] },
    currentIndex: { type: Number, default: 0 },
    report: { type: InterviewReportSchema },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const Interview = mongoose.models.Interview ?? mongoose.model<IInterview>("Interview", InterviewSchema);
