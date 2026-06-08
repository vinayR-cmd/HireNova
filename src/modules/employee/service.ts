import { employeeRepository } from "@/repositories/employee.repository";
import { auditRepository } from "@/repositories/audit.repository";
import { notificationRepository } from "@/repositories/notification.repository";
//@ts-ignore
import { FilterQuery } from "mongoose";
import { IEmployee } from "@/lib/models";

export class EmployeeService {
  /**
   * Retrieves an employee record matched by its internal profile identifier.
   */
  async getProfileById(id: string) {
    const employee = await employeeRepository.findById(id);
    if (!employee) throw new Error("Requested employee profile does not exist.");
    return employee;
  }

  /**
   * Retrieves an employee record mapped to an active authenticating system User ID.
   */
  async getProfileByUserId(userId: string) {
    const employee = await employeeRepository.findByUserId(userId);
    if (!employee) throw new Error("No employee database file corresponds to this user account.");
    return employee;
  }

  /**
   * Enables employees to update their personal contact details and banking records.
   */
  async updatePersonalProfile(userId: string, updateData: {
    mobile?: string;
    address?: string;
    emergencyContact?: { name: string; phone: string; relation: string };
    bankInfo?: { accountHolderName: string; bankName: string; accountNumber: string; ifscCode: string; branchName: string };
    profilePicture?: string;
  }) {
    const employee = await employeeRepository.findByUserId(userId);
    if (!employee) throw new Error("Employee contextual document mapping not found.");

    // Filter updates to prevent manipulation of institutional payroll parameters
    const safePayload = {
      ...(updateData.mobile && { mobile: updateData.mobile }),
      ...(updateData.address && { address: updateData.address }),
      ...(updateData.emergencyContact && { emergencyContact: updateData.emergencyContact }),
      ...(updateData.bankInfo && { bankInfo: updateData.bankInfo }),
      ...(updateData.profilePicture && { profilePicture: updateData.profilePicture }),
    };

    const updated = await employeeRepository.update(employee._id.toString(), safePayload);

    await auditRepository.log(
      userId,
      "EMPLOYEE_UPDATED",
      `Self-managed personal profile updates committed by employee ${employee.fullName}.`
    );

    await notificationRepository.create({
      userId: employee.userId as any,
      type: "PROFILE_UPDATED",
      title: "Profile Updated",
      message: "Your personal contact records have been successfully saved to the portal database.",
    });

    return updated;
  }

  /**
   * Administrator operational gateway to filter and paginate employee profiles.
   */
  async getAllEmployeesForAdmin(filters: {
    department?: string;
    status?: "ACTIVE" | "ON_LEAVE" | "SUSPENDED" | "TERMINATED";
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const query: FilterQuery<IEmployee> = {};
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    if (filters.department) {
      query.department = filters.department;
    }
    if (filters.status) {
      query.employmentStatus = filters.status;
    }
    if (filters.search) {
      query.$or = [
        { fullName: { $regex: filters.search, $options: "i" } },
        { email: { $regex: filters.search, $options: "i" } },
        { employeeId: { $regex: filters.search, $options: "i" } },
      ];
    }

    const records = await employeeRepository.findAll(query, {
      skip,
      limit,
      sort: { employeeId: 1 },
    });
    
    const totalCount = await employeeRepository.count(query);

    return {
      records,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }
}

export const employeeService = new EmployeeService();