import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { authService } from "@/modules/auth/service";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const registrationResult = await authService.registerEmployee({
      fullName: body.fullName,
      email: body.email,
      mobile: body.mobile,
      password: body.password,
      desiredDepartment: body.desiredDepartment,
      desiredDesignation: body.desiredDesignation,
      profilePicture: body.profilePicture,
      bankInfo: body.bankInfo,
    });

    return Response.json({ success: true, user: registrationResult }, { status: 201 });
  } catch (error: any) {
    console.error("Registration Route Handler Failure:", error);
    return Response.json({ error: error.message || "Registration failed." }, { status: 400 });
  }
}