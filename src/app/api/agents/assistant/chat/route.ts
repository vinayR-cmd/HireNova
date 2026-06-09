import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { assistantAgentService } from "@/modules/agents/assistant/service";
import { assistantChatSchema } from "@/validations/assistant";

/**
 * Unified Onboarding + HR Support chat endpoint. Available to any
 * authenticated employee (including admins, who also have employee
 * profiles) — the agent only ever discusses the caller's own HR data.
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("hirenova_access")?.value;
    const session = token ? verifyAccessToken(token) : null;

    if (!session) {
      return Response.json({ error: "Authentication session expired." }, { status: 401 });
    }

    const body = await request.json();
    const parsed = assistantChatSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message || "Invalid request." }, { status: 400 });
    }

    const result = await assistantAgentService.chat(session.userId, parsed.data.messages);
    return Response.json({ success: true, data: result }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
