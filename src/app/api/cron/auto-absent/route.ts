import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { employeeRepository } from "@/repositories/employee.repository";
import { attendanceRepository } from "@/repositories/attendance.repository";
import { startOfDay } from "date-fns";

/**
 * Called daily at 22:00 IST by Vercel Cron (or any scheduler).
 * Marks every ACTIVE employee who has no attendance record for today as ABSENT.
 *
 * Security: Vercel Cron sends Authorization: Bearer <CRON_SECRET>.
 * Manual trigger also works via POST with the same header.
 */
export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}

async function handler(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!cronSecret || token !== cronSecret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const today = startOfDay(new Date());
    const activeEmployees = await employeeRepository.findActiveEmployees();

    let markedCount = 0;
    const skipped: string[] = [];

    for (const employee of activeEmployees) {
      const existing = await attendanceRepository.findByEmployeeAndDate(
        employee._id.toString(),
        today
      );

      if (existing) {
        skipped.push(employee.employeeId || employee._id.toString());
        continue;
      }

      await attendanceRepository.upsert(employee._id.toString(), today, {
        employeeId: employee._id as any,
        date: today,
        status: "ABSENT",
        remarks: "Auto-marked absent: no attendance recorded by 22:00.",
      });

      markedCount++;
    }

    return Response.json({
      success: true,
      date: today.toISOString().split("T")[0],
      markedAbsent: markedCount,
      alreadyRecorded: skipped.length,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
