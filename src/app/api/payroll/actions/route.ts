import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { payrollService } from "@/modules/payroll/service";

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
    const { action, payrollId } = body;

    if (action === "APPROVE") {
      const approvedRecord = await payrollService.approvePayroll(session.userId, payrollId);
      return Response.json({ success: true, data: approvedRecord }, { status: 200 });
    }

    if (action === "RELEASE") {
      const releasedRecord = await payrollService.releasePayroll(session.userId, payrollId);
      return Response.json({ success: true, data: releasedRecord }, { status: 200 });
    }

    return Response.json({ error: "Invalid action type workflow route parameter." }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}