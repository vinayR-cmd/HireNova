"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarOff, Plus, X, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";

type LeaveType = "SICK" | "CASUAL" | "EARNED" | "UNPAID" | "OTHER";
type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

interface LeaveRequest {
  _id: string;
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  adminRemark?: string;
  createdAt: string;
}

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  SICK: "Sick Leave",
  CASUAL: "Casual Leave",
  EARNED: "Earned Leave",
  UNPAID: "Unpaid Leave",
  OTHER: "Other",
};

const statusConfig: Record<LeaveStatus, { label: string; class: string }> = {
  PENDING: { label: "Pending Review", class: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  APPROVED: { label: "Approved", class: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  REJECTED: { label: "Rejected", class: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function EmployeeLeavesPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({
    leaveType: "CASUAL" as LeaveType,
    fromDate: "",
    toDate: "",
    reason: "",
  });

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/api/leave-requests");
      const payload = await res.json();
      if (res.ok) setRequests(payload.data || []);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await apiFetch("/api/leave-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to submit leave request.");
      setFeedback({ type: "success", text: "Leave request submitted successfully. Awaiting admin review." });
      setShowForm(false);
      setForm({ leaveType: "CASUAL", fromDate: "", toDate: "", reason: "" });
      fetchRequests();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="space-y-8 max-w-4xl mx-auto text-white">

      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-white">Leave Requests</h1>
          <p className="text-xs sm:text-sm text-gray-400">Apply for leave and track your request status.</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setFeedback(null); }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] hover:opacity-90 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs font-semibold shadow-sm transition-all cursor-pointer shrink-0"
        >
          {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{showForm ? "Cancel" : "Apply for Leave"}</span>
          <span className="sm:hidden">{showForm ? "Cancel" : "Apply"}</span>
        </button>
      </div>

      {feedback && (
        <div className={`rounded-xl p-4 text-xs font-medium flex items-center gap-2.5 border animate-in fade-in duration-200 ${
          feedback.type === "success" ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" : "bg-red-500/10 text-red-300 border-red-500/20"
        }`}>
          {feedback.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Leave Application Form */}
      {showForm && (
        <div className="rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] animate-in fade-in slide-in-from-top-2 duration-200">
          <h3 className="font-semibold text-white text-base mb-5 pb-3 border-b border-white/8">New Leave Application</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Leave Type</label>
                <select
                  required
                  value={form.leaveType}
                  onChange={e => setForm({ ...form, leaveType: e.target.value as LeaveType })}
                  className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
                >
                  {Object.entries(LEAVE_TYPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div />
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">From Date</label>
                <input
                  type="date"
                  required
                  value={form.fromDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={e => setForm({ ...form, fromDate: e.target.value })}
                  className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">To Date</label>
                <input
                  type="date"
                  required
                  value={form.toDate}
                  min={form.fromDate || new Date().toISOString().split("T")[0]}
                  onChange={e => setForm({ ...form, toDate: e.target.value })}
                  className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Reason</label>
                <textarea
                  required
                  rows={3}
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                  placeholder="Briefly describe your reason for leave..."
                  className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] hover:opacity-90 text-white text-sm font-medium px-6 py-2.5 rounded-full shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? "Submitting..." : "Submit Leave Request"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Leave Requests List */}
      <div className="rounded-2xl border border-white/10 bg-[#12141A] overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
        <div className="px-6 py-4 border-b border-white/8">
          <h3 className="font-semibold text-white text-sm">My Leave History</h3>
        </div>
        {isLoading ? (
          <div className="px-6 py-12 text-center text-xs text-gray-500">Loading leave requests...</div>
        ) : requests.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <CalendarOff className="h-8 w-8 text-gray-700 mx-auto mb-3" />
            <p className="text-xs text-gray-500">No leave requests found. Apply for leave using the button above.</p>
          </div>
        ) : (
          <div className="divide-y border-white/8">
            {requests.map((req) => (
              <div key={req._id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-white">{LEAVE_TYPE_LABELS[req.leaveType]}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${statusConfig[req.status].class}`}>
                      {req.status === "PENDING" && <Clock className="h-3 w-3" />}
                      {req.status === "APPROVED" && <CheckCircle2 className="h-3 w-3" />}
                      {req.status === "REJECTED" && <X className="h-3 w-3" />}
                      {statusConfig[req.status].label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {formatDate(req.fromDate)} → {formatDate(req.toDate)}
                    <span className="ml-2 font-medium text-gray-200">({req.totalDays} day{req.totalDays !== 1 ? "s" : ""})</span>
                  </p>
                  <p className="text-xs text-gray-500">{req.reason}</p>
                  {req.adminRemark && (
                    <p className="text-xs text-gray-400 italic">Admin note: {req.adminRemark}</p>
                  )}
                </div>
                <div className="text-xs text-gray-500 shrink-0">
                  Applied {formatDate(req.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
