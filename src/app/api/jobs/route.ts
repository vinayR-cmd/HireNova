import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { hiringAgentService } from "@/modules/agents/hiring/service";
import { createJobPostingSchema } from "@/validations/hiring";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("hirenova_access")?.value;
    const session = token ? verifyAccessToken(token) : null;

    if (!session || session.role !== "ADMIN") {
      return Response.json({ error: "Access prohibited." }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status") as "DRAFT" | "OPEN" | "CLOSED" | null;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const data = await hiringAgentService.listJobPostings({ status: status || undefined, page, limit });
    return Response.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("hirenova_access")?.value;
    const session = token ? verifyAccessToken(token) : null;

    if (!session || session.role !== "ADMIN") {
      return Response.json({ error: "Access prohibited." }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createJobPostingSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message || "Invalid job posting data." }, { status: 400 });
    }

    const posting = await hiringAgentService.createJobPosting(session.userId, parsed.data);
    return Response.json({ success: true, data: posting }, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
