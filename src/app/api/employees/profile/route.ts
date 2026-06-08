import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { employeeService } from "@/modules/employee/service";

export async function GET() {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("recruitiq_access")?.value;
    const session = token ? verifyAccessToken(token) : null;
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await employeeService.getProfileByUserId(session.userId);
    return Response.json({ success: true, data: profile }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 404 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("recruitiq_access")?.value;
    const session = token ? verifyAccessToken(token) : null;

    if (!session) {
      return Response.json({ error: "Authentication session expired." }, { status: 401 });
    }

    const body = await request.json();
    const updatedProfile = await employeeService.updatePersonalProfile(session.userId, body);

    return Response.json({ success: true, data: updatedProfile }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
