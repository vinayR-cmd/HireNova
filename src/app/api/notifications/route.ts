import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { notificationService } from "@/modules/notification/service";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("recruitiq_access")?.value;
    const session = token ? verifyAccessToken(token) : null;

    if (!session) return Response.json({ error: "Session validation failed." }, { status: 401 });

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const alertFeed = await notificationService.getUserNotifications(session.userId, page, limit);
    return Response.json({ success: true, ...alertFeed }, { status: 200 });
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

    if (!session) return Response.json({ error: "Session validation failed." }, { status: 401 });

    const body = await request.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      await notificationService.flagAllNotificationsAsRead(session.userId);
      return Response.json({ success: true, message: "All alerts read." }, { status: 200 });
    }

    const record = await notificationService.flagNotificationAsRead(notificationId, session.userId);
    return Response.json({ success: true, data: record }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}