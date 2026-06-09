import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { LeaveRequest } from "@/lib/models/LeaveRequest";
import { Attendance } from "@/lib/models/Attendance";

// Admin: approve or reject a leave request
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("hirenova_access")?.value;
    const session = token ? verifyAccessToken(token) : null;
    if (!session || session.role !== "ADMIN") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { leaveRequestId, action, adminRemark } = body;

    if (!leaveRequestId || !["APPROVE", "REJECT"].includes(action)) {
      return Response.json({ error: "leaveRequestId and action (APPROVE/REJECT) are required." }, { status: 400 });
    }

    const leaveReq = await LeaveRequest.findById(leaveRequestId);
    if (!leaveReq) return Response.json({ error: "Leave request not found." }, { status: 404 });
    if (leaveReq.status !== "PENDING") {
      return Response.json({ error: "This request has already been reviewed." }, { status: 400 });
    }

    leaveReq.status = action === "APPROVE" ? "APPROVED" : "REJECTED";
    leaveReq.adminRemark = adminRemark?.trim() || undefined;
    leaveReq.reviewedAt = new Date();
    await leaveReq.save();

    // If approved, mark each day as LEAVE in Attendance
    if (action === "APPROVE") {
      const from = new Date(leaveReq.fromDate);
      const to = new Date(leaveReq.toDate);
      const dates: Date[] = [];
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
      }
      await Promise.all(
        dates.map((date) =>
          Attendance.findOneAndUpdate(
            { employeeId: leaveReq.employeeId, date: { $gte: new Date(date.setHours(0,0,0,0)), $lt: new Date(date.setHours(23,59,59,999)) } },
            { $setOnInsert: { employeeId: leaveReq.employeeId, date, status: "LEAVE", workHours: 0, overtimeHours: 0, undertimeHours: 0, remarks: `Leave: ${leaveReq.leaveType}` } },
            { upsert: true, new: true }
          ).catch(() => null)
        )
      );
    }

    return Response.json({ success: true, data: leaveReq });
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to review leave request." }, { status: 500 });
  }
}
