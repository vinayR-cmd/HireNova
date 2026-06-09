import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { interviewAgentService } from "@/modules/agents/interview/service";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("hirenova_access")?.value;
    const session = token ? verifyAccessToken(token) : null;

    if (!session || session.role !== "ADMIN") {
      return Response.json({ error: "Access prohibited." }, { status: 403 });
    }

    const { id } = await context.params;
    const interview = await interviewAgentService.getInterview(id);
    return Response.json({ success: true, data: interview }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
