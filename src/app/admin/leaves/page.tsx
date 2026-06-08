"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, X, Clock, AlertCircle, CalendarOff } from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";

type LeaveType = "SICK" | "CASUAL" | "EARNED" | "UNPAID" | "OTHER";
type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

interface LeaveRequest {
  _id: string;
  employeeId: {
    _id: string;
    fullName: string;
    employeeId: string;
    department: string;
  };
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
  PENDING: { label: "Pending", class: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  APPROVED: { label: "Approved", class: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  REJECTED: { label: "Rejected", class: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function AdminLeavesPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<"PENDING" | "ALL">("PENDING");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [remarkInputs, setRemarkInputs] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await apiFetch(`/api/leave-requests?status=${statusFilter}`);
      const payload = await res.json();
      if (res.ok) setRequests(payload.data || []);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleReview = async (id: string, action: "APPROVE" | "REJECT") => {
    setIsProcessing(id);
    setFeedback(null);
    try {
      const res = await apiFetch("/api/leave-requests/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveRequestId: id, action, adminRemark: remarkInputs[id] || "" }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Review action failed.");
      setFeedback({ type: "success", text: `Leave request ${action === "APPROVE" ? "approved" : "rejected"} successfully.` });
      fetchRequests();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setIsProcessing(null);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="space-y-8 max-w-5xl mx-auto text-white">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-white">Leave Management</h1>
          <p className="text-xs sm:text-sm text-gray-400">Review and approve employee leave requests.</p>
        </div>
        <div className="flex items-center gap-2">
          {(["PENDING", "ALL"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                statusFilter === s ? "bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] text-white border-transparent" : "bg-[#12141A] text-gray-300 border-white/10 hover:bg-white/[0.03]"
              }`}
            >
              {s === "PENDING" ? "Pending" : "All Requests"}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div className={`rounded-xl p-4 text-xs font-medium flex items-center gap-2.5 border animate-in fade-in duration-200 ${
          feedback.type === "success" ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" : "bg-red-500/10 text-red-300 border-red-500/20"
        }`}>
          {feedback.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-[#12141A] overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
        {isLoading ? (
          <div className="px-6 py-12 text-center text-xs text-gray-500">Loading leave requests...</div>
        ) : requests.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <CalendarOff className="h-8 w-8 text-gray-700 mx-auto mb-3" />
            <p className="text-xs text-gray-500">No {statusFilter === "PENDING" ? "pending" : ""} leave requests found.</p>
          </div>
        ) : (
          <div className="divide-y border-white/8">
            {requests.map((req) => (
              <div key={req._id} className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-white">{req.employeeId?.fullName}</span>
                      <span className="text-xs font-mono text-gray-500">{req.employeeId?.employeeId}</span>
                      <span className="text-xs text-gray-500">• {req.employeeId?.department}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-gray-200">{LEAVE_TYPE_LABELS[req.leaveType]}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${statusConfig[req.status].class}`}>
                        {req.status === "PENDING" && <Clock className="h-3 w-3" />}
                        {req.status === "APPROVED" && <CheckCircle2 className="h-3 w-3" />}
                        {req.status === "REJECTED" && <X className="h-3 w-3" />}
                        {statusConfig[req.status].label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {formatDate(req.fromDate)} → {formatDate(req.toDate)}
                      <span className="ml-1.5 font-medium text-gray-200">({req.totalDays} day{req.totalDays !== 1 ? "s" : ""})</span>
                    </p>
                    <p className="text-xs text-gray-400 max-w-lg">{req.reason}</p>
                    {req.adminRemark && <p className="text-xs text-gray-500 italic">Remark: {req.adminRemark}</p>}
                  </div>
                  <div className="text-xs text-gray-500 shrink-0">Applied {formatDate(req.createdAt)}</div>
                </div>

                {req.status === "PENDING" && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1">
                    <input
                      type="text"
                      placeholder="Optional remark (shown to employee)..."
                      value={remarkInputs[req._id] || ""}
                      onChange={e => setRemarkInputs({ ...remarkInputs, [req._id]: e.target.value })}
                      className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReview(req._id, "APPROVE")}
                        disabled={isProcessing === req._id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 px-4 py-2 hover:bg-emerald-500/15 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleReview(req._id, "REJECT")}
                        disabled={isProcessing === req._id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400 px-4 py-2 hover:bg-red-500/15 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
