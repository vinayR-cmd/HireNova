"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { CreditCard, ShieldCheck, Send, Cpu, DollarSign, Users, AlertCircle, CheckCircle2, ChevronDown, ListChecks, Eye, Lock, Archive } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-fetch";

interface PayrollRecord {
  _id: string;
  employeeId: {
    _id: string;
    fullName: string;
    employeeId: string;
    department: string;
    designation: string;
  };
  month: number;
  year: number;
  status: "DRAFT" | "GENERATED" | "APPROVED" | "RELEASED";
  earnings: { grossSalary: number; overtimePay: number; total: number };
  deductions: { total: number };
  netSalary: number;
}

export default function AdminPayrollPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Custom Dropdown Menu Open States
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const monthRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);

  const monthsArray = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2026, i, 1).toLocaleString("en-US", { month: "long" }),
  }));

  const yearsArray = [currentYear, currentYear - 1];

  // Global click listener to smoothly collapse custom select menus if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (monthRef.current && !monthRef.current.contains(event.target as Node)) setIsMonthOpen(false);
      if (yearRef.current && !yearRef.current.contains(event.target as Node)) setIsYearOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPayrollLedger = useCallback(async () => {
    setIsLoading(true);
    setActionMessage(null);
    try {
      const res = await apiFetch(`/api/payroll?month=${selectedMonth}&year=${selectedYear}`);
      const payload = await res.json();
      if (res.ok) {
        setPayrollRecords(payload.data || []);
      } else {
        throw new Error(payload.error || "Failed to load payroll directory.");
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchPayrollLedger();
  }, [fetchPayrollLedger]);

  const handleGeneratePayroll = async () => {
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const res = await apiFetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear }),
      });
      const payload = await res.json();

      if (!res.ok) throw new Error(payload.error || "Batch generation engine failed.");

      setActionMessage({ type: "success", text: `Successfully generated ${payload.data?.processedCount || 0} payroll entries.` });
      fetchPayrollLedger();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkTransition = async (action: "APPROVE" | "RELEASE") => {
    const targets = payrollRecords.filter(r =>
      action === "APPROVE" ? r.status === "GENERATED" : r.status === "APPROVED"
    );
    if (targets.length === 0) return;
    setIsProcessing(true);
    setActionMessage(null);
    try {
      await Promise.all(
        targets.map(r =>
          apiFetch("/api/payroll/actions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ payrollId: r._id, action }),
          })
        )
      );
      setActionMessage({
        type: "success",
        text: `${targets.length} payroll ${action === "APPROVE" ? "slips approved" : "slips released"} successfully.`,
      });
      fetchPayrollLedger();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWorkflowTransition = async (id: string, action: "APPROVE" | "RELEASE") => {
    setIsProcessing(true);
    try {
      const res = await apiFetch("/api/payroll/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payrollId: id, action }),
      });
      const payload = await res.json();

      if (!res.ok) throw new Error(payload.error || "Workflow step advancement failed.");

      setActionMessage({ 
        type: "success", 
        text: action === "APPROVE" ? "Payroll slip approved for payment processing." : "Payslip safely released to employee portal ledger." 
      });
      fetchPayrollLedger();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const totalNetOutlay = payrollRecords.reduce((acc, curr) => acc + curr.netSalary, 0);
  const statusCounts = payrollRecords.reduce(
    (acc, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    },
    { GENERATED: 0, APPROVED: 0, RELEASED: 0 } as Record<string, number>
  );

  // Split: active (still mutable) vs finalized (locked, immutable)
  const activeRecords = payrollRecords.filter(r => r.status !== "RELEASED");
  const finalizedRecords = payrollRecords.filter(r => r.status === "RELEASED");

  // Generate is blocked when every record for the period is already RELEASED
  const allReleased = payrollRecords.length > 0 && activeRecords.length === 0;

  // Indian Currency Layout Standard Formatting Strategy (₹ Core Locale Formatting)
  const formatIndianCurrency = (val: number) => 
    new Intl.NumberFormat("en-IN", { 
      style: "currency", 
      currency: "INR",
      maximumFractionDigits: 0 
    }).format(val);

  return (
    <div className="space-y-10 max-w-7xl mx-auto text-white">
      
      {/* ================= MODULE TITLE HEADER ================= */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-white">Payroll Operations</h1>
          <p className="text-xs sm:text-sm text-gray-400 font-normal">Calculate salaries, review statutory withholdings, and release approved payslips.</p>
        </div>

        {/* Dynamic Controls Action Block container */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          
          {/* CUSTOM HIGH-SMOOTHNESS FILTER DROPDOWN: MONTH */}
          <div className="relative min-w-[150px]" ref={monthRef}>
            <button
              type="button"
              onClick={() => { setIsMonthOpen(!isMonthOpen); setIsYearOpen(false); }}
              className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold rounded-xl border border-white/10 bg-white/[0.03] text-gray-200 hover:bg-white/[0.06] focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all cursor-pointer"
            >
              <span className="truncate">{monthsArray.find(m => m.value === selectedMonth)?.label}</span>
              <ChevronDown className={`h-3.5 w-3.5 text-gray-500 transition-transform duration-300 ${isMonthOpen ? "rotate-180" : ""}`} />
            </button>
            <div className={`absolute right-0 mt-1.5 w-full rounded-xl border border-white/10 bg-[#0D0F15]/90 backdrop-blur-md shadow-2xl p-1.5 space-y-0.5 transition-all duration-300 origin-top max-h-60 overflow-y-auto ${isMonthOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}`}>
              {monthsArray.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => { setSelectedMonth(m.value); setIsMonthOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer ${selectedMonth === m.value ? "bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] text-white font-medium" : "text-gray-300 hover:bg-white/[0.07]"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* CUSTOM HIGH-SMOOTHNESS FILTER DROPDOWN: YEAR */}
          <div className="relative min-w-[100px]" ref={yearRef}>
            <button
              type="button"
              onClick={() => { setIsYearOpen(!isYearOpen); setIsMonthOpen(false); }}
              className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold rounded-xl border border-white/10 bg-white/[0.03] text-gray-200 hover:bg-white/[0.06] focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all cursor-pointer"
            >
              <span>{selectedYear}</span>
              <ChevronDown className={`h-3.5 w-3.5 text-gray-500 transition-transform duration-300 ${isYearOpen ? "rotate-180" : ""}`} />
            </button>
            <div className={`absolute right-0 mt-1.5 w-full rounded-xl border border-white/10 bg-[#0D0F15]/90 backdrop-blur-md shadow-2xl p-1.5 space-y-0.5 transition-all duration-300 origin-top ${isYearOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}`}>
              {yearsArray.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => { setSelectedYear(y); setIsYearOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer ${selectedYear === y ? "bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] text-white font-medium" : "text-gray-300 hover:bg-white/[0.07]"}`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Approve — only shown when there are GENERATED records */}
          {statusCounts.GENERATED > 0 && (
            <button
              onClick={() => handleBulkTransition("APPROVE")}
              disabled={isProcessing || isLoading}
              className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-5 py-2 rounded-full text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none hover:bg-amber-500/15"
            >
              <ListChecks className="h-3.5 w-3.5 stroke-[2]" /> Approve All ({statusCounts.GENERATED})
            </button>
          )}

          {/* Bulk Release — only shown when there are APPROVED records */}
          {statusCounts.APPROVED > 0 && (
            <button
              onClick={() => handleBulkTransition("RELEASE")}
              disabled={isProcessing || isLoading}
              className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-5 py-2 rounded-full text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none hover:bg-emerald-500/15"
            >
              <Send className="h-3.5 w-3.5 stroke-[2]" /> Release All ({statusCounts.APPROVED})
            </button>
          )}

          {/* Core Exact Google Style Pill Engine Activation Trigger */}
          <button
            onClick={handleGeneratePayroll}
            disabled={isProcessing || isLoading || allReleased}
            title={allReleased ? "All payroll for this period has been released. Change the month/year to run a new cycle." : undefined}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] hover:opacity-90 text-white px-5 py-2 rounded-full text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
          >
            <Cpu className="h-3.5 w-3.5 stroke-[2]" /> {allReleased ? "Period Closed" : "Run Payroll Engine"}
          </button>
        </div>
      </div>

      {/* ================= REAL-TIME ACTION NOTIFICATION ALERTS ================= */}
      {actionMessage && (
        <div className={`rounded-xl p-4 text-xs font-medium flex items-start gap-2.5 border backdrop-blur-sm animate-in fade-in duration-200 ${
          actionMessage.type === "success" 
            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" 
            : "bg-red-500/10 text-red-300 border-red-500/20"
        }`}>
          {actionMessage.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />}
          <span className="leading-normal">{actionMessage.text}</span>
        </div>
      )}

      {/* ================= FINANCIAL SCANNABLE OVERVIEW MATRIX ================= */}
      <div className="grid grid-cols-1 gap-3 sm:gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] flex items-center gap-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-white">
            <DollarSign className="h-5 w-5 stroke-[1.75]" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Net Outlay</p>
            <p className="text-2xl font-semibold tracking-tight text-white mt-0.5">{formatIndianCurrency(totalNetOutlay)}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] flex items-center gap-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-white">
            <Users className="h-5 w-5 stroke-[1.75]" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Processed Rosters</p>
            <p className="text-2xl font-semibold tracking-tight text-white mt-0.5">{payrollRecords.length} Employees</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] flex items-center gap-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-white">
            <CreditCard className="h-5 w-5 stroke-[1.75]" />
          </div>
          <div className="flex-1 grid grid-cols-3 gap-1 text-center border-l border-white/8 pl-4">
            <div>
              <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider">Compiled</span>
              <span className="text-base font-semibold text-gray-100 block mt-0.5">{statusCounts.GENERATED}</span>
            </div>
            <div>
              <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider">Approved</span>
              <span className="text-base font-semibold text-amber-400 block mt-0.5">{statusCounts.APPROVED}</span>
            </div>
            <div>
              <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider">Released</span>
              <span className="text-base font-semibold text-emerald-400 block mt-0.5">{statusCounts.RELEASED}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= ACTIVE PAYROLL (mutable) ================= */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-gray-200 stroke-[2]" />
          <h2 className="text-base font-semibold tracking-tight text-white">Active Payroll</h2>
          <span className="text-xs text-gray-500">— pending verification & release</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#12141A] overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.35)] relative z-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-white/[0.05] text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-white/10">
                <tr>
                  <th className="px-4 sm:px-6 py-4">Employee</th>
                  <th className="px-4 sm:px-6 py-4 hidden md:table-cell">Gross</th>
                  <th className="px-4 sm:px-6 py-4 hidden lg:table-cell">OT Pay</th>
                  <th className="px-4 sm:px-6 py-4 hidden md:table-cell">Deductions</th>
                  <th className="px-4 sm:px-6 py-4">Net Pay</th>
                  <th className="px-4 sm:px-6 py-4 hidden sm:table-cell">Status</th>
                  <th className="px-4 sm:px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y border-white/8">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-xs text-gray-500">Loading...</td>
                  </tr>
                ) : activeRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-xs text-gray-500">
                      {payrollRecords.length === 0
                        ? 'No payroll entries for this period. Click "Run Payroll Engine" above to generate.'
                        : "All payroll for this period has been released — see Finalized section below."}
                    </td>
                  </tr>
                ) : (
                  activeRecords.map((rec) => (
                    <tr key={rec._id} className="hover:bg-white/[0.02] transition-colors duration-150">
                      <td className="px-4 sm:px-6 py-4 font-medium text-white">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{rec.employeeId?.fullName}</span>
                          <span className="text-xs text-gray-500 font-normal mt-0.5 font-mono tracking-wide">{rec.employeeId?.employeeId || "No ID"}</span>
                          <span className="text-xs text-gray-400 mt-0.5 sm:hidden">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                              rec.status === "APPROVED" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                              "bg-white/[0.05] text-gray-100 border-white/8"
                            }`}>{rec.status}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-xs font-medium text-gray-300 hidden md:table-cell">{formatIndianCurrency(rec.earnings.total)}</td>
                      <td className="px-4 sm:px-6 py-4 text-xs font-medium text-emerald-400 hidden lg:table-cell">+{formatIndianCurrency(rec.earnings.overtimePay)}</td>
                      <td className="px-4 sm:px-6 py-4 text-xs font-medium text-rose-400 hidden md:table-cell">-{formatIndianCurrency(rec.deductions.total)}</td>
                      <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-white">{formatIndianCurrency(rec.netSalary)}</td>
                      <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${
                          rec.status === "APPROVED" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                          "bg-white/[0.05] text-gray-100 border-white/8"
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/payroll/${rec._id}`}
                            className="inline-flex items-center justify-center gap-1 rounded-full bg-white/[0.03] border border-white/10 text-xs font-semibold text-gray-200 px-3 py-1.5 hover:bg-white/[0.05] shadow-xs transition-all"
                            title="Audit slip before approving or releasing"
                          >
                            <Eye className="h-3.5 w-3.5" /> <span className="hidden md:inline">View</span>
                          </Link>
                          {rec.status === "GENERATED" && (
                            <button
                              onClick={() => handleWorkflowTransition(rec._id, "APPROVE")}
                              disabled={isProcessing}
                              className="inline-flex items-center justify-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400 px-3 sm:px-4 py-1.5 hover:bg-amber-500/15 shadow-xs transition-all cursor-pointer"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Approve</span>
                            </button>
                          )}
                          {rec.status === "APPROVED" && (
                            <button
                              onClick={() => handleWorkflowTransition(rec._id, "RELEASE")}
                              disabled={isProcessing}
                              className="inline-flex items-center justify-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 px-3 sm:px-4 py-1.5 hover:bg-emerald-500/15 shadow-xs transition-all cursor-pointer"
                            >
                              <Send className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Release</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ================= FINALIZED PAYROLL (locked, immutable) ================= */}
      {finalizedRecords.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-emerald-400 stroke-[2]" />
            <h2 className="text-base font-semibold tracking-tight text-white">Finalized Payroll</h2>
            <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5">
              <Lock className="h-3 w-3" /> Locked — excluded from re-runs
            </span>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.35)] relative z-10">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-emerald-500/10 text-xs font-semibold uppercase tracking-wider text-emerald-900/80 border-b border-emerald-500/20">
                  <tr>
                    <th className="px-4 sm:px-6 py-4">Employee</th>
                    <th className="px-4 sm:px-6 py-4 hidden md:table-cell">Gross</th>
                    <th className="px-4 sm:px-6 py-4 hidden md:table-cell">Deductions</th>
                    <th className="px-4 sm:px-6 py-4">Net Paid</th>
                    <th className="px-4 sm:px-6 py-4 text-right">Slip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100/60">
                  {finalizedRecords.map(rec => (
                    <tr key={rec._id} className="hover:bg-[#0D0F15]/60 transition-colors duration-150">
                      <td className="px-4 sm:px-6 py-4 font-medium text-white">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{rec.employeeId?.fullName}</span>
                          <span className="text-xs text-gray-500 font-normal mt-0.5 font-mono tracking-wide">{rec.employeeId?.employeeId || "No ID"}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-xs font-medium text-gray-300 hidden md:table-cell">{formatIndianCurrency(rec.earnings.total)}</td>
                      <td className="px-4 sm:px-6 py-4 text-xs font-medium text-rose-400 hidden md:table-cell">-{formatIndianCurrency(rec.deductions.total)}</td>
                      <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-emerald-400">{formatIndianCurrency(rec.netSalary)}</td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <Link
                          href={`/admin/payroll/${rec._id}`}
                          className="inline-flex items-center justify-center gap-1 rounded-full bg-[#12141A] border border-white/10 text-xs font-semibold text-gray-200 px-3 sm:px-4 py-1.5 hover:bg-white/[0.03] shadow-xs transition-all"
                        >
                          <Eye className="h-3.5 w-3.5" /> <span className="hidden sm:inline">View Slip</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}