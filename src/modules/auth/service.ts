import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User, Employee } from "@/lib/models";
import { employeeRepository } from "@/repositories/employee.repository";
import { auditRepository } from "@/repositories/audit.repository";
import { notificationRepository } from "@/repositories/notification.repository";
import { signAccessToken, signRefreshToken, JWTPayload } from "@/lib/jwt";
import { connectDB } from "@/lib/db";

export class AuthService {
  /**
   * Registers a new employee account in a PENDING state.
   * Admins cannot self-register through this workflow.
   */
  async registerEmployee(data: {
    fullName: string;
    email: string;
    mobile: string;
    password: string;
    desiredDepartment: string;
    desiredDesignation: string;
    profilePicture?: string;
    bankInfo?: {
      accountHolderName: string;
      bankName: string;
      accountNumber: string;
      ifscCode: string;
      branchName: string;
    };
  }) {
    await connectDB();
    const normalizedEmail = data.email.toLowerCase().trim();

    // Guard: Check if credentials/user already exist
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new Error("An account with this email address already exists.");
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Emails listed in ADMIN_EMAILS get an instantly-active admin account — no
    // approval queue and no employee profile (admins aren't workforce members).
    // This is what makes the platform self-bootstrapping: the very first run has
    // no admin in the database, and there is no separate admin-provisioning tool.
    const adminEmails = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || [];
    if (adminEmails.includes(normalizedEmail)) {
      const newAdmin = await User.create({
        email: normalizedEmail,
        password: hashedPassword,
        role: "ADMIN",
        status: "ACTIVE",
      });

      await auditRepository.create({
        performedBy: newAdmin._id as mongoose.Types.ObjectId,
        action: "USER_REGISTERED",
        targetId: newAdmin._id as mongoose.Types.ObjectId,
        targetModel: "User",
        description: `Administrator account self-provisioned for ${normalizedEmail} via the configured ADMIN_EMAILS allowlist.`,
      });

      return {
        userId: newAdmin._id,
        email: newAdmin.email,
        status: newAdmin.status,
      };
    }

    // Execute registration inside a Mongoose transaction to guarantee atomic execution
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create global authenticating User document
      const [newUser] = await User.create(
        [
          {
            email: normalizedEmail,
            password: hashedPassword,
            role: "EMPLOYEE",
            status: "PENDING",
          },
        ],
        { session }
      );

      // Create linked Employee information record
      const employeeProfile = await employeeRepository.create({
        userId: newUser._id as mongoose.Types.ObjectId,
        fullName: data.fullName,
        email: normalizedEmail,
        mobile: data.mobile,
        desiredDepartment: data.desiredDepartment,
        desiredDesignation: data.desiredDesignation,
        employmentStatus: "ACTIVE", // Base status, but access blocked until User.status is ACTIVE
        ...(data.profilePicture ? { profilePicture: data.profilePicture } : {}),
        ...(data.bankInfo ? { bankInfo: data.bankInfo } : {}),
      });

      // Log action to Audit Trail
      await auditRepository.create({
        performedBy: newUser._id as mongoose.Types.ObjectId,
        action: "USER_REGISTERED",
        targetId: employeeProfile._id as mongoose.Types.ObjectId,
        targetModel: "Employee",
        description: `Employee self-registered account for ${data.fullName} (${normalizedEmail}). Status: PENDING.`,
      });

      // Dispatch real-time in-app notification system item
      await notificationRepository.create({
        userId: newUser._id as mongoose.Types.ObjectId,
        type: "REGISTRATION_SUBMITTED",
        title: "Registration Submitted",
        message: "Your HR profile has been created and is awaiting administrator approval.",
      });

      await session.commitTransaction();
      session.endSession();

      return {
        userId: newUser._id,
        email: newUser.email,
        status: newUser.status,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Authenticates user access requests and returns signable JWT metadata.
   */
  async login(email: string, password: string) {
    await connectDB();
    const normalizedEmail = email.toLowerCase().trim();

    // Explicitly select password field since it's hidden by default in the schema definition
    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user) {
      throw new Error("Invalid email or password credentials provided.");
    }

    // Verify password match
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      throw new Error("Invalid email or password credentials provided.");
    }

    // Evaluate Account status lifecycle state machine
    if (user.status === "PENDING") {
      throw new Error("Your account application is currently pending administrator approval.");
    }
    if (user.status === "SUSPENDED") {
      throw new Error("This account profile has been suspended. Please contact HR operations.");
    }
    if (user.status === "REJECTED") {
      throw new Error("Your registration application was rejected by management.");
    }

    // Retrieve corresponding employee details if appropriate
    let employeeDetails = null;
    if (user.role === "EMPLOYEE") {
      employeeDetails = await employeeRepository.findByUserId(user._id.toString());
    }

    const payload: JWTPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      status: user.status,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Async Audit Logging without blocking presentation response thread
    auditRepository.log(
      user._id.toString(),
      "USER_LOGIN",
      `Successful authentication session established for ${user.email} [Role: ${user.role}]`
    ).catch(err => console.error("Failed writing login audit log record:", err));

    return {
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        status: user.status,
        fullName: employeeDetails?.fullName || "System Administrator",
        employeeId: employeeDetails?.employeeId || null,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Securely transitions authentication keys under an authenticated user workflow context
   */
  async changePassword(userId: string, current: string, next: string) {
    await connectDB();

    const user = await User.findById(userId).select("+password");
    if (!user) throw new Error("Target user profile reference could not be located.");

    const match = await bcrypt.compare(current, user.password);
    if (!match) throw new Error("The operational current password context verification failed.");

    user.password = await bcrypt.hash(next, 12);
    await user.save();

    await auditRepository.log(
      userId,
      "PASSWORD_CHANGED",
      "User password updated successfully via portal settings dashboard configuration."
    );

    return { success: true };
  }
}

export const authService = new AuthService();