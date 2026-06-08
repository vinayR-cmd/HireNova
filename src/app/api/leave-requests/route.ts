import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { LeaveRequest } from "@/lib/models/LeaveRequest";
import { employeeRepository } from "@/repositories/employee.repository";

// Employee: submit leave request; Admin: list all pending requests
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("recruitiq_access")?.value;
    const session = token ? verifyAccessToken(token) : null;
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

    if (session.role === "ADMIN") {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get("status") || "PENDING";
      const requests = await LeaveRequest.find(status === "ALL" ? {} : { status })
        .populate("employeeId", "fullName employeeId department")
        .sort({ createdAt: -1 });
      return Response.json({ success: true, data: requests });
    }

    // Employee: fetch own leave requests
    const employee = await employeeRepository.findByUserId(session.userId);
    if (!employee) return Response.json({ error: "Employee profile not found." }, { status: 404 });

    const requests = await LeaveRequest.find({ employeeId: employee._id }).sort({ createdAt: -1 });
    return Response.json({ success: true, data: requests });
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to fetch leave requests." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("recruitiq_access")?.value;
    const session = token ? verifyAccessToken(token) : null;
    if (!session || session.role !== "EMPLOYEE") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employee = await employeeRepository.findByUserId(session.userId);
    if (!employee) return Response.json({ error: "Employee profile not found." }, { status: 404 });

    const body = await request.json();
    const { leaveType, fromDate, toDate, reason } = body;

    if (!leaveType || !fromDate || !toDate || !reason?.trim()) {
      return Response.json({ error: "Leave type, dates, and reason are required." }, { status: 400 });
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (isNaN(from.getTime()) || isNaN(to.getTime()) || from > to) {
      return Response.json({ error: "Invalid date range provided." }, { status: 400 });
    }

    // Calculate business days (inclusive, simple count)
    const msPerDay = 86400000;
    const totalDays = Math.round((to.getTime() - from.getTime()) / msPerDay) + 1;

    const leaveRequest = await LeaveRequest.create({
      employeeId: employee._id,
      leaveType,
      fromDate: from,
      toDate: to,
      totalDays,
      reason: reason.trim(),
      status: "PENDING",
    });

    return Response.json({ success: true, data: leaveRequest }, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to submit leave request." }, { status: 500 });
  }
}
