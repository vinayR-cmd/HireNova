"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, Calendar, LayoutList } from "lucide-react";

interface FilterFormProps {
  currentMonth: number;
  currentYear: number;
  monthOptions: { value: number; label: string }[];
}

export function AttendanceFilterForm({ currentMonth, currentYear, monthOptions }: FilterFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Read dynamic active view layouts directly from query string states (defaults to "calendar")
  const currentView = searchParams.get("view") || "calendar";

  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
  
  const monthRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);

  const yearsArray = [2026, 2025];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (monthRef.current && !monthRef.current.contains(event.target as Node)) setIsMonthOpen(false);
      if (yearRef.current && !yearRef.current.contains(event.target as Node)) setIsYearOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTimelineMutation = (m: number, y: number, viewMode = currentView) => {
    router.push(`/employee/attendance?month=${m}&year=${y}&view=${viewMode}`);
  };

  const toggleViewLayout = (targetView: "calendar" | "table") => {
    handleTimelineMutation(currentMonth, currentYear, targetView);
  };

  const triggerPrevPeriod = () => {
    let targetM = currentMonth - 1;
    let targetY = currentYear;
    if (targetM < 1) {
      targetM = 12;
      targetY = currentYear - 1;
    }
    handleTimelineMutation(targetM, targetY);
  };

  const triggerNextPeriod = () => {
    let targetM = currentMonth + 1;
    let targetY = currentYear;
    if (targetM > 12) {
      targetM = 1;
      targetY = currentYear + 1;
    }
    handleTimelineMutation(targetM, targetY);
  };

  return (
    <div className="flex flex-wrap items-center gap-4 select-none relative z-20">
      
      {/* ================= MULTI-VIEW TOGGLE CONTROLS (PILL DESIGN) ================= */}
      <div className="flex items-center rounded-full bg-white/[0.05] p-1 border border-white/10 shrink-0">
        <button
          type="button"
          onClick={() => toggleViewLayout("calendar")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            currentView === "calendar" 
              ? "bg-[#12141A] text-white shadow-xs border border-white/8" 
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Calendar className="h-3.5 w-3.5 stroke-[2]" />
          Calendar
        </button>
        <button
          type="button"
          onClick={() => toggleViewLayout("table")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            currentView === "table" 
              ? "bg-[#12141A] text-white shadow-xs border border-white/8" 
              : "text-gray-400 hover:text-white"
          }`}
        >
          <LayoutList className="h-3.5 w-3.5 stroke-[2]" />
          Table Matrix
        </button>
      </div>

      {/* ================= CHRONOLOGICAL NAVIGATION BUTTONS ================= */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={triggerPrevPeriod}
          className="flex items-center justify-center p-2 rounded-xl border border-white/10 bg-[#12141A] text-gray-400 hover:text-white hover:bg-white/[0.03] transition-all cursor-pointer h-8.5 w-8.5 shrink-0"
          title="Previous Month"
        >
          <ChevronLeft className="h-4 w-4 stroke-[2]" />
        </button>

        {/* CUSTOM DROPDOWN: MONTH */}
        <div className="relative min-w-[130px]" ref={monthRef}>
          <button
            type="button"
            onClick={() => { setIsMonthOpen(!isMonthOpen); setIsYearOpen(false); }}
            className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold rounded-xl border border-white/10 bg-[#12141A] text-gray-200 hover:bg-white/[0.03] transition-all cursor-pointer h-8.5"
          >
            <span className="truncate">{monthOptions.find((m) => m.value === currentMonth)?.label}</span>
            <ChevronDown className={`h-3.5 w-3.5 text-gray-500 transition-transform duration-300 ${isMonthOpen ? "rotate-180" : ""}`} />
          </button>

          <div className={`absolute left-0 mt-1.5 w-full rounded-xl border border-white/10 bg-[#0D0F15]/90 backdrop-blur-md shadow-2xl p-1.5 space-y-0.5 transition-all duration-300 origin-top max-h-60 overflow-y-auto z-40 ${isMonthOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}`}>
            {monthOptions.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => { handleTimelineMutation(m.value, currentYear); setIsMonthOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer ${currentMonth === m.value ? "bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] text-white font-medium" : "text-gray-300 hover:bg-white/[0.07]"}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* CUSTOM DROPDOWN: YEAR */}
        <div className="relative min-w-[90px]" ref={yearRef}>
          <button
            type="button"
            onClick={() => { setIsYearOpen(!isYearOpen); setIsMonthOpen(false); }}
            className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold rounded-xl border border-white/10 bg-[#12141A] text-gray-200 hover:bg-white/[0.03] transition-all cursor-pointer h-8.5"
          >
            <span>{currentYear}</span>
            <ChevronDown className={`h-3.5 w-3.5 text-gray-500 transition-transform duration-300 ${isYearOpen ? "rotate-180" : ""}`} />
          </button>

          <div className={`absolute right-0 mt-1.5 w-full rounded-xl border border-white/10 bg-[#0D0F15]/90 backdrop-blur-md shadow-2xl p-1.5 space-y-0.5 transition-all duration-300 origin-top z-40 ${isYearOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}`}>
            {yearsArray.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => { handleTimelineMutation(currentMonth, y); setIsYearOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer ${currentYear === y ? "bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] text-white font-medium" : "text-gray-300 hover:bg-white/[0.07]"}`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={triggerNextPeriod}
          className="flex items-center justify-center p-2 rounded-xl border border-white/10 bg-[#12141A] text-gray-400 hover:text-white hover:bg-white/[0.03] transition-all cursor-pointer h-8.5 w-8.5 shrink-0"
          title="Next Month"
        >
          <ChevronRight className="h-4 w-4 stroke-[2]" />
        </button>
      </div>

    </div>
  );
}