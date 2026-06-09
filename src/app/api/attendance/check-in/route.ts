import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { attendanceService } from "@/modules/attendance/service";

export async function POST() {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("hirenova_access")?.value;
    const session = token ? verifyAccessToken(token) : null;

    if (!session) return Response.json({ error: "Session missing." }, { status: 401 });

    const attendanceRecord = await attendanceService.checkIn(session.userId);
    return Response.json({ success: true, data: attendanceRecord }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}