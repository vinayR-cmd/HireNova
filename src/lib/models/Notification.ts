import mongoose, { Document, Schema, Types } from "mongoose";

export type NotificationType =
  | "REGISTRATION_SUBMITTED"
  | "EMPLOYEE_APPROVED"
  | "EMPLOYEE_REJECTED"
  | "SALARY_RELEASED"
  | "PASSWORD_RESET"
  | "PROFILE_UPDATED"
  | "ATTENDANCE_MARKED"
  | "ONBOARDING_WELCOME"
  | "INTERVIEW_INVITATION"
  | "GENERAL";

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["REGISTRATION_SUBMITTED", "EMPLOYEE_APPROVED", "EMPLOYEE_REJECTED", "SALARY_RELEASED", "PASSWORD_RESET", "PROFILE_UPDATED", "ATTENDANCE_MARKED", "ONBOARDING_WELCOME", "INTERVIEW_INVITATION", "GENERAL"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.models.Notification ?? mongoose.model<INotification>("Notification", NotificationSchema);
