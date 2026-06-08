"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, ShieldAlert, Clock, User, CheckCircle, FileText } from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";

interface Employee {
  _id: string;
  fullName: string;
  employeeId?: string;
  department?: string;
}

export default function AdminAttendancePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State for Administrative Overrides
  const [overrideForm, setOverrideForm] = useState({
    date: new Date().toISOString().split("T")[0],
    status: "PRESENT",
    checkIn: "09:00",
    checkOut: "18:00",
    remarks: "",
  });

  // Fetch employees to populate the adjustment selection dropdown
  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/api/employees?limit=100");
      const payload = await res.json();
      if (res.ok) {
        setEmployees(payload.records || []);
      }
    } catch (err) {
      console.error("Failed to fetch workforce lookup list:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Filter local dropdown results based on the administrative search queries
  const filteredEmployees = employees.filter(emp =>
    emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employeeId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      setErrorMessage("Please select a target employee profile.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await apiFetch("/api/attendance/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          ...overrideForm,
        }),
      });

      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload.error || "Failed to save the attendance exception override.");
      }

      setSuccessMessage("Timesheet corrections successfully saved to the ledger.");
      setOverrideForm({
        ...overrideForm,
        remarks: "",
      });
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while transmitting overrides.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto text-white">
      
      {/* ================= STRUCTURAL MODULE HEADER ================= */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-white">
          Attendance Exception Management
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 font-normal">
          Apply administrative overrides, fix timesheet entries, and adjust records.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* ================= STEP 1: EMPLOYEE SELECTOR PANEL ================= */}
        <div className="rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-5">
          <div className="flex items-center gap-2 font-semibold text-white text-base border-b border-white/8 pb-3">
            <User className="h-4 w-4 text-white stroke-[2]" />
            <h3 className="tracking-tight">1. Target Employee Selection</h3>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Filter by name or ID index..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full text-sm rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder-gray-600 focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
            />
          </div>

          <div className="max-h-64 overflow-y-auto border border-white/10 rounded-xl divide-y border-white/8 bg-white/[0.02]">
            {isLoading ? (
              <p className="p-4 text-xs text-gray-500 text-center font-normal">Loading employee lookup indices...</p>
            ) : filteredEmployees.length === 0 ? (
              <p className="p-4 text-xs text-gray-500 text-center font-normal">No matching records found.</p>
            ) : (
              filteredEmployees.map((emp) => {
                const isSelected = selectedEmployeeId === emp._id;
                return (
                  <button
                    key={emp._id}
                    type="button"
                    onClick={() => setSelectedEmployeeId(emp._id)}
                    className={`w-full text-left p-3.5 text-sm transition-all flex justify-between items-center cursor-pointer ${
                      isSelected 
                        ? "bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] text-white font-medium" 
                        : "hover:bg-white/[0.05] text-gray-200"
                    }`}
                  >
                    <div>
                      <span className="block font-medium">{emp.fullName}</span>
                      <span className={`text-xs font-normal mt-0.5 ${isSelected ? "text-gray-500" : "text-gray-500"}`}>
                        {emp.department || "Unassigned"}
                      </span>
                    </div>
                    <span className={`text-xs font-mono font-medium tracking-wide ${isSelected ? "text-gray-600" : "text-gray-500"}`}>
                      {emp.employeeId || "—"}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ================= STEP 2: OVERRIDE FORM PANEL ================= */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
          <div className="flex items-center gap-2 font-semibold text-white text-base border-b border-white/8 pb-3 mb-5">
            <ShieldAlert className="h-4 w-4 text-white stroke-[2]" />
            <h3 className="tracking-tight">2. Administrative Adjustments Form</h3>
          </div>

          {successMessage && (
            <div className="mb-5 rounded-xl bg-emerald-500/10 p-4 text-xs text-emerald-300 border border-emerald-500/20 flex items-center gap-2 font-medium">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" /> {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-5 rounded-xl bg-red-500/10 p-4 text-xs text-red-400 border border-red-500/20 font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Target Date</label>
                <input
                  type="date"
                  required
                  value={overrideForm.date}
                  onChange={(e) => setOverrideForm({ ...overrideForm, date: e.target.value })}
                  className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Operational Status Set</label>
                <select
                  value={overrideForm.status}
                  onChange={(e) => setOverrideForm({ ...overrideForm, status: e.target.value })}
                  className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-gray-200 focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all cursor-pointer"
                >
                  <option value="PRESENT">PRESENT (Full Day Shift)</option>
                  <option value="HALF_DAY">HALF_DAY (Partial Allocation)</option>
                  <option value="ABSENT">ABSENT (Non-attendance Penalty)</option>
                  <option value="LEAVE">LEAVE (Authorized Leave Allocation)</option>
                  <option value="HOLIDAY">HOLIDAY (Statutory Public Rest)</option>
                </select>
              </div>
            </div>

            {/* Time parameters block */}
            {(overrideForm.status === "PRESENT" || overrideForm.status === "HALF_DAY") && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 bg-white/[0.02] p-4 rounded-xl border border-white/10 transition-all">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-gray-500 stroke-[2]" /> Check-in Timestamp (HH:MM)
                  </label>
                  <input
                    type="time"
                    required
                    value={overrideForm.checkIn}
                    onChange={(e) => setOverrideForm({ ...overrideForm, checkIn: e.target.value })}
                    className="block w-full rounded-xl border border-white/10 bg-[#12141A] px-4 py-2.5 text-sm text-white focus:border-white/25 focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-gray-500 stroke-[2]" /> Check-out Timestamp (HH:MM)
                  </label>
                  <input
                    type="time"
                    required
                    value={overrideForm.checkOut}
                    onChange={(e) => setOverrideForm({ ...overrideForm, checkOut: e.target.value })}
                    className="block w-full rounded-xl border border-white/10 bg-[#12141A] px-4 py-2.5 text-sm text-white focus:border-white/25 focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-gray-500 stroke-[2]" /> Compliance Remarks / Rationale
              </label>
              <textarea
                required
                rows={3}
                placeholder="State the audit trail reason for this override (e.g. Missed punch, system error, offsite client meeting corrections)..."
                value={overrideForm.remarks}
                onChange={(e) => setOverrideForm({ ...overrideForm, remarks: e.target.value })}
                className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all resize-none"
              />
            </div>

            {/* Form Footer Action Buttons matching the elegant pill format layout */}
            <div className="flex items-center justify-end pt-4 border-t border-white/8">
              <button
                type="submit"
                disabled={isSubmitting || !selectedEmployeeId}
                className="
                  bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] hover:opacity-90 text-white text-sm font-semibold px-6 py-2.5 rounded-full 
                  shadow-sm transition-all duration-200 ease-out cursor-pointer
                  disabled:opacity-40 disabled:pointer-events-none
                "
              >
                {isSubmitting ? "Committing Entry..." : "Save Adjustment Entry"}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}