import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { hiringAgentService } from "@/modules/agents/hiring/service";

/**
 * Hire-to-Onboard bridge: converts a candidate straight into an active
 * employee account and hands off to the Onboarding Agent. Closes the loop
 * on the end-to-end demo flow without duplicating the registration pipeline.
 */
export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("hirenova_access")?.value;
    const session = token ? verifyAccessToken(token) : null;

    if (!session || session.role !== "ADMIN") {
      return Response.json({ error: "Access prohibited." }, { status: 403 });
    }

    const { id } = await context.params;
    const result = await hiringAgentService.hireCandidate(session.userId, id);
    return Response.json({ success: true, data: result }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
