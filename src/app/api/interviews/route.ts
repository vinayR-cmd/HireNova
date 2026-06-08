import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { interviewAgentService } from "@/modules/agents/interview/service";
import { createInterviewSchema } from "@/validations/interview";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("recruitiq_access")?.value;
    const session = token ? verifyAccessToken(token) : null;

    if (!session || session.role !== "ADMIN") {
      return Response.json({ error: "Access prohibited." }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const candidateId = searchParams.get("candidateId");
    if (!candidateId) {
      return Response.json({ error: "candidateId query parameter is required." }, { status: 400 });
    }

    const interview = await interviewAgentService.getByCandidateId(candidateId);
    if (!interview) {
      return Response.json({ error: "No interview found for this candidate." }, { status: 404 });
    }
    return Response.json({ success: true, data: interview }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}

/**
 * Admin-triggered: generates a bespoke AI interview for a shortlisted
 * candidate and mints the public link the candidate will use.
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("recruitiq_access")?.value;
    const session = token ? verifyAccessToken(token) : null;

    if (!session || session.role !== "ADMIN") {
      return Response.json({ error: "Access prohibited." }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createInterviewSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message || "Invalid request." }, { status: 400 });
    }

    const interview = await interviewAgentService.startInterview(session.userId, parsed.data.candidateId);
    return Response.json({ success: true, data: interview }, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
