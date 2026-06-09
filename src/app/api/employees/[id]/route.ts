import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { employeeRepository } from "@/repositories/employee.repository";

const NUMBER_FIELDS = [
  "grossSalary", "basicSalary", "hraAmount",
  "specialAllowance", "performancePay", "bonus", "incentive", "otherAllowances",
  "overtimeMultiplier",
];
const BOOLEAN_FIELDS = ["hraEnabled", "pfEnabled"];
const STRING_FIELDS = [
  "department", "designation", "officialDepartment", "officialDesignation",
  "employmentType", "employmentStatus", "panNumber", "uanNumber", "joiningDate",
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("hirenova_access")?.value;
    const session = token ? verifyAccessToken(token) : null;

    if (!session || session.role !== "ADMIN") {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const allowed: Record<string, unknown> = {};

    for (const key of NUMBER_FIELDS) {
      if (typeof body[key] === "number") allowed[key] = body[key];
    }
    for (const key of BOOLEAN_FIELDS) {
      if (typeof body[key] === "boolean") allowed[key] = body[key];
    }
    for (const key of STRING_FIELDS) {
      if (typeof body[key] === "string") allowed[key] = body[key];
    }

    if (Object.keys(allowed).length === 0) {
      return Response.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updated = await employeeRepository.update(id, { $set: allowed });
    if (!updated) return Response.json({ error: "Employee not found" }, { status: 404 });

    return Response.json({ success: true, data: updated }, { status: 200 });
  } catch (error: unknown) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
