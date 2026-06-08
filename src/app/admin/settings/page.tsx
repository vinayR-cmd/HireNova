"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Building, Percent, Clock, CheckCircle2, AlertCircle, CalendarDays, Plus, Trash2, ChevronDown } from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";

interface Holiday {
  date: string;
  name: string;
}

const OT_RATE_TYPES = [
  { value: "PER_HOUR", label: "Per Hour" },
  { value: "PER_DAY", label: "Per Day" },
  { value: "FIXED", label: "Fixed Amount" },
];

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className="flex items-center gap-2.5 cursor-pointer group"
    >
      <div className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${enabled ? "bg-emerald-500" : "bg-white/[0.07]"}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-[#12141A] shadow transition-transform duration-200 ${enabled ? "translate-x-4" : "translate-x-0"}`} />
      </div>
      <span className={`text-xs font-medium transition-colors ${enabled ? "text-emerald-400" : "text-gray-500"}`}>{enabled ? "Enabled" : "Disabled"}</span>
    </button>
  );
}

function CustomSelect({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const selected = options.find(o => o.value === value);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm rounded-xl border border-white/10 bg-white/[0.03] text-gray-200 hover:bg-white/[0.06] focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all cursor-pointer"
      >
        <span>{selected?.label ?? "Select"}</span>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`absolute left-0 right-0 mt-2 z-20 rounded-xl border border-white/10 bg-[#0D0F15]/90 backdrop-blur-md shadow-2xl p-1.5 space-y-0.5 transition-all duration-200 origin-top ${open ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}`}>
        {options.map(o => (
          <button
            key={o.value}
            type="button"
            onClick={() => { onChange(o.value); setOpen(false); }}
            className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all cursor-pointer ${value === o.value ? "bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] text-white font-medium" : "text-gray-300 hover:bg-white/[0.07] hover:text-white"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    contactNumber: "",
    address: "",
    overtimeMultiplier: 1.5,
    pfPercentage: 12.0,
    taxPercentage: 10.0,
    maxLeavesPerMonth: 2,
    // Global payroll toggles
    pfEnabled: true,
    employerPfPercentage: 12,
    professionalTaxEnabled: true,
    professionalTaxAmount: 200,
    overtimeEnabled: true,
    overtimeRateType: "PER_HOUR",
    defaultOvertimeRate: 200,
    defaultWorkingDays: 26,
    basicSalaryPercentage: 40,
    hraEnabled: true,
    hraPercentage: 50,
    autoSalaryCalculation: true,
    workingHoursPolicy: {
      name: "Standard",
      officeStartTime: "09:00",
      officeEndTime: "18:00",
      totalDailyHours: 9,
    },
  });

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidayForm, setHolidayForm] = useState({ date: "", name: "" });
  const [holidayFeedback, setHolidayFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isAddingHoliday, setIsAddingHoliday] = useState(false);
  const [deletingHoliday, setDeletingHoliday] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/api/settings");
      const payload = await res.json();
      if (res.ok && payload.data) {
        const d = payload.data;
        setForm({
          name: d.name || "",
          email: d.email || "",
          contactNumber: d.contactNumber || "",
          address: d.address || "",
          overtimeMultiplier: d.overtimeMultiplier ?? 1.5,
          pfPercentage: d.pfPercentage ?? 12,
          taxPercentage: d.taxPercentage ?? 10,
          maxLeavesPerMonth: d.maxLeavesPerMonth ?? 2,
          pfEnabled: d.pfEnabled ?? true,
          employerPfPercentage: d.employerPfPercentage ?? 12,
          professionalTaxEnabled: d.professionalTaxEnabled ?? true,
          professionalTaxAmount: d.professionalTaxAmount ?? 200,
          overtimeEnabled: d.overtimeEnabled ?? true,
          overtimeRateType: d.overtimeRateType ?? "PER_HOUR",
          defaultOvertimeRate: d.defaultOvertimeRate ?? 200,
          defaultWorkingDays: d.defaultWorkingDays ?? 26,
          basicSalaryPercentage: d.basicSalaryPercentage ?? 40,
          hraEnabled: d.hraEnabled ?? true,
          hraPercentage: d.hraPercentage ?? 50,
          autoSalaryCalculation: d.autoSalaryCalculation ?? true,
          workingHoursPolicy: {
            name: d.workingHoursPolicy?.name || "Standard",
            officeStartTime: d.workingHoursPolicy?.officeStartTime || "09:00",
            officeEndTime: d.workingHoursPolicy?.officeEndTime || "18:00",
            totalDailyHours: d.workingHoursPolicy?.totalDailyHours || 9,
          },
        });
      }
    } catch (err) {
      console.error("Failed loading corporate parameters:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchHolidays = useCallback(async () => {
    try {
      const res = await apiFetch("/api/holidays");
      const payload = await res.json();
      if (res.ok) setHolidays(payload.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchHolidays();
  }, [fetchSettings, fetchHolidays]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await apiFetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed saving settings.");
      setFeedback({ type: "success", text: "Global payroll configuration saved successfully." });
    } catch (err: unknown) {
      setFeedback({ type: "error", text: (err as Error).message || "An error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddHoliday = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!holidayForm.date || !holidayForm.name.trim()) return;
    setIsAddingHoliday(true);
    setHolidayFeedback(null);
    try {
      const res = await apiFetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: holidayForm.date, name: holidayForm.name.trim() }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to add holiday.");
      setHolidayFeedback({ type: "success", text: `Holiday "${payload.name}" declared. ${payload.markedEmployees} employee(s) marked.` });
      setHolidayForm({ date: "", name: "" });
      fetchHolidays();
    } catch (err: unknown) {
      setHolidayFeedback({ type: "error", text: (err as Error).message });
    } finally {
      setIsAddingHoliday(false);
    }
  };

  const handleDeleteHoliday = async (dateStr: string) => {
    setDeletingHoliday(dateStr);
    try {
      await apiFetch("/api/holidays", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr }),
      });
      fetchHolidays();
    } finally {
      setDeletingHoliday(null);
    }
  };

  const formatHolidayDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const setField = (key: string, val: unknown) => setForm(f => ({ ...f, [key]: val }));

  if (isLoading) {
    return <div className="text-center py-24 text-xs font-normal text-gray-500">Loading configuration...</div>;
  }

  return (
    <div className="space-y-10 max-w-4xl mx-auto text-white">

      {/* HEADER */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-white">Governance Settings</h1>
        <p className="text-xs sm:text-sm text-gray-400 font-normal">Configure global company profile, payroll rules, and compliance parameters.</p>
      </div>

      {feedback && (
        <div className={`rounded-xl p-4 text-xs font-medium flex items-center gap-2.5 border backdrop-blur-sm animate-in fade-in duration-200 ${feedback.type === "success" ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" : "bg-red-500/10 text-red-300 border-red-500/20"}`}>
          {feedback.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />}
          <span>{feedback.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* SECTION 1: IDENTITY */}
        <div className="rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-5">
          <div className="flex items-center gap-2 font-semibold text-white text-base border-b border-white/8 pb-3">
            <Building className="h-4 w-4 stroke-[2]" />
            <h3 className="tracking-tight">Institutional Identity</h3>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {[
              { label: "Company Entity Name", key: "name", type: "text", placeholder: "Google India Pvt Ltd", required: true },
              { label: "Corporate Helpline Email", key: "email", type: "email", placeholder: "ops@company.in" },
              { label: "Contact Phone", key: "contactNumber", type: "text", placeholder: "+91 98765 43210" },
              { label: "HQ Registered Address", key: "address", type: "text", placeholder: "DLF CyberHub, Gurugram" },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{f.label}</label>
                <input
                  type={f.type}
                  required={f.required}
                  placeholder={f.placeholder}
                  value={(form as Record<string, unknown>)[f.key] as string}
                  onChange={e => setField(f.key, e.target.value)}
                  className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
                />
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: GLOBAL PAYROLL RULES */}
        <div className="rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-6">
          <div className="flex items-center gap-2 font-semibold text-white text-base border-b border-white/8 pb-3">
            <Percent className="h-4 w-4 stroke-[2]" />
            <h3 className="tracking-tight">Global Payroll Configuration</h3>
          </div>

          {/* Auto Calculation Master Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-100">Auto Salary Calculation</p>
              <p className="text-xs text-gray-500 mt-0.5">Automatically compute gross, deductions and net salary from components</p>
            </div>
            <Toggle enabled={form.autoSalaryCalculation} onChange={v => setField("autoSalaryCalculation", v)} />
          </div>

          {/* Basic Salary & Default Working Days */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Basic Salary (% of Gross)</label>
              <div className="relative">
                <input
                  type="number" step="1" min="0" max="100" required
                  value={form.basicSalaryPercentage}
                  onChange={e => setField("basicSalaryPercentage", parseFloat(e.target.value) || 0)}
                  className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 pr-8 text-sm text-white focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
                />
                <span className="absolute right-3 top-2.5 text-sm text-gray-500">%</span>
              </div>
              <p className="mt-1 text-[10px] text-gray-500">HRA & PF are computed from basic salary</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Default Working Days / Month</label>
              <input
                type="number" step="1" min="1" max="31" required
                value={form.defaultWorkingDays}
                onChange={e => setField("defaultWorkingDays", parseInt(e.target.value, 10) || 26)}
                className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
              />
            </div>
          </div>

          {/* PF */}
          <div className="rounded-xl border border-white/10 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-100">Provident Fund (PF)</p>
                <p className="text-xs text-gray-500 mt-0.5">Applied on basic salary for both employee and employer</p>
              </div>
              <Toggle enabled={form.pfEnabled} onChange={v => setField("pfEnabled", v)} />
            </div>
            {form.pfEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Employee PF (%)</label>
                  <div className="relative">
                    <input type="number" step="0.01" min="0" max="50" value={form.pfPercentage}
                      onChange={e => setField("pfPercentage", parseFloat(e.target.value) || 0)}
                      className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 pr-8 text-sm text-white focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
                    />
                    <span className="absolute right-3 top-2.5 text-sm text-gray-500">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Employer PF (%)</label>
                  <div className="relative">
                    <input type="number" step="0.01" min="0" max="50" value={form.employerPfPercentage}
                      onChange={e => setField("employerPfPercentage", parseFloat(e.target.value) || 0)}
                      className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 pr-8 text-sm text-white focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
                    />
                    <span className="absolute right-3 top-2.5 text-sm text-gray-500">%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* HRA */}
          <div className="rounded-xl border border-white/10 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-100">House Rent Allowance (HRA)</p>
                <p className="text-xs text-gray-500 mt-0.5">Global HRA toggle — individual overrides still apply per employee</p>
              </div>
              <Toggle enabled={form.hraEnabled} onChange={v => setField("hraEnabled", v)} />
            </div>
            {form.hraEnabled && (
              <div className="pt-1">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Default HRA (% of Basic)</label>
                <div className="relative max-w-[200px]">
                  <input type="number" step="1" min="0" max="100" value={form.hraPercentage}
                    onChange={e => setField("hraPercentage", parseFloat(e.target.value) || 0)}
                    className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 pr-8 text-sm text-white focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-gray-500">%</span>
                </div>
              </div>
            )}
          </div>

          {/* Professional Tax */}
          <div className="rounded-xl border border-white/10 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-100">Professional Tax</p>
                <p className="text-xs text-gray-500 mt-0.5">Fixed monthly deduction from employee net salary</p>
              </div>
              <Toggle enabled={form.professionalTaxEnabled} onChange={v => setField("professionalTaxEnabled", v)} />
            </div>
            {form.professionalTaxEnabled && (
              <div className="pt-1">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Professional Tax Amount (₹/month)</label>
                <div className="relative max-w-[200px]">
                  <span className="absolute left-3 top-2.5 text-sm text-gray-500">₹</span>
                  <input type="number" step="1" min="0" value={form.professionalTaxAmount}
                    onChange={e => setField("professionalTaxAmount", parseFloat(e.target.value) || 0)}
                    className="block w-full rounded-xl border border-white/10 bg-white/[0.03] pl-7 pr-4 py-2.5 text-sm text-white focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Overtime */}
          <div className="rounded-xl border border-white/10 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-100">Overtime</p>
                <p className="text-xs text-gray-500 mt-0.5">Configure overtime rate type and default rate</p>
              </div>
              <Toggle enabled={form.overtimeEnabled} onChange={v => setField("overtimeEnabled", v)} />
            </div>
            {form.overtimeEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Rate Type</label>
                  <CustomSelect
                    value={form.overtimeRateType}
                    onChange={v => setField("overtimeRateType", v)}
                    options={OT_RATE_TYPES}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Default Rate (₹ / {form.overtimeRateType === "PER_HOUR" ? "hr" : form.overtimeRateType === "PER_DAY" ? "day" : "fixed"})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm text-gray-500">₹</span>
                    <input type="number" step="1" min="0" value={form.defaultOvertimeRate}
                      onChange={e => setField("defaultOvertimeRate", parseFloat(e.target.value) || 0)}
                      className="block w-full rounded-xl border border-white/10 bg-white/[0.03] pl-7 pr-4 py-2.5 text-sm text-white focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Income Tax & Leaves */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Income Tax / TDS (%)</label>
              <div className="relative">
                <input type="number" step="0.01" min="0" max="50" required value={form.taxPercentage}
                  onChange={e => setField("taxPercentage", parseFloat(e.target.value) || 0)}
                  className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 pr-8 text-sm text-white focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
                />
                <span className="absolute right-3 top-2.5 text-sm text-gray-500">%</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Overtime Wage Multiplier</label>
              <input type="number" step="0.1" min="1.0" required value={form.overtimeMultiplier}
                onChange={e => setField("overtimeMultiplier", parseFloat(e.target.value) || 1.5)}
                className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Free Leaves / Month</label>
              <input type="number" step="1" min="0" max="30" required value={form.maxLeavesPerMonth}
                onChange={e => setField("maxLeavesPerMonth", parseInt(e.target.value, 10) || 0)}
                className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
              />
              <p className="mt-1.5 text-[10px] text-gray-500">Leaves within this limit — no salary deduction</p>
            </div>
          </div>
        </div>

        {/* SECTION 3: SHIFT POLICIES */}
        <div className="rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-5">
          <div className="flex items-center gap-2 font-semibold text-white text-base border-b border-white/8 pb-3">
            <Clock className="h-4 w-4 stroke-[2]" />
            <h3 className="tracking-tight">Tracking Shift Policies</h3>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              { label: "Shift Check-In", key: "officeStartTime", type: "time" },
              { label: "Shift Check-Out", key: "officeEndTime", type: "time" },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{f.label}</label>
                <input
                  type={f.type} required
                  value={(form.workingHoursPolicy as Record<string, unknown>)[f.key] as string}
                  onChange={e => setForm(prev => ({ ...prev, workingHoursPolicy: { ...prev.workingHoursPolicy, [f.key]: e.target.value } }))}
                  className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Daily Benchmark Hours</label>
              <input type="number" min="1" max="24" required value={form.workingHoursPolicy.totalDailyHours}
                onChange={e => setForm(prev => ({ ...prev, workingHoursPolicy: { ...prev.workingHoursPolicy, totalDailyHours: parseInt(e.target.value, 10) || 9 } }))}
                className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
              />
            </div>
          </div>
        </div>

        {/* SUBMIT */}
        <div className="flex items-center justify-end pt-2">
          <button type="submit" disabled={isSubmitting}
            className="bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] hover:opacity-90 text-white text-sm font-semibold px-6 py-3 rounded-full shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
          >
            {isSubmitting ? "Saving..." : "Save Global Configuration"}
          </button>
        </div>
      </form>

      {/* SECTION 4: COMPANY HOLIDAYS */}
      <div className="rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-5">
        <div className="flex items-center gap-2 font-semibold text-white text-base border-b border-white/8 pb-3">
          <CalendarDays className="h-4 w-4 stroke-[2]" />
          <h3 className="tracking-tight">Company Holidays</h3>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">
          Declaring a holiday marks all active employees as <span className="font-semibold text-gray-300">HOLIDAY</span> for that date — no salary deduction applied.
        </p>

        {holidayFeedback && (
          <div className={`rounded-xl p-3.5 text-xs font-medium flex items-center gap-2.5 border animate-in fade-in duration-200 ${holidayFeedback.type === "success" ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" : "bg-red-500/10 text-red-300 border-red-500/20"}`}>
            {holidayFeedback.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />}
            <span>{holidayFeedback.text}</span>
          </div>
        )}

        <form onSubmit={handleAddHoliday} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Holiday Name</label>
            <input type="text" required placeholder="e.g. Diwali, Republic Day"
              value={holidayForm.name}
              onChange={e => setHolidayForm(f => ({ ...f, name: e.target.value }))}
              className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
            />
          </div>
          <div className="sm:w-44">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Date</label>
            <input type="date" required value={holidayForm.date}
              onChange={e => setHolidayForm(f => ({ ...f, date: e.target.value }))}
              className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
            />
          </div>
          <div className="sm:self-end">
            <button type="submit" disabled={isAddingHoliday}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] hover:opacity-90 text-white text-xs font-semibold px-5 py-2.5 rounded-full shadow-sm transition-all cursor-pointer disabled:opacity-40 w-full sm:w-auto justify-center"
            >
              <Plus className="h-3.5 w-3.5" />
              {isAddingHoliday ? "Adding..." : "Declare Holiday"}
            </button>
          </div>
        </form>

        {holidays.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4 border border-dashed border-white/10 rounded-xl">No company holidays declared yet.</p>
        ) : (
          <div className="divide-y border-white/8 border border-white/10 rounded-xl overflow-hidden">
            {holidays
              .slice()
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map(h => {
                const iso = new Date(h.date).toISOString().split("T")[0];
                return (
                  <div key={iso} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white/[0.05] border border-white/10 p-2 text-gray-400">
                        <CalendarDays className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{h.name}</p>
                        <p className="text-xs text-gray-500">{formatHolidayDate(h.date)}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteHoliday(iso)} disabled={deletingHoliday === iso}
                      className="p-2 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
