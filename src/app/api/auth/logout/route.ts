import { cookies } from "next/headers";
import { COOKIE_ACCESS, COOKIE_REFRESH } from "@/lib/jwt";

export async function POST() {
  const cookieStore = await cookies();
  
  // Clear HTTP-only authentication tokens instantly
  cookieStore.delete(COOKIE_ACCESS);
  cookieStore.delete(COOKIE_REFRESH);

  return Response.json({ success: true, message: "Logged out successfully." }, { status: 200 });
}