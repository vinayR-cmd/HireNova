import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jwt";
import { connectDB } from "@/lib/db";
import { calendarService } from "@/modules/calendar/service";

async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("recruitiq_access")?.value;
  if (!token) return null;
  const session = verifyAccessToken(token);
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

/**
 * GET /api/calendar/custom-days?month=MM&year=YYYY
 * Retrieve all overrides and holidays for a given month and year.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return Response.json({ error: "Unauthorized access parameter configuration." }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const today = new Date();
    const month = parseInt(searchParams.get("month") || "", 10) || today.getMonth() + 1;
    const year = parseInt(searchParams.get("year") || "", 10) || today.getFullYear();

    const data = await calendarService.getCustomDaysAndHolidays(month, year);
    return Response.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}

/**
 * POST /api/calendar/custom-days
 * Create, update, or revert custom day timing and holidays overrides.
 * Body payload: { action: "SET" | "REVERT", date: Date, isHoliday?: boolean, holidayName?: string, officeStartTime?: string, officeEndTime?: string, totalDailyHours?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return Response.json({ error: "Unauthorized access parameter configuration." }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { action, date } = body;

    if (!date) {
      return Response.json({ error: "Date parameter is required." }, { status: 400 });
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return Response.json({ error: "Invalid date format provided." }, { status: 400 });
    }

    if (action === "REVERT") {
      const result = await calendarService.revertCustomDay(session.userId, targetDate);
      return Response.json({ success: true, data: result }, { status: 200 });
    }

    if (action === "SET") {
      const { isHoliday, holidayName, officeStartTime, officeEndTime, totalDailyHours } = body;

      if (isHoliday === undefined) {
        return Response.json({ error: "isHoliday toggle parameter is required." }, { status: 400 });
      }

      const result = await calendarService.setCustomDay(session.userId, {
        date: targetDate,
        isHoliday,
        holidayName: holidayName?.trim(),
        officeStartTime,
        officeEndTime,
        totalDailyHours: totalDailyHours ? parseFloat(totalDailyHours) : undefined,
      });

      return Response.json({ success: true, data: result }, { status: 200 });
    }

    return Response.json({ error: "Invalid calendar update action type specified." }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
