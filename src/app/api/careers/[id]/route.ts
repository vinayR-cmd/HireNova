import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { hiringAgentService } from "@/modules/agents/hiring/service";

/**
 * Public, no-auth single-job-posting view for the careers page.
 * Only OPEN postings are visible — DRAFT/CLOSED return 404 to outsiders.
 */
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await context.params;
    const posting = await hiringAgentService.getJobPosting(id);

    if (posting.status !== "OPEN") {
      return Response.json({ error: "This job posting is no longer accepting applications." }, { status: 404 });
    }

    return Response.json({
      success: true,
      data: {
        _id: posting._id,
        title: posting.title,
        department: posting.department,
        designation: posting.designation,
        description: posting.description,
        requiredSkills: posting.requiredSkills,
        experienceLevel: posting.experienceLevel,
        employmentType: posting.employmentType,
        createdAt: posting.createdAt,
      },
    }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 404 });
  }
}
