"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Home, Camera, ChevronDown, ChevronUp, Landmark, Info } from "lucide-react";
import { registerSchema, RegisterInput } from "@/validations/auth";

export default function RegisterPage() {
    const [serverError, setServerError] = useState<string | null>(null);
    const [successState, setSuccessState] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showBankSection, setShowBankSection] = useState(false);
    const [profilePreview, setProfilePreview] = useState<string | null>(null);
    const [profileFile, setProfileFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [bankInfo, setBankInfo] = useState({
        accountHolderName: "",
        bankName: "",
        accountNumber: "",
        ifscCode: "",
        branchName: "",
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
    });

    const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setProfileFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setProfilePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const onSubmit = async (data: RegisterInput) => {
        setIsLoading(true);
        setServerError(null);

        try {
            // Upload profile picture first if provided
            let profilePictureUrl: string | undefined;
            if (profileFile) {
                const formData = new FormData();
                formData.append("file", profileFile);
                const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
                if (uploadRes.ok) {
                    const uploadPayload = await uploadRes.json();
                    profilePictureUrl = uploadPayload.url;
                }
            }

            const hasBankInfo = showBankSection && bankInfo.accountNumber && bankInfo.bankName && bankInfo.ifscCode;

            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    ...(profilePictureUrl ? { profilePicture: profilePictureUrl } : {}),
                    ...(hasBankInfo ? { bankInfo } : {}),
                }),
            });

            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || "Registration request dispatch execution failed.");
            }

            setSuccessState(true);
        } catch (err: any) {
            setServerError(err.message || "An unhandled transaction pipeline failure occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    if (successState) {
        return (
            <div className="min-h-screen w-full bg-[#08090C] text-white flex items-center justify-center px-4">
                <div className="w-full max-w-sm text-center space-y-6">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.05] text-white border border-white/10">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-medium tracking-tight text-white">Application Submitted</h2>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Your profile has been logged. Management will review and approve your account. You will receive an email once approved.
                        </p>
                    </div>
                    <div className="pt-2">
                        <Link href="/login" className="inline-block w-full bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] hover:opacity-90 text-white text-sm font-medium px-6 py-3 rounded-full shadow-md shadow-[oklch(0.62_0.21_291)]/25 transition-all duration-200">
                            Return to Login Panel
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-[#08090C] text-white flex items-center justify-center px-4 py-12">
            <Link href="/" className="fixed top-5 left-5 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#12141A] px-3 py-2 text-xs font-medium text-gray-300 shadow-xs hover:bg-white/[0.03] transition-all">
              <Home className="h-3.5 w-3.5" /> Home
            </Link>
            <div className="w-full max-w-xl space-y-8">

                <div className="text-center">
                    <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-white">
                        Create your HireNova account
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-gray-400">
                        One form for everyone — your access level is decided automatically based on your email
                    </p>
                </div>

                <div className="rounded-xl border border-[oklch(0.62_0.21_291)]/20 bg-[oklch(0.62_0.21_291)]/5 p-4 flex items-start gap-3 text-xs text-gray-300 leading-relaxed">
                    <Info className="h-4 w-4 text-[oklch(0.62_0.21_291)] shrink-0 mt-0.5" />
                    <span>
                        <strong className="text-white">How this works:</strong> Register with your <strong>company email</strong>. If it&apos;s on the pre-authorized admin list, you get full administrator access the moment you sign up — no separate &quot;admin registration&quot; exists. Any other email is submitted as an employee application that an admin must approve before you can log in (you&apos;ll get an email once approved).
                    </span>
                </div>

                {serverError && (
                    <div className="rounded-xl bg-red-500/10 p-4 text-xs text-red-400 border border-red-500/20">
                        {serverError}
                    </div>
                )}

                <form className="mt-6 space-y-6" onSubmit={handleSubmit(onSubmit)}>

                    {/* Profile Picture Upload */}
                    <div className="flex flex-col items-center gap-3">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="relative h-20 w-20 rounded-full border-2 border-dashed border-white/15 bg-white/[0.03] flex items-center justify-center cursor-pointer hover:border-white/20 hover:bg-white/[0.05] transition-all overflow-hidden"
                        >
                            {profilePreview ? (
                                <img src={profilePreview} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                                <Camera className="h-7 w-7 text-gray-500" />
                            )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePicChange} />
                        <p className="text-xs text-gray-500">Profile photo <span className="text-gray-600">(optional)</span></p>
                    </div>

                    <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">

                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Full Legal Name</label>
                            <input type="text" disabled={isLoading} {...register("fullName")} className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all" placeholder="Arjun Sharma" />
                            {errors.fullName && <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.fullName.message}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
                            <input type="email" disabled={isLoading} {...register("email")} className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all" placeholder="arjun.sharma@company.in" />
                            {errors.email && <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Mobile Number</label>
                            <input type="text" disabled={isLoading} {...register("mobile")} className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all" placeholder="98765 43210" />
                            {errors.mobile && <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.mobile.message}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
                            <input type="password" disabled={isLoading} {...register("password")} className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all" placeholder="••••••••" />
                            {errors.password && <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.password.message}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Desired Department</label>
                            <input type="text" disabled={isLoading} {...register("desiredDepartment")} className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all" placeholder="e.g. Engineering" />
                            {errors.desiredDepartment && <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.desiredDepartment.message}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Desired Designation</label>
                            <input type="text" disabled={isLoading} {...register("desiredDesignation")} className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all" placeholder="e.g. Frontend Engineer" />
                            {errors.desiredDesignation && <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.desiredDesignation.message}</p>}
                        </div>

                    </div>

                    {/* Optional Bank Details Section */}
                    <div className="rounded-xl border border-white/10 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setShowBankSection(!showBankSection)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.05] hover:bg-white/[0.05] transition-all text-left"
                        >
                            <div className="flex items-center gap-2">
                                <Landmark className="h-4 w-4 text-gray-400" />
                                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Bank Details</span>
                                <span className="text-[10px] text-gray-500 font-normal normal-case tracking-normal">(optional — required for salary disbursement)</span>
                            </div>
                            {showBankSection ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                        </button>

                        {showBankSection && (
                            <div className="p-4 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 border-t border-white/10">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Account Holder Name</label>
                                    <input type="text" disabled={isLoading} value={bankInfo.accountHolderName} onChange={e => setBankInfo({ ...bankInfo, accountHolderName: e.target.value })} className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all" placeholder="Must match official name" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Bank Name</label>
                                    <input type="text" disabled={isLoading} value={bankInfo.bankName} onChange={e => setBankInfo({ ...bankInfo, bankName: e.target.value })} className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all" placeholder="e.g. HDFC Bank, SBI" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Account Number</label>
                                    <input type="text" disabled={isLoading} value={bankInfo.accountNumber} onChange={e => setBankInfo({ ...bankInfo, accountNumber: e.target.value })} className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all" placeholder="e.g. 501002345678" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">IFSC Code</label>
                                    <input type="text" disabled={isLoading} value={bankInfo.ifscCode} onChange={e => setBankInfo({ ...bankInfo, ifscCode: e.target.value.toUpperCase() })} className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all font-mono uppercase" placeholder="e.g. HDFC0000240" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Branch Name</label>
                                    <input type="text" disabled={isLoading} value={bankInfo.branchName} onChange={e => setBankInfo({ ...bankInfo, branchName: e.target.value })} className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all" placeholder="e.g. DLF CyberHub Branch, Gurugram" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] hover:opacity-90 text-white text-sm font-medium px-6 py-3 rounded-full shadow-md shadow-[oklch(0.62_0.21_291)]/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            {isLoading ? "Submitting..." : "Submit Registry Application"}
                        </button>

                        <Link
                            href="/login"
                            className="w-full bg-[#12141A] hover:bg-white/[0.03] text-gray-200 border border-white/10 text-sm font-medium px-6 py-3 rounded-full text-center shadow-xs transition-all duration-200"
                        >
                            Sign In Instead
                        </Link>
                    </div>
                </form>

            </div>
        </div>
    );
}
