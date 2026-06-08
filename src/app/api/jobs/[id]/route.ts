import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { hiringAgentService } from "@/modules/agents/hiring/service";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("recruitiq_access")?.value;
    const session = token ? verifyAccessToken(token) : null;

    if (!session || session.role !== "ADMIN") {
      return Response.json({ error: "Access prohibited." }, { status: 403 });
    }

    const { id } = await context.params;
    const [posting, candidates] = await Promise.all([
      hiringAgentService.getJobPosting(id),
      hiringAgentService.listCandidates(id),
    ]);

    return Response.json({ success: true, data: { posting, candidates } }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("recruitiq_access")?.value;
    const session = token ? verifyAccessToken(token) : null;

    if (!session || session.role !== "ADMIN") {
      return Response.json({ error: "Access prohibited." }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    if (!["DRAFT", "OPEN", "CLOSED"].includes(body.status)) {
      return Response.json({ error: "Invalid status value." }, { status: 400 });
    }

    const posting = await hiringAgentService.updateJobPostingStatus(session.userId, id, body.status);
    return Response.json({ success: true, data: posting }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
