"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles, Briefcase, Users, Trophy, Target, Plus, X, ArrowUpRight,
  CheckCircle2, AlertCircle, Loader2,
} from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { DEPARTMENTS, DESIGNATIONS, EMPLOYMENT_TYPES } from "@/constants/hr";

interface JobPostingRecord {
  _id: string;
  title: string;
  department: string;
  designation: string;
  experienceLevel: string;
  status: "DRAFT" | "OPEN" | "CLOSED";
  requiredSkills: string[];
  applicantCount: number;
  shortlistedCount: number;
  hiredCount: number;
  createdAt: string;
}

interface FunnelOverview {
  openJobs: number;
  totalCandidates: number;
  shortlisted: number;
  interviewing: number;
  hired: number;
}

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  DRAFT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  CLOSED: "bg-white/[0.05] text-gray-400 border-white/10",
};

export default function HiringAgentPage() {
  const [postings, setPostings] = useState<JobPostingRecord[]>([]);
  const [overview, setOverview] = useState<FunnelOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [jobsRes, overviewRes] = await Promise.all([
        apiFetch("/api/jobs"),
        apiFetch("/api/agents/analytics/hiring-overview"),
      ]);
      if (jobsRes.ok) {
        const payload = await jobsRes.json();
        setPostings(payload.data.records);
      }
      if (overviewRes.ok) {
        const payload = await overviewRes.json();
        setOverview(payload.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const kpis = [
    { label: "Open Roles", value: overview?.openJobs ?? "—", icon: Briefcase },
    { label: "Total Candidates", value: overview?.totalCandidates ?? "—", icon: Users },
    { label: "Shortlisted", value: overview?.shortlisted ?? "—", icon: Target },
    { label: "Hired via AI", value: overview?.hired ?? "—", icon: Trophy },
  ];

  return (
    <div className="space-y-8 sm:space-y-10 max-w-7xl mx-auto text-white transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)]">

      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[oklch(0.62_0.21_291)]/20 bg-[oklch(0.62_0.21_291)]/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.62_0.21_291)]">
            <Sparkles className="h-3 w-3" /> Hiring Agent
          </div>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-white">Recruiting Control Center</h1>
          <p className="text-xs sm:text-sm text-gray-400 font-normal max-w-xl">
            Post a role, drop in resumes, and let the AI parse, score, and rank every candidate against your job description — explainable, in seconds.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-all cursor-pointer shrink-0"
        >
          <Plus className="h-3.5 w-3.5" /> New Job Posting
        </button>
      </div>

      {feedback && (
        <div className={`flex items-center gap-2.5 rounded-xl p-4 text-xs font-medium border animate-in fade-in ${feedback.type === "success" ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
          {feedback.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="ml-auto cursor-pointer"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* ================= KPI TILES ================= */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="rounded-2xl border border-white/10 bg-[#12141A] p-4 sm:p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] flex items-center justify-between transition-all duration-200 hover:border-white/15">
              <div className="space-y-1 sm:space-y-1.5 min-w-0 pr-2">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 truncate">{kpi.label}</p>
                <p className="text-xl sm:text-2xl font-semibold tracking-tight text-white">{kpi.value}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2 sm:p-3 flex items-center justify-center shrink-0 text-white">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 stroke-[1.75]" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= JOB POSTINGS GRID ================= */}
      <div className="space-y-4">
        <h3 className="font-semibold text-white text-base tracking-tight">Open Job Postings</h3>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : postings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-12 text-center">
            <Briefcase className="h-8 w-8 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No job postings yet. Create one to start sourcing AI-ranked candidates.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {postings.map(posting => (
              <Link
                key={posting._id}
                href={`/admin/hiring/jobs/${posting._id}`}
                className="group rounded-2xl border border-white/10 bg-[#12141A] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.35)] hover:border-white/15 transition-all duration-200 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{posting.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{posting.department} · {posting.designation}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${STATUS_STYLES[posting.status]}`}>
                    {posting.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {posting.requiredSkills.slice(0, 4).map(skill => (
                    <span key={skill} className="rounded-full bg-white/[0.03] border border-white/10 px-2.5 py-1 text-[10px] font-medium text-gray-300">{skill}</span>
                  ))}
                  {posting.requiredSkills.length > 4 && (
                    <span className="rounded-full bg-white/[0.03] border border-white/10 px-2.5 py-1 text-[10px] font-medium text-gray-500">+{posting.requiredSkills.length - 4} more</span>
                  )}
                </div>

                <div className="mt-auto pt-3 border-t border-white/8 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4 text-gray-400">
                    <span><strong className="text-white">{posting.applicantCount}</strong> applicants</span>
                    <span><strong className="text-white">{posting.shortlistedCount}</strong> shortlisted</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-gray-500 group-hover:text-white transition-colors">
                    View <ArrowUpRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateJobPostingModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); setFeedback({ type: "success", text: "Job posting created. Start uploading resumes to see the Hiring Agent rank candidates." }); load(); }}
          onError={(msg) => setFeedback({ type: "error", text: msg })}
        />
      )}
    </div>
  );
}

// ─── Create Job Posting Modal ─────────────────────────────────────────────────

function CreateJobPostingModal({ onClose, onCreated, onError }: { onClose: () => void; onCreated: () => void; onError: (msg: string) => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<{
    title: string;
    department: string;
    designation: string;
    experienceLevel: string;
    employmentType: string;
    description: string;
    skillsInput: string;
  }>({
    title: "",
    department: DEPARTMENTS[0],
    designation: "",
    experienceLevel: "2-4 years",
    employmentType: "FULL_TIME",
    description: "",
    skillsInput: "",
  });

  const designationOptions = DESIGNATIONS[form.department] ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const requiredSkills = form.skillsInput.split(",").map(s => s.trim()).filter(Boolean);
    if (!form.title || !form.designation || !form.description || requiredSkills.length === 0) {
      onError("Please fill in title, designation, description, and at least one required skill.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          department: form.department,
          designation: form.designation,
          experienceLevel: form.experienceLevel,
          employmentType: form.employmentType,
          description: form.description,
          requiredSkills,
          status: "OPEN",
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to create job posting.");
      onCreated();
    } catch (err: any) {
      onError(err.message || "Failed to create job posting.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#12141A] shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
          <div>
            <h3 className="font-semibold text-white text-base tracking-tight">New Job Posting</h3>
            <p className="text-xs text-gray-500 mt-0.5">The Hiring Agent will use this description to score every applicant.</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white cursor-pointer"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <Field label="Job Title">
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Senior Backend Engineer" className={inputClass} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Department">
              <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value, designation: "" }))} className={inputClass}>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Designation">
              <select value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} className={inputClass}>
                <option value="">Select designation</option>
                {designationOptions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Experience Level">
              <input value={form.experienceLevel} onChange={e => setForm(f => ({ ...f, experienceLevel: e.target.value }))}
                placeholder="e.g. 3-5 years" className={inputClass} />
            </Field>
            <Field label="Employment Type">
              <select value={form.employmentType} onChange={e => setForm(f => ({ ...f, employmentType: e.target.value }))} className={inputClass}>
                {EMPLOYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Required Skills (comma separated)">
            <input value={form.skillsInput} onChange={e => setForm(f => ({ ...f, skillsInput: e.target.value }))}
              placeholder="e.g. Node.js, MongoDB, System Design, AWS" className={inputClass} />
          </Field>

          <Field label="Job Description">
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={5} placeholder="Responsibilities, must-have qualifications, what success looks like in this role..."
              className={`${inputClass} resize-none`} />
          </Field>
        </form>

        <div className="px-6 py-4 border-t border-white/8 flex items-center justify-end gap-3">
          <button onClick={onClose} className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-white/[0.03] transition-all cursor-pointer">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] px-5 py-2 text-xs font-semibold text-white hover:opacity-90 transition-all cursor-pointer disabled:opacity-50">
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Publish Posting
          </button>
        </div>
      </div>
    </div>
  );
}

const inputClass = "w-full px-4 py-2.5 text-sm rounded-xl border border-white/10 bg-white/[0.03] text-gray-200 focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-gray-300">{label}</span>
      {children}
    </label>
  );
}
