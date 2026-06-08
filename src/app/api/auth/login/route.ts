import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { authService } from "@/modules/auth/service";
import { 
  COOKIE_ACCESS, 
  COOKIE_REFRESH, 
  ACCESS_COOKIE_OPTIONS, 
  REFRESH_COOKIE_OPTIONS 
} from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    // 1. Core Rule: Establish/verify database connection at top of every route handler
    await connectDB();

    // 2. Extract and parse incoming credential body
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return Response.json(
        { error: "Email and password inputs are required fields." },
        { status: 400 }
      );
    }

    // 3. Delegate business logic entirely to the module service layer
    const { user, accessToken, refreshToken } = await authService.login(email, password);

    // 4. Next.js 16 Pattern: cookies() is asynchronous and must be awaited
    const cookieStore = await cookies();

    // Attach HTTP-only cryptographic security tokens to client browser state
    cookieStore.set(COOKIE_ACCESS, accessToken, ACCESS_COOKIE_OPTIONS);
    cookieStore.set(COOKIE_REFRESH, refreshToken, REFRESH_COOKIE_OPTIONS);

    // Return the response payload clean of sensitive security tokens
    return Response.json({ success: true, user }, { status: 200 });

  } catch (error: any) {
    console.error("Authentication Route Handler Failure:", error);
    
    return Response.json(
      { error: error.message || "An unexpected system authentication error occurred." },
      { status: error.message?.includes("credentials") ? 401 : 400 }
    );
  }
}