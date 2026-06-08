"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Undo2,
  CheckCircle,
  AlertCircle,
  Settings,
  Sparkles,
} from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { format, startOfMonth, getDay } from "date-fns";

interface CalendarDay {
  date: string; // YYYY-MM-DD
  isHoliday: boolean;
  holidayName?: string;
  officeStartTime: string;
  officeEndTime: string;
  totalDailyHours: number;
  isCustom: boolean;
}

interface WorkingHoursPolicy {
  officeStartTime: string;
  officeEndTime: string;
  totalDailyHours: number;
  workingDays: string[];
  weeklyOff: string[];
}

export default function WorkingCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [policy, setPolicy] = useState<WorkingHoursPolicy | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal Editing State
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    mode: "NORMAL" as "NORMAL" | "HOLIDAY" | "CUSTOM_TIMING",
    holidayName: "",
    officeStartTime: "09:00",
    officeEndTime: "18:00",
    totalDailyHours: 9,
  });

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  // Fetch all calendar configurations
  const fetchCalendarData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiFetch(`/api/calendar/custom-days?month=${month}&year=${year}`);
      const payload = await res.json();
      if (res.ok) {
        setCalendarDays(payload.data.calendarDays || []);
        setPolicy(payload.data.workingHoursPolicy || null);
      } else {
        throw new Error(payload.error || "Failed to load calendar parameters.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while fetching calendar data.");
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  // Open Edit Modal for a Specific Day
  const handleDayClick = (day: CalendarDay) => {
    setSelectedDay(day);
    let mode: "NORMAL" | "HOLIDAY" | "CUSTOM_TIMING" = "NORMAL";
    if (day.isHoliday && day.holidayName !== "Weekly Off") {
      mode = "HOLIDAY";
    } else if (day.isCustom && !day.isHoliday) {
      mode = "CUSTOM_TIMING";
    }

    setEditForm({
      mode,
      holidayName: day.isHoliday && day.holidayName !== "Weekly Off" ? day.holidayName || "" : "",
      officeStartTime: day.officeStartTime,
      officeEndTime: day.officeEndTime,
      totalDailyHours: day.totalDailyHours,
    });
    setIsModalOpen(true);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  // Save changes
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDay) return;

    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const isHoliday = editForm.mode === "HOLIDAY";
    const body = {
      action: "SET",
      date: selectedDay.date,
      isHoliday,
      holidayName: isHoliday ? editForm.holidayName || "Declared Holiday" : undefined,
      officeStartTime: editForm.mode === "CUSTOM_TIMING" ? editForm.officeStartTime : undefined,
      officeEndTime: editForm.mode === "CUSTOM_TIMING" ? editForm.officeEndTime : undefined,
      totalDailyHours: editForm.mode === "CUSTOM_TIMING" ? editForm.totalDailyHours : undefined,
    };

    try {
      const res = await apiFetch("/api/calendar/custom-days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to save configurations.");

      setSuccessMessage("Date configurations updated successfully.");
      setIsModalOpen(false);
      fetchCalendarData();
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Revert back to company default policy
  const handleRevert = async () => {
    if (!selectedDay) return;

    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await apiFetch("/api/calendar/custom-days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REVERT",
          date: selectedDay.date,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to revert configuration.");

      setSuccessMessage("Reverted date settings back to default shift policy.");
      setIsModalOpen(false);
      fetchCalendarData();
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while reverting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate starting padding slots for the monthly calendar grid
  const firstOfMonth = startOfMonth(new Date(year, month - 1, 1));
  const startingDayIndex = getDay(firstOfMonth);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-white">
      {/* Structural Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-white flex items-center gap-2">
            <CalendarIcon className="h-7 w-7 text-white stroke-[1.8]" />
            Working Calendar Control
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 font-normal">
            Customize daily working shift timings, declare company holidays, and override standard policies.
          </p>
        </div>

        {/* Month Selector Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-full border border-white/10 bg-[#12141A] text-gray-300 hover:text-white hover:bg-white/[0.03] transition-all cursor-pointer shadow-xs"
            title="Previous Month"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </button>
          <span className="font-semibold text-white text-base min-w-[130px] text-center tracking-tight">
            {format(new Date(year, month - 1, 1), "MMMM yyyy")}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-full border border-white/10 bg-[#12141A] text-gray-300 hover:text-white hover:bg-white/[0.03] transition-all cursor-pointer shadow-xs"
            title="Next Month"
          >
            <ChevronRight className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Global Status messages */}
      {successMessage && (
        <div className="rounded-xl bg-emerald-500/10 p-4 text-xs text-emerald-300 border border-emerald-500/20 flex items-center gap-2 font-medium animate-in fade-in duration-200">
          <CheckCircle className="h-4.5 w-4.5 shrink-0 text-emerald-400" /> {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="rounded-xl bg-red-500/10 p-4 text-xs text-red-400 border border-red-500/20 flex items-center gap-2 font-medium animate-in fade-in duration-200">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-400" /> {errorMessage}
        </div>
      )}

      {/* Main Grid Card */}
      <div className="rounded-2xl border border-white/15 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] overflow-hidden">
        {isLoading ? (
          <div className="py-24 text-center text-sm text-gray-500 font-normal">
            Loading working calendar configuration...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Weekdays indicator headers */}
            <div className="grid grid-cols-7 gap-3 text-center border-b border-white/8 pb-3">
              {weekDays.map((wd) => (
                <div
                  key={wd}
                  className="text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {wd}
                </div>
              ))}
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-3 min-h-[360px]">
              {/* Padding cells at start of month */}
              {Array.from({ length: startingDayIndex }).map((_, idx) => (
                <div
                  key={`pad-${idx}`}
                  className="rounded-xl bg-white/[0.02] border border-dashed border-white/8"
                />
              ))}

              {/* Month dates */}
              {calendarDays.map((day) => {
                const dayNum = parseInt(day.date.split("-")[2], 10);
                const isCustom = day.isCustom;
                const isHoliday = day.isHoliday;

                return (
                  <button
                    key={day.date}
                    onClick={() => handleDayClick(day)}
                    className={`
                      relative group rounded-xl p-4.5 border text-left flex flex-col justify-between 
                      min-h-[100px] transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs
                      ${
                        isHoliday
                          ? "bg-rose-500/10 border-rose-500/20 text-rose-950 hover:bg-rose-500/10"
                          : isCustom
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-950 hover:bg-amber-500/10"
                          : "bg-[#12141A] border-white/10 text-gray-100 hover:border-white/25"
                      }
                    `}
                  >
                    {/* Top row: date number and Custom indicator badge */}
                    <div className="flex justify-between items-start w-full">
                      <span className="text-sm font-semibold tracking-tight">{dayNum}</span>
                      {isCustom && (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-2xs">
                          <Sparkles className="h-2 w-2" /> Custom
                        </span>
                      )}
                    </div>

                    {/* Bottom row: Day metadata details */}
                    <div className="mt-3 space-y-1">
                      {isHoliday ? (
                        <div className="text-[10px] font-medium text-rose-400 flex items-center gap-1.5 truncate max-w-full">
                          <Coffee className="h-3 w-3 shrink-0" />
                          <span className="truncate">{day.holidayName || "Holiday"}</span>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <div className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gray-500" />
                            <span>
                              {day.officeStartTime}-{day.officeEndTime}
                            </span>
                          </div>
                          <div className="text-[9px] font-semibold text-gray-500">
                            {day.totalDailyHours} hrs benchmark
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Policy Guide Banner */}
      {policy && (
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/[0.05] text-gray-300">
              <Settings className="h-5 w-5 stroke-[1.8]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Default Shift Configuration
              </h4>
              <p className="text-xs text-gray-400 font-medium">
                Office Hours: {policy.officeStartTime} to {policy.officeEndTime} (
                {policy.totalDailyHours} hours benchmark). Off-days:{" "}
                {policy.weeklyOff?.join(", ") || "None"}.
              </p>
            </div>
          </div>
          <span className="text-[10px] text-gray-500 font-semibold italic">
            *Click any date block to override shift timings or declare holiday exceptions.
          </span>
        </div>
      )}

      {/* Editing Dialog Modal (Glassmorphic) */}
      {isModalOpen && selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#12141A] p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-white">
                Adjust Workday Parameters
              </h3>
              <p className="text-xs text-gray-500 font-normal">
                Applying timing overrides on:{" "}
                <span className="font-semibold text-gray-200">
                  {format(new Date(selectedDay.date), "eeee, MMMM dd, yyyy")}
                </span>
              </p>
            </div>

            <form onSubmit={handleSaveChanges} className="space-y-4">
              {/* Selector for Working Mode */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Select Status Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["NORMAL", "HOLIDAY", "CUSTOM_TIMING"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setEditForm((prev) => ({ ...prev, mode: m }))}
                      className={`
                        py-2 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer
                        ${
                          editForm.mode === m
                            ? "bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] text-white border-transparent"
                            : "bg-white/[0.03] hover:bg-white/[0.05] border-white/10 text-gray-300"
                        }
                      `}
                    >
                      {m === "NORMAL" ? "Workday" : m === "HOLIDAY" ? "Holiday" : "Custom Shift"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Holiday inputs */}
              {editForm.mode === "HOLIDAY" && (
                <div className="space-y-1.5 bg-rose-500/10 p-3.5 rounded-xl border border-rose-500/20 animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-xs font-semibold text-rose-300 uppercase tracking-wider">
                    Holiday Title / Reason
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Independence Day, Diwali Off..."
                    value={editForm.holidayName}
                    onChange={(e) => setEditForm({ ...editForm, holidayName: e.target.value })}
                    className="block w-full rounded-xl border border-rose-500/20 bg-[#12141A] px-4.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-500/5 transition-all placeholder-rose-300"
                  />
                </div>
              )}

              {/* Custom Timings inputs */}
              {editForm.mode === "CUSTOM_TIMING" && (
                <div className="space-y-4.5 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                        Office Start
                      </label>
                      <input
                        type="time"
                        required
                        value={editForm.officeStartTime}
                        onChange={(e) =>
                          setEditForm({ ...editForm, officeStartTime: e.target.value })
                        }
                        className="block w-full rounded-lg border border-amber-500/20 bg-[#12141A] px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                        Office End
                      </label>
                      <input
                        type="time"
                        required
                        value={editForm.officeEndTime}
                        onChange={(e) =>
                          setEditForm({ ...editForm, officeEndTime: e.target.value })
                        }
                        className="block w-full rounded-lg border border-amber-500/20 bg-[#12141A] px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                      Target Shift Working Hours
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="24"
                      step="0.5"
                      value={editForm.totalDailyHours}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          totalDailyHours: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="block w-full rounded-lg border border-amber-500/20 bg-[#12141A] px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/8">
                {/* Revert default action, only visible if current date has custom settings */}
                {selectedDay.isCustom ? (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleRevert}
                    className="
                      w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-full border border-white/10 
                      bg-[#12141A] px-4 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20
                      transition-all cursor-pointer disabled:opacity-40 self-stretch sm:self-auto
                    "
                  >
                    <Undo2 className="h-3.5 w-3.5" /> Revert Policy
                  </button>
                ) : (
                  <div className="hidden sm:block" />
                )}

                <div className="flex items-center gap-2.5 w-full sm:w-auto self-stretch sm:self-auto">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIsModalOpen(false)}
                    className="
                      w-1/2 sm:w-auto rounded-full border border-white/10 bg-[#12141A] px-4.5 py-2 text-xs 
                      font-semibold text-gray-300 hover:bg-white/[0.03] transition-all cursor-pointer disabled:opacity-40
                    "
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="
                      w-1/2 sm:w-auto rounded-full bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] hover:opacity-90 text-white text-xs 
                      font-semibold px-5 py-2 shadow-sm transition-all cursor-pointer disabled:opacity-40
                    "
                  >
                    {isSubmitting ? "Saving..." : "Save Settings"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
