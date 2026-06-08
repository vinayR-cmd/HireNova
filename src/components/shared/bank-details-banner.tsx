"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Landmark, X, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";

export function BankDetailsBanner() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only check once per session
    if (sessionStorage.getItem("bankBannerDismissed")) return;

    apiFetch("/api/employees/profile")
      .then(r => r.json())
      .then(payload => {
        const bank = payload.data?.bankInfo;
        const isFilled = bank?.accountNumber && bank?.ifscCode && bank?.bankName;
        if (!isFilled) setShow(true);
      })
      .catch(() => {});
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("bankBannerDismissed", "1");
    setDismissed(true);
    setShow(false);
  };

  const handleGoToProfile = () => {
    sessionStorage.setItem("bankBannerDismissed", "1");
    router.push("/employee/profile");
  };

  if (!show || dismissed) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-500/20 bg-[#12141A] shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/20 bg-amber-500/10">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-amber-500/15 border border-amber-500/20 p-2">
                <Landmark className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-900">Bank Details Required</p>
                <p className="text-xs text-amber-400">Needed for salary disbursement</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="rounded-full p-1.5 text-amber-500 hover:bg-amber-500/15 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-gray-300 leading-relaxed">
              Your bank account details are not filled in yet. Without this information, your salary <strong className="text-gray-100">cannot be disbursed</strong> when payroll is processed.
            </p>
            <p className="text-xs text-gray-500">
              Please fill in your account number, IFSC code, and bank name in your profile to ensure timely salary payments.
            </p>
          </div>

          {/* Actions */}
          <div className="px-6 pb-5 flex items-center gap-3">
            <button
              onClick={handleGoToProfile}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] hover:opacity-90 text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-sm transition-all cursor-pointer"
            >
              Fill Bank Details <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleDismiss}
              className="inline-flex items-center justify-center bg-[#12141A] hover:bg-white/[0.03] text-gray-300 border border-white/10 text-sm font-medium px-5 py-2.5 rounded-full transition-all cursor-pointer"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
