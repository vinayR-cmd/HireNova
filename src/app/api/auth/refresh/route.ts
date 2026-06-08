import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import {
  COOKIE_ACCESS, COOKIE_REFRESH,
  ACCESS_COOKIE_OPTIONS, REFRESH_COOKIE_OPTIONS,
  verifyRefreshToken, signAccessToken, signRefreshToken,
  JWTPayload,
} from "@/lib/jwt";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(COOKIE_REFRESH)?.value;

  if (!refreshToken) {
    return Response.json({ error: "No refresh token" }, { status: 401 });
  }

  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    cookieStore.delete(COOKIE_ACCESS);
    cookieStore.delete(COOKIE_REFRESH);
    return Response.json({ error: "Invalid refresh token" }, { status: 401 });
  }

  // Verify the user still exists and is ACTIVE — important for suspension/rejection
  // to take effect within the refresh-token window.
  await connectDB();
  const user = await User.findById(decoded.userId).lean();
  if (!user || user.status !== "ACTIVE") {
    cookieStore.delete(COOKIE_ACCESS);
    cookieStore.delete(COOKIE_REFRESH);
    return Response.json({ error: "Account no longer active" }, { status: 401 });
  }

  const payload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    status: user.status,
  };

  const newAccess = signAccessToken(payload);
  const newRefresh = signRefreshToken(payload);

  cookieStore.set(COOKIE_ACCESS, newAccess, ACCESS_COOKIE_OPTIONS);
  cookieStore.set(COOKIE_REFRESH, newRefresh, REFRESH_COOKIE_OPTIONS);

  return Response.json({ success: true }, { status: 200 });
}
