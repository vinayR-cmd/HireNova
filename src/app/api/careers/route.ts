import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { hiringAgentService } from "@/modules/agents/hiring/service";

/**
 * Public, no-auth job board listing — only OPEN postings are visible.
 * Mirrors the "candidates have no accounts" design used by the public
 * interview surface: anyone can browse and apply without registering.
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const data = await hiringAgentService.listJobPostings({ status: "OPEN", page, limit });
    const records = data.records.map(p => ({
      _id: p._id,
      title: p.title,
      department: p.department,
      designation: p.designation,
      description: p.description,
      requiredSkills: p.requiredSkills,
      experienceLevel: p.experienceLevel,
      employmentType: p.employmentType,
      createdAt: p.createdAt,
    }));

    return Response.json({ success: true, data: { records, meta: data.meta } }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
