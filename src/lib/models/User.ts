import mongoose, { Document, Schema } from "mongoose";

export type UserRole = "ADMIN" | "EMPLOYEE";
export type UserStatus = "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";

export interface IUser extends Document {
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["ADMIN", "EMPLOYEE"], required: true },
    status: { type: String, enum: ["PENDING", "ACTIVE", "REJECTED", "SUSPENDED"], default: "PENDING" },
  },
  { timestamps: true }
);

export const User = mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);
