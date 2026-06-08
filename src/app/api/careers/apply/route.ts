import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { hiringAgentService } from "@/modules/agents/hiring/service";
import { candidateApplicationSchema } from "@/validations/hiring";

/**
 * Public, no-auth application intake — the candidate-side counterpart to the
 * admin's manual "add candidate" form. Candidates have no accounts (same design
 * as the public interview surface), so a resume upload here is their entire
 * interaction with the system until they're hired. Runs through the exact same
 * Hiring Agent pipeline: PDF text extraction -> AI parsing -> AI scoring.
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();
    const parsed = candidateApplicationSchema.safeParse({
      jobPostingId: formData.get("jobPostingId"),
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      phone: formData.get("phone") || undefined,
    });
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message || "Please fill in all required fields." }, { status: 400 });
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

    const posting = await hiringAgentService.getJobPosting(parsed.data.jobPostingId);
    if (posting.status !== "OPEN") {
      return Response.json({ error: "This job posting is no longer accepting applications." }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const candidate = await hiringAgentService.submitCandidate({
      ...parsed.data,
      fileBuffer,
      filename: file.name,
    });

    return Response.json({
      success: true,
      data: { id: candidate._id, fullName: candidate.fullName, jobTitle: posting.title },
    }, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
