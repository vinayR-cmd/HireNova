import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { settingsService } from "@/modules/settings/service";

export async function GET() {
  try {
    await connectDB();
    const companySettings = await settingsService.getCompanyConfigurationSettings();
    return Response.json({ success: true, data: companySettings }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("recruitiq_access")?.value;
    const session = token ? verifyAccessToken(token) : null;

    if (!session || session.role !== "ADMIN") {
      return Response.json({ error: "Access denied." }, { status: 403 });
    }

    const body = await request.json();
    const updatedSettings = await settingsService.updateCompanyConfiguration(session.userId, body);

    return Response.json({ success: true, data: updatedSettings }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}