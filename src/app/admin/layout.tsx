import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jwt";
import { AdminShell } from "@/components/shared/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("recruitiq_access")?.value;
  const payload = token ? verifyAccessToken(token) : null;

  if (!payload || payload.role !== "ADMIN") {
    redirect("/login");
  }

  const userContext = {
    fullName: "System Administrator",
    email: payload.email,
    role: payload.role,
  };

  return <AdminShell user={userContext}>{children}</AdminShell>;
}
