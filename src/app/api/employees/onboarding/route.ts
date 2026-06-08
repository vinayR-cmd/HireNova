import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { approvalService } from "@/modules/approval/service";

// Get all applications pending approval
export async function GET() {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("recruitiq_access")?.value;
    const session = token ? verifyAccessToken(token) : null;

    if (!session || session.role !== "ADMIN") {
      return Response.json({ error: "Access prohibited." }, { status: 403 });
    }

    const pendingList = await approvalService.getPendingRegistrations();
    return Response.json({ success: true, data: pendingList }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}

// Handle Approve or Reject execution pathways
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("recruitiq_access")?.value;
    const session = token ? verifyAccessToken(token) : null;

    if (!session || session.role !== "ADMIN") {
      return Response.json({ error: "Access prohibited." }, { status: 403 });
    }

    const body = await request.json();
    const {
      action, employeeProfileId,
      department, designation, employmentType,
      basicSalary, grossSalary,
      joiningDate, panNumber, uanNumber,
      reason,
    } = body;

    if (action === "APPROVE") {
      const approvedEmployee = await approvalService.approveEmployeeOnboarding(session.userId, employeeProfileId, {
        department,
        designation,
        employmentType,
        basicSalary,
        grossSalary,
        joiningDate: new Date(joiningDate),
        panNumber,
        uanNumber,
      });
      return Response.json({ success: true, data: approvedEmployee }, { status: 200 });
    }
    
    if (action === "REJECT") {
      await approvalService.rejectEmployeeOnboarding(session.userId, employeeProfileId, reason);
      return Response.json({ success: true, message: "Onboarding application rejected." }, { status: 200 });
    }

    return Response.json({ error: "Invalid action parameter supplied." }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}