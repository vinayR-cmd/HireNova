import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jwt";
import { employeeService } from "@/modules/employee/service";
import { EmployeeShell } from "@/components/shared/employee-shell";

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("hirenova_access")?.value;
  const payload = token ? verifyAccessToken(token) : null;

  if (!payload || payload.role !== "EMPLOYEE") {
    redirect("/login");
  }

  let userContextData = {
    fullName: "Employee",
    email: payload.email,
    role: payload.role,
  };

  try {
    const profile = await employeeService.getProfileByUserId(payload.userId);
    if (profile) userContextData.fullName = profile.fullName;
  } catch {
    // keep default
  }

  return <EmployeeShell user={userContextData}>{children}</EmployeeShell>;
}
