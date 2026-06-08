"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Sparkles, UploadCloud, Loader2, X, CheckCircle2, AlertCircle,
  Trophy, ArrowUpRight, FileText,
} from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";

interface CandidateRecord {
  _id: string;
  fullName: string;
  email: string;
  matchScore?: number;
  recommendation?: "STRONG_HIRE" | "HIRE" | "CONSIDER" | "REJECT";
  status: string;
  aiSummary?: string;
  createdAt: string;
}

interface JobPostingDetail {
  _id: string;
  title: string;
  department: string;
  designation: string;
  description: string;
  requiredSkills: string[];
  experienceLevel: string;
  status: string;
}

const RECOMMENDATION_STYLES: Record<string, string> = {
  STRONG_HIRE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  HIRE: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  CONSIDER: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  REJECT: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function JobPostingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [posting, setPosting] = useState<JobPostingDetail | null>(null);
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/jobs/${id}`);
      if (res.ok) {
        const payload = await res.json();
        setPosting(payload.data.posting);
        setCandidates(payload.data.candidates);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const ranked = [...candidates].sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1));

  return (
    <div className="space-y-8 max-w-6xl mx-auto text-white">
      <Link href="/admin/hiring" className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Hiring Agent
      </Link>

      {feedback && (
        <div className={`flex items-center gap-2.5 rounded-xl p-4 text-xs font-medium border animate-in fade-in ${feedback.type === "success" ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
          {feedback.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="ml-auto cursor-pointer"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {loading || !posting ? (
        <div className="flex items-center justify-center py-24 text-gray-500"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : (
        <>
          {/* ================= JOB HEADER ================= */}
          <div className="rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-white">{posting.title}</h1>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">{posting.department} · {posting.designation} · {posting.experienceLevel}</p>
              </div>
              <button
                onClick={() => setShowUpload(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-all cursor-pointer shrink-0"
              >
                <UploadCloud className="h-3.5 w-3.5" /> Upload Resume
              </button>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{posting.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {posting.requiredSkills.map(skill => (
                <span key={skill} className="rounded-full bg-white/[0.03] border border-white/10 px-2.5 py-1 text-[10px] font-medium text-gray-300">{skill}</span>
              ))}
            </div>
          </div>

          {/* ================= RANKED CANDIDATES ================= */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-[oklch(0.62_0.21_291)]" />
              <h3 className="font-semibold text-white text-base tracking-tight">AI-Ranked Candidates</h3>
              <span className="text-xs text-gray-500">({ranked.length})</span>
            </div>

            {ranked.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-12 text-center">
                <FileText className="h-8 w-8 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No resumes uploaded yet. Upload one to see the Hiring Agent parse, score, and rank it instantly.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-[#12141A] overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-white/[0.05] text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-white/10">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Rank</th>
                        <th className="px-4 py-3 font-semibold">Candidate</th>
                        <th className="px-4 py-3 font-semibold">Match Score</th>
                        <th className="px-4 py-3 font-semibold">AI Verdict</th>
                        <th className="px-4 py-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-white/8">
                      {ranked.map((candidate, idx) => (
                        <tr key={candidate._id} className="hover:bg-white/[0.02] transition-colors duration-150">
                          <td className="px-4 py-4 font-semibold text-gray-500">#{idx + 1}</td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-white">{candidate.fullName}</span>
                              <span className="text-xs text-gray-500 mt-0.5">{candidate.email}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {candidate.matchScore != null ? (
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-20 rounded-full bg-white/[0.05] overflow-hidden">
                                  <div className="h-full rounded-full bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)]" style={{ width: `${candidate.matchScore}%` }} />
                                </div>
                                <span className="font-semibold text-white text-xs">{candidate.matchScore}/100</span>
                              </div>
                            ) : <span className="text-xs text-gray-500">Pending</span>}
                          </td>
                          <td className="px-4 py-4">
                            {candidate.recommendation && (
                              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${RECOMMENDATION_STYLES[candidate.recommendation]}`}>
                                {candidate.recommendation.replace("_", " ")}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <Link
                              href={`/admin/hiring/candidates/${candidate._id}`}
                              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#12141A] px-4 py-1.5 text-xs font-semibold text-gray-200 hover:bg-white/[0.03] transition-all cursor-pointer shadow-xs"
                            >
                              View Profile <ArrowUpRight className="h-3 w-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {showUpload && posting && (
        <UploadResumeModal
          jobPostingId={posting._id}
          onClose={() => setShowUpload(false)}
          onDone={(msg, ok) => { setShowUpload(false); setFeedback({ type: ok ? "success" : "error", text: msg }); if (ok) load(); }}
        />
      )}
    </div>
  );
}

// ─── Upload Resume Modal ──────────────────────────────────────────────────────

function UploadResumeModal({ jobPostingId, onClose, onDone }: { jobPostingId: string; onClose: () => void; onDone: (msg: string, ok: boolean) => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState<"idle" | "parsing">("idle");
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });
  const [fileName, setFileName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!form.fullName || !form.email || !file) {
      onDone("Please provide candidate name, email, and a PDF resume.", false);
      return;
    }

    setSubmitting(true);
    setStage("parsing");
    try {
      const body = new FormData();
      body.append("jobPostingId", jobPostingId);
      body.append("fullName", form.fullName);
      body.append("email", form.email);
      if (form.phone) body.append("phone", form.phone);
      body.append("file", file);

      const res = await apiFetch("/api/candidates", { method: "POST", body });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to process resume.");

      onDone(`${form.fullName} scored ${payload.data.matchScore}/100 — AI verdict: ${String(payload.data.recommendation).replace("_", " ")}.`, true);
    } catch (err: any) {
      onDone(err.message || "Failed to process resume.", false);
    } finally {
      setSubmitting(false);
      setStage("idle");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12141A] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[oklch(0.62_0.21_291)]" />
            <h3 className="font-semibold text-white text-base tracking-tight">Upload Resume</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white cursor-pointer"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <Field label="Candidate Full Name">
            <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} className={inputClass} placeholder="e.g. Aisha Sharma" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputClass} placeholder="candidate@email.com" />
            </Field>
            <Field label="Phone (optional)">
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputClass} placeholder="+91..." />
            </Field>
          </div>

          <label className="block">
            <span className="text-xs font-medium text-gray-300 mb-1.5 block">Resume PDF</span>
            <div
              onClick={() => fileRef.current?.click()}
              className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center cursor-pointer hover:border-white/20 hover:bg-white/[0.03] transition-all"
            >
              <UploadCloud className="h-6 w-6 text-gray-500 mx-auto mb-2" />
              <p className="text-xs text-gray-400">{fileName || "Click to choose a PDF (max 8MB)"}</p>
            </div>
            <input ref={fileRef} type="file" accept="application/pdf" className="hidden"
              onChange={e => setFileName(e.target.files?.[0]?.name || "")} />
          </label>

          {stage === "parsing" && (
            <div className="flex items-center gap-2.5 rounded-xl bg-[oklch(0.62_0.21_291)]/5 border border-[oklch(0.62_0.21_291)]/20 px-4 py-3 text-xs text-[oklch(0.62_0.21_291)] font-medium">
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              <span>Hiring Agent is reading the resume, extracting skills & experience, and scoring against the job description…</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-white/[0.03] transition-all cursor-pointer">Cancel</button>
            <button type="submit" disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] px-5 py-2 text-xs font-semibold text-white hover:opacity-90 transition-all cursor-pointer disabled:opacity-50">
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Analyze with AI
            </button>
          </div>
        </form>
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
