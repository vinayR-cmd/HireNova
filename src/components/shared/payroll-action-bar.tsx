"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Send, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";

interface Props {
  payrollId: string;
  action: "APPROVE" | "RELEASE";
  label: string;
  tone: "amber" | "emerald";
}

export function PayrollActionBar({ payrollId, action, label, tone }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const Icon = action === "APPROVE" ? ShieldCheck : Send;

  const handleClick = async () => {
    if (action === "RELEASE") {
      const confirmed = window.confirm(
        "Release this payslip to the employee?\n\nOnce released, this slip becomes permanently locked — it cannot be edited, recalculated, or re-run."
      );
      if (!confirmed) return;
    }

    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch("/api/payroll/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payrollId, action }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Action failed.");
      router.refresh();
    } catch (e: unknown) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const baseColor =
    tone === "amber"
      ? "bg-amber-600 hover:bg-amber-700"
      : "bg-emerald-600 hover:bg-emerald-700";

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className={`inline-flex items-center gap-2 ${baseColor} text-white text-xs font-semibold px-5 py-2.5 rounded-full shadow-sm transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none`}
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
        {busy ? "Processing..." : label}
      </button>
      {error && <p className="text-[10px] text-red-400 font-medium">{error}</p>}
    </div>
  );
}
