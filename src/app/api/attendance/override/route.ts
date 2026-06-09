import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { attendanceService } from "@/modules/attendance/service";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("hirenova_access")?.value;
    const session = token ? verifyAccessToken(token) : null;

    if (!session || session.role !== "ADMIN") {
      return Response.json({ error: "Forbidden access matrix profile status." }, { status: 403 });
    }

    const body = await request.json();
    const updatedRecord = await attendanceService.administrativeOverride(session.userId, {
      employeeId: body.employeeId,
      date: new Date(body.date),
      status: body.status,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      remarks: body.remarks,
    });

    return Response.json({ success: true, data: updatedRecord }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}