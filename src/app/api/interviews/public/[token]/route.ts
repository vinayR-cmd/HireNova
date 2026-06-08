import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { interviewAgentService } from "@/modules/agents/interview/service";
import { submitAnswerSchema } from "@/validations/interview";

/**
 * Public, no-auth surface for the candidate-facing interview experience.
 * Candidates have no user accounts — the unique token in the URL is the
 * sole credential, matching the "public interview link" demo-flow design.
 */
export async function GET(_request: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    await connectDB();
    const { token } = await context.params;
    const interview = await interviewAgentService.getPublicInterview(token);
    return Response.json({ success: true, data: interview }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 404 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    await connectDB();
    const { token } = await context.params;
    const body = await request.json().catch(() => ({}));

    if (body?.action === "begin") {
      const interview = await interviewAgentService.beginInterview(token);
      return Response.json({ success: true, data: interview }, { status: 200 });
    }

    const parsed = submitAnswerSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message || "Invalid request." }, { status: 400 });
    }

    const interview = await interviewAgentService.submitAnswer(token, parsed.data.answer);
    return Response.json({ success: true, data: interview }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
