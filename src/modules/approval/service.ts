import mongoose from "mongoose";
import { employeeRepository } from "@/repositories/employee.repository";
import { auditRepository } from "@/repositories/audit.repository";
import { notificationRepository } from "@/repositories/notification.repository";
import { emailService } from "@/services/email";
import { User } from "@/lib/models/User";

export class ApprovalService {
  /**
   * Returns all registration items awaiting administrative screening.
   */
  async getPendingRegistrations() {
    return employeeRepository.findPendingApprovals();
  }

  /**
   * Formally authorizes a pending application, assigns a unique corporate Employee ID, and activates portal access credentials.
   */
  async approveEmployeeOnboarding(
    adminUserId: string,
    employeeProfileId: string,
    allocationData: {
      department: string;
      designation: string;
      employmentType?: string;
      basicSalary?: number;
      grossSalary: number;
      joiningDate: Date;
      panNumber?: string;
      uanNumber?: string;
    }
  ) {
    const employee = await employeeRepository.findById(employeeProfileId);
    if (!employee) throw new Error("Target registration profile reference not found.");

    const linkedUser = await User.findById(employee.userId);
    if (!linkedUser || linkedUser.status !== "PENDING") {
      throw new Error("Linked login record status state cannot be processed for activation onboarding.");
    }

    // Generate the sequential unique corporate tracker ID
    const nextId = await employeeRepository.getNextEmployeeId();

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Advance the master authentication credentials status record mapping
      linkedUser.status = "ACTIVE";
      await linkedUser.save({ session });

      // 2. Hydrate official contract data fields into the employee profile document
      const operationalPayload = {
        employeeId: nextId,
        department: allocationData.department,
        designation: allocationData.designation,
        officialDepartment: allocationData.department,
        officialDesignation: allocationData.designation,
        employmentType: allocationData.employmentType || "FULL_TIME",
        basicSalary: allocationData.basicSalary ?? allocationData.grossSalary,
        grossSalary: allocationData.grossSalary,
        joiningDate: allocationData.joiningDate,
        employmentStatus: "ACTIVE" as const,
        ...(allocationData.panNumber ? { panNumber: allocationData.panNumber } : {}),
        ...(allocationData.uanNumber ? { uanNumber: allocationData.uanNumber } : {}),
      };

      const updatedEmployee = await employeeRepository.update(employee._id.toString(), operationalPayload);

      // 3. Log data audit trails
      await auditRepository.create({
        performedBy: new mongoose.Types.ObjectId(adminUserId),
        action: "EMPLOYEE_APPROVED",
        targetId: employee._id as mongoose.Types.ObjectId,
        targetModel: "Employee",
        description: `Approved self-registration request for ${employee.fullName}. Assigned ID: ${nextId}.`,
      });

      // 4. Record internal portal alert index entries
      await notificationRepository.create({
        userId: linkedUser._id as mongoose.Types.ObjectId,
        type: "EMPLOYEE_APPROVED",
        title: "Account Approved",
        message: `Welcome to the organization! Your corporate access account has been assigned ID ${nextId}.`,
      });

      await session.commitTransaction();
      session.endSession();

      // 5. Fire external email notifier routine asynchronously — include bank detail reminder if not filled
      const hasBankDetails = !!(employee.bankInfo?.accountNumber && employee.bankInfo?.ifscCode);
      emailService.sendAccountApprovedEmail(employee.email, employee.fullName, nextId, hasBankDetails)
        .catch(err => console.error("Onboarding notification email failed to dispatch:", err));

      return updatedEmployee;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Rejects an application submission and updates system tracking.
   */
  async rejectEmployeeOnboarding(adminUserId: string, employeeProfileId: string, reason: string) {
    if (!reason?.trim()) throw new Error("A clear rejection rationale explanation must be documented.");

    const employee = await employeeRepository.findById(employeeProfileId);
    if (!employee) throw new Error("Target account profile data map cannot be located.");

    const linkedUser = await User.findById(employee.userId);
    if (!linkedUser || linkedUser.status !== "PENDING") {
      throw new Error("Linked tracking login status is ineligible for rejection processing workflows.");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      linkedUser.status = "REJECTED";
      await linkedUser.save({ session });

      await employeeRepository.update(employee._id.toString(), {
        rejectionReason: reason,
      });

      await auditRepository.create({
        performedBy: new mongoose.Types.ObjectId(adminUserId),
        action: "EMPLOYEE_REJECTED",
        targetId: employee._id as mongoose.Types.ObjectId,
        targetModel: "Employee",
        description: `Rejected registration file submission for ${employee.fullName}. Reason: ${reason}`,
      });

      await session.commitTransaction();
      session.endSession();

      emailService.sendAccountRejectedEmail(employee.email, employee.fullName, reason)
        .catch(err => console.error("Rejection notification transactional dispatch routine failed:", err));

      return { success: true };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}

export const approvalService = new ApprovalService();