"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";

interface ClockWidgetProps {
  initialStatus: {
    hasCheckedIn: boolean;
    hasCheckedOut: boolean;
    checkInTime: Date | string | null;
    checkOutTime: Date | string | null;
  };
}

export function ClockWidget({ initialStatus }: ClockWidgetProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const formatTime = (dateString: Date | string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false, // 24-hour presentation standard matching corporate compliance
    });
  };

  const handleClockAction = async (actionType: "check-in" | "check-out") => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await apiFetch(`/api/attendance/${actionType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || `Failed to execute ${actionType}.`);
      }

      setMessage({
        type: "success",
        text: actionType === "check-in"
          ? "Check-in logged successfully! Have a productive shift."
          : "Check-out logged successfully! Shift completed.",
      });

      if (actionType === "check-in") {
        setStatus(prev => ({
          ...prev,
          hasCheckedIn: true,
          checkInTime: payload.data.checkIn,
        }));
      } else {
        setStatus(prev => ({
          ...prev,
          hasCheckedOut: true,
          checkOutTime: payload.data.checkOut,
        }));
      }

      router.refresh();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "An unexpected shift tracking error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] flex flex-col justify-between h-full text-white">

      {/* Widget Header Area */}
      <div className="space-y-1">
        <h3 className="font-semibold text-white text-base tracking-tight flex items-center gap-2">
          <Clock className="h-4 w-4 text-white stroke-[2]" /> Duty Shift Clock
        </h3>
        <p className="text-xs text-gray-500 font-normal">Record your daily attendance markers for payroll logging.</p>
      </div>

      {/* Dynamic Notifications Alert Stream */}
      {message && (
        <div className={`mt-4 rounded-xl p-3.5 text-xs font-medium flex items-start gap-2 border backdrop-blur-xs animate-in fade-in duration-150 ${message.type === "success"
            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
            : "bg-red-500/10 text-red-300 border-red-500/20"
          }`}>
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
          )}
          <span className="leading-normal">{message.text}</span>
        </div>
      )}

      {/* Real-time Shift Timestamps Dashboard Grid */}
      <div className="grid grid-cols-2 gap-4 my-6 bg-white/[0.03] p-4 rounded-xl border border-white/8 text-center">
        <div className="space-y-0.5">
          <span className="block text-[9px] uppercase font-bold tracking-wider text-gray-500">Punched In</span>
          <span className="text-base font-semibold font-mono text-gray-100 tracking-wide">
            {formatTime(status.checkInTime)}
          </span>
        </div>
        <div className="space-y-0.5 border-l border-white/10">
          <span className="block text-[9px] uppercase font-bold tracking-wider text-gray-500">Punched Out</span>
          <span className="text-base font-semibold font-mono text-gray-100 tracking-wide">
            {formatTime(status.checkOutTime)}
          </span>
        </div>
      </div>

      {/* State Machine Layout Action Pill Triggers */}
      <div className="w-full">
        {!status.hasCheckedIn ? (
          <button
            type="button"
            onClick={() => handleClockAction("check-in")}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] hover:opacity-90 text-white px-5 py-3 rounded-full text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
          >
            <LogIn className="h-4 w-4 stroke-[2]" />
            {isLoading ? "Recording punch..." : "Punch In Shift"}
          </button>
        ) : !status.hasCheckedOut ? (
          <button
            type="button"
            onClick={() => handleClockAction("check-out")}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 rounded-full text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
          >
            <LogOut className="h-4 w-4 stroke-[2]" />
            {isLoading ? "Recording punch..." : "Punch Out Shift"}
          </button>
        ) : (
          <div className="w-full flex items-center justify-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-5 py-3 text-xs font-semibold text-emerald-400">
            <CheckCircle className="h-4 w-4 text-emerald-400" /> Daily Log Complete
          </div>
        )}
      </div>

    </div>
  );
}