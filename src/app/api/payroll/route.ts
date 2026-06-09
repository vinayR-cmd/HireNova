import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { payrollRepository } from "@/repositories/payroll.repository";
import { payrollService } from "@/modules/payroll/service";

// Fetch payroll breakdowns by month/year period
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("hirenova_access")?.value;
    const session = token ? verifyAccessToken(token) : null;

    if (!session || session.role !== "ADMIN") {
      return Response.json({ error: "Access denied." }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1), 10);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()), 10);
    const status = (searchParams.get("status") as any) || undefined;

    const summaryList = await payrollRepository.findByMonthYear(month, year, status);
    return Response.json({ success: true, data: summaryList }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}

// Generate the monthly batch run
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("hirenova_access")?.value;
    const session = token ? verifyAccessToken(token) : null;

    if (!session || session.role !== "ADMIN") {
      return Response.json({ error: "Access denied." }, { status: 403 });
    }

    const body = await request.json();
    const runSummary = await payrollService.generateMonthlyPayroll(session.userId, body.month, body.year);

    return Response.json({ success: true, data: runSummary }, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}