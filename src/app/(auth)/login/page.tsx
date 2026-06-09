"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { Home, Info } from "lucide-react";
import { loginSchema, LoginInput } from "@/validations/auth";

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Authentication failed.");
      }

      if (payload.user.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/employee/dashboard");
      }
      router.refresh();
    } catch (err: any) {
      setServerError(err.message || "An unhandled authentication error has occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#08090C] text-white flex items-center justify-center px-4">
      <Link href="/" className="fixed top-5 left-5 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#12141A] px-3 py-2 text-xs font-medium text-gray-300 shadow-xs hover:bg-white/[0.03] transition-all">
        <Home className="h-3.5 w-3.5" /> Home
      </Link>
      <div className="w-full max-w-sm space-y-8">

        {/* Clean, sharp minimalist headers */}
        <div className="text-center">
          <div className="mx-auto mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] shadow-lg shadow-[oklch(0.62_0.21_291)]/30">
            <Image src="/logo.png" alt="HireNova" width={22} height={22} className="object-contain brightness-0 invert" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-white">
            Sign in to HireNova
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-gray-400">
            Access your workforce management panel account
          </p>
        </div>

        {/* First-time user guidance — this is the #1 source of "invalid credentials" confusion:
            people assume an authorized email already has an account. It doesn't until you register. */}
        <div className="rounded-xl border border-[oklch(0.62_0.21_291)]/20 bg-[oklch(0.62_0.21_291)]/5 p-4 flex items-start gap-3 text-xs text-gray-300 leading-relaxed">
          <Info className="h-4 w-4 text-[oklch(0.62_0.21_291)] shrink-0 mt-0.5" />
          <span>
            <strong className="text-white">New here?</strong> You need to <Link href="/register" className="font-semibold text-[oklch(0.62_0.21_291)] hover:underline">create an account</Link> before you can sign in — having an authorized company email doesn&apos;t create one automatically. If your email is pre-approved as an admin, registering grants you full admin access immediately; otherwise an admin must approve your request first.
          </span>
        </div>

        {serverError && (
          <div className="rounded-xl bg-red-500/10 p-4 text-xs text-red-400 border border-red-500/20">
            {serverError}
            {serverError.toLowerCase().includes("invalid") && (
              <p className="mt-2 text-red-400/80">
                Tip: if this is your first time, you likely haven&apos;t registered yet — use <Link href="/register" className="font-semibold underline">Request Access</Link> below.
              </p>
            )}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            
            {/* Input Element: Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                disabled={isLoading}
                {...register("email")}
                className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder-gray-600 focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 sm:text-sm transition-all"
                placeholder="you@company.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-400 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Input Element: Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                disabled={isLoading}
                {...register("password")}
                className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder-gray-600 focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 sm:text-sm transition-all"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-400 font-medium">{errors.password.message}</p>
              )}
            </div>
          </div>

          {/* Action buttons styled exactly like the reference image pills */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] hover:opacity-90 text-white text-sm font-medium px-6 py-3 rounded-full shadow-md shadow-[oklch(0.62_0.21_291)]/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? "Validating Session..." : "Sign In"}
            </button>

            <Link
              href="/register"
              className="w-full bg-[#12141A] hover:bg-white/[0.03] text-gray-200 border border-white/10 text-sm font-medium px-6 py-3 rounded-full text-center shadow-xs transition-all duration-200"
            >
              Request Access
            </Link>
          </div>
        </form>
        
      </div>
    </div>
  );
}