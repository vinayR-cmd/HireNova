import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jwt";
import { connectDB } from "@/lib/db";
import { companyRepository } from "@/repositories/company.repository";
import { employeeRepository } from "@/repositories/employee.repository";
import { attendanceRepository } from "@/repositories/attendance.repository";
import { auditRepository } from "@/repositories/audit.repository";
import { startOfDay } from "date-fns";

async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("recruitiq_access")?.value;
  if (!token) return null;
  const session = verifyAccessToken(token);
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

/** GET /api/holidays — list all company holidays */
export async function GET() {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const holidays = await companyRepository.getHolidays();
  return Response.json({ data: holidays });
}

/**
 * POST /api/holidays — declare a new holiday.
 * Body: { date: "YYYY-MM-DD", name: "Holiday Name" }
 * Side effect: upserts HOLIDAY attendance for every active employee on that date.
 */
export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { date, name } = body;

  if (!date || !name?.trim()) {
    return Response.json({ error: "date and name are required." }, { status: 400 });
  }

  await connectDB();

  const holidayDate = startOfDay(new Date(date));
  if (isNaN(holidayDate.getTime())) {
    return Response.json({ error: "Invalid date format." }, { status: 400 });
  }

  // 1. Persist to company holiday list
  await companyRepository.addHoliday(holidayDate, name.trim());

  // 2. Mark all active employees HOLIDAY for that date
  const activeEmployees = await employeeRepository.findActiveEmployees();
  let marked = 0;

  for (const employee of activeEmployees) {
    await attendanceRepository.upsert(employee._id.toString(), holidayDate, {
      employeeId: employee._id as any,
      date: holidayDate,
      status: "HOLIDAY",
      workHours: 0,
      overtimeHours: 0,
      undertimeHours: 0,
      remarks: `Company holiday: ${name.trim()}`,
      markedBy: session.userId as any,
    });
    marked++;
  }

  await auditRepository.log(
    session.userId,
    "ATTENDANCE_UPDATED",
    `Holiday declared: "${name.trim()}" on ${holidayDate.toISOString().split("T")[0]}. Marked ${marked} employees.`
  );

  return Response.json({ success: true, date: holidayDate.toISOString().split("T")[0], name: name.trim(), markedEmployees: marked });
}

/**
 * DELETE /api/holidays — remove a holiday.
 * Body: { date: "YYYY-MM-DD" }
 * Does NOT un-mark attendance (admin should use override if needed).
 */
export async function DELETE(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { date } = body;

  if (!date) return Response.json({ error: "date is required." }, { status: 400 });

  await connectDB();
  const holidayDate = startOfDay(new Date(date));
  if (isNaN(holidayDate.getTime())) {
    return Response.json({ error: "Invalid date format." }, { status: 400 });
  }

  await companyRepository.removeHoliday(holidayDate);

  return Response.json({ success: true });
}
