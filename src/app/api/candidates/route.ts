import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { hiringAgentService } from "@/modules/agents/hiring/service";
import { candidateApplicationSchema } from "@/validations/hiring";

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
    const jobPostingId = searchParams.get("jobPostingId");
    if (!jobPostingId) {
      return Response.json({ error: "jobPostingId query parameter is required." }, { status: 400 });
    }

    const candidates = await hiringAgentService.listCandidates(jobPostingId);
    return Response.json({ success: true, data: candidates }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}

/**
 * Resume intake endpoint — the heart of the Hiring Agent demo flow.
 * Accepts multipart/form-data: jobPostingId, fullName, email, phone?, file (PDF).
 * Parses the resume, scores it against the job description, and stores the verdict.
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("hirenova_access")?.value;
    const session = token ? verifyAccessToken(token) : null;

    if (!session || session.role !== "ADMIN") {
      return Response.json({ error: "Access prohibited." }, { status: 403 });
    }

    const formData = await request.formData();
    const parsed = candidateApplicationSchema.safeParse({
      jobPostingId: formData.get("jobPostingId"),
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      phone: formData.get("phone") || undefined,
    });
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message || "Invalid candidate details." }, { status: 400 });
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "A resume PDF file is required." }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return Response.json({ error: "Only PDF resumes are supported." }, { status: 400 });
    }
    if (file.size > 8 * 1024 * 1024) {
      return Response.json({ error: "Resume file is too large (max 8MB)." }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const candidate = await hiringAgentService.submitCandidate({
      ...parsed.data,
      fileBuffer,
      filename: file.name,
    });

    return Response.json({ success: true, data: candidate }, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
