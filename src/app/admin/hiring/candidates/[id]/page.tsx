"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Sparkles, Loader2, CheckCircle2, AlertCircle, X,
  GraduationCap, Briefcase, Wrench, ThumbsUp, ThumbsDown, Mail, Phone,
  FileText, Mic, Trophy, Ban, Copy, ExternalLink, ArrowUpRight,
  Layers, SearchCode, Quote, CircleSlash,
} from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";

interface CandidateDetail {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  matchScore?: number;
  recommendation?: "STRONG_HIRE" | "HIRE" | "CONSIDER" | "REJECT";
  strengths?: string[];
  weaknesses?: string[];
  aiSummary?: string;
  status: string;
  parsedData?: {
    skills: string[];
    education: { degree: string; institution: string; year?: string }[];
    experience: { company: string; role: string; duration?: string }[];
    totalExperienceYears?: number;
    sections?: { name: string; content: string }[];
  };
  skillEvidence?: {
    skill: string;
    matched: boolean;
    matches: { section: string; excerpt: string; similarity: number }[];
  }[];
  jobPostingId?: { _id: string; title: string; requiredSkills?: string[] };
}

interface InterviewSummary {
  _id: string;
  token: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  report?: { overallScore: number; recommendation: string };
}

const RECOMMENDATION_STYLES: Record<string, string> = {
  STRONG_HIRE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  HIRE: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  CONSIDER: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  REJECT: "bg-red-500/10 text-red-400 border-red-500/20",
};

const STATUS_STYLES: Record<string, string> = {
  APPLIED: "bg-white/[0.05] text-gray-400 border-white/10",
  SCREENED: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  SHORTLISTED: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  INTERVIEWING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  INTERVIEWED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  HIRED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [interview, setInterview] = useState<InterviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [generatingInterview, setGeneratingInterview] = useState(false);
  const [hiring, setHiring] = useState(false);
  const [hireResult, setHireResult] = useState<{ employeeId: string; email: string; tempPassword: string } | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/candidates/${id}`);
      if (res.ok) {
        const payload = await res.json();
        setCandidate(payload.data);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!candidate || !["INTERVIEWING", "INTERVIEWED", "HIRED"].includes(candidate.status)) return;
    apiFetch(`/api/interviews?candidateId=${candidate._id}`)
      .then(res => res.ok ? res.json() : null)
      .then(payload => { if (payload?.data) setInterview(payload.data); })
      .catch(() => {});
  }, [candidate]);

  const startInterview = async () => {
    if (!candidate) return;
    setGeneratingInterview(true);
    try {
      const res = await apiFetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: candidate._id }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to generate the interview.");
      setInterview(payload.data);
      setFeedback({ type: "success", text: "Interview Agent generated a live, adaptive interview — it crafts each question in real time based on the candidate's answers. Share the link below with them." });
      load();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to generate the interview." });
    } finally {
      setGeneratingInterview(false);
    }
  };

  const hireCandidate = async () => {
    if (!candidate) return;
    setHiring(true);
    try {
      const res = await apiFetch(`/api/candidates/${candidate._id}/hire`, { method: "POST" });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to hire this candidate.");
      setHireResult(payload.data);
      setFeedback({ type: "success", text: `${candidate.fullName} is now an employee (${payload.data.employeeId}). The Onboarding Agent has emailed their welcome credentials.` });
      load();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to hire this candidate." });
    } finally {
      setHiring(false);
    }
  };

  const copyInterviewLink = (token: string) => {
    const link = `${window.location.origin}/interview/${token}`;
    navigator.clipboard?.writeText(link).then(() => {
      setFeedback({ type: "success", text: "Interview link copied to clipboard." });
    });
  };

  const updateStatus = async (status: string, successMsg: string) => {
    setBusy(true);
    try {
      const res = await apiFetch(`/api/candidates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to update candidate.");
      setFeedback({ type: "success", text: successMsg });
      load();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to update candidate." });
    } finally {
      setBusy(false);
    }
  };

  if (loading || !candidate) {
    return <div className="flex items-center justify-center py-24 text-gray-500"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  const parsed = candidate.parsedData;

  return (
    <div className="space-y-8 max-w-5xl mx-auto text-white">
      <Link href={candidate.jobPostingId ? `/admin/hiring/jobs/${candidate.jobPostingId._id}` : "/admin/hiring"} className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to {candidate.jobPostingId?.title ?? "Hiring Agent"}
      </Link>

      {feedback && (
        <div className={`flex items-center gap-2.5 rounded-xl p-4 text-xs font-medium border animate-in fade-in ${feedback.type === "success" ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
          {feedback.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="ml-auto cursor-pointer"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* ================= HEADER ================= */}
      <div className="rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-white">{candidate.fullName}</h1>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${STATUS_STYLES[candidate.status] ?? STATUS_STYLES.APPLIED}`}>
                {candidate.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
              <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{candidate.email}</span>
              {candidate.phone && <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{candidate.phone}</span>}
              {candidate.resumeUrl && (
                <a href={candidate.resumeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-gray-200 hover:text-white font-medium underline underline-offset-2">
                  <FileText className="h-3.5 w-3.5" /> View Resume PDF
                </a>
              )}
            </div>
          </div>

          {candidate.matchScore != null && (
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight text-white">{candidate.matchScore}</span>
                <span className="text-xs text-gray-500">/100 match</span>
              </div>
              {candidate.recommendation && (
                <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${RECOMMENDATION_STYLES[candidate.recommendation]}`}>
                  AI Verdict: {candidate.recommendation.replace("_", " ")}
                </span>
              )}
            </div>
          )}
        </div>

        {candidate.aiSummary && (
          <div className="rounded-xl bg-[oklch(0.62_0.21_291)]/5 border border-[oklch(0.62_0.21_291)]/15 p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[oklch(0.62_0.21_291)]" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.62_0.21_291)]">Hiring Agent Summary</span>
            </div>
            <p className="text-sm text-gray-200 leading-relaxed">{candidate.aiSummary}</p>
          </div>
        )}

        {/* ================= ACTIONS ================= */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/8">
          {!interview && (
            <button
              disabled={generatingInterview || ["HIRED", "REJECTED"].includes(candidate.status)}
              onClick={startInterview}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] px-5 py-2.5 text-xs font-semibold text-white hover:opacity-90 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {generatingInterview ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mic className="h-3.5 w-3.5" />}
              {generatingInterview ? "Generating interview…" : "Start AI Interview"}
            </button>
          )}
          <button
            disabled={hiring || candidate.status === "HIRED" || candidate.status === "REJECTED"}
            onClick={hireCandidate}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-5 py-2.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/15 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {hiring ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trophy className="h-3.5 w-3.5" />}
            {hiring ? "Onboarding Agent is setting up their account…" : "Hire Candidate"}
          </button>
          <button
            disabled={busy || candidate.status === "HIRED" || candidate.status === "REJECTED"}
            onClick={() => updateStatus("REJECTED", `${candidate.fullName} marked as rejected.`)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-xs font-semibold text-gray-300 hover:bg-white/[0.03] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Ban className="h-3.5 w-3.5" /> Reject
          </button>
        </div>
      </div>

      {/* ================= ONBOARDING HANDOFF ================= */}
      {hireResult && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 space-y-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-emerald-400">
            <Sparkles className="h-4 w-4" />
            <h3 className="font-semibold text-sm tracking-tight">Onboarding Agent — Account Provisioned</h3>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            {candidate.fullName} now has an active employee account and a welcome email with these credentials. Share the temporary password securely if needed — they'll be prompted to set a new one after their first login.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg bg-[#12141A] border border-emerald-500/20 px-3 py-2">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Employee ID</p>
              <p className="font-mono font-semibold text-white mt-0.5">{hireResult.employeeId}</p>
            </div>
            <div className="rounded-lg bg-[#12141A] border border-emerald-500/20 px-3 py-2">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Login Email</p>
              <p className="font-mono font-semibold text-white mt-0.5 truncate">{hireResult.email}</p>
            </div>
            <div className="rounded-lg bg-[#12141A] border border-emerald-500/20 px-3 py-2">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Temporary Password</p>
              <p className="font-mono font-semibold text-white mt-0.5">{hireResult.tempPassword}</p>
            </div>
          </div>
        </div>
      )}

      {/* ================= AI INTERVIEW ================= */}
      {interview && (
        <div className="rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-[oklch(0.62_0.21_291)]" />
              <h3 className="font-semibold text-white text-base tracking-tight">AI Interview</h3>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                interview.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : interview.status === "IN_PROGRESS" ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                : "bg-white/[0.05] text-gray-400 border-white/10"
              }`}>
                {interview.status.replace("_", " ")}
              </span>
            </div>

            {interview.status !== "COMPLETED" ? (
              <div className="flex items-center gap-2">
                <code className="rounded-lg bg-white/[0.03] border border-white/10 px-3 py-1.5 text-[11px] text-gray-300 truncate max-w-[260px]">
                  /interview/{interview.token}
                </code>
                <button onClick={() => copyInterviewLink(interview.token)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#12141A] px-3.5 py-1.5 text-xs font-semibold text-gray-200 hover:bg-white/[0.03] transition-all cursor-pointer">
                  <Copy className="h-3 w-3" /> Copy Link
                </button>
                <a href={`/interview/${interview.token}`} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#12141A] px-3.5 py-1.5 text-xs font-semibold text-gray-200 hover:bg-white/[0.03] transition-all cursor-pointer">
                  <ExternalLink className="h-3 w-3" /> Open
                </a>
              </div>
            ) : (
              <Link href={`/admin/hiring/interviews/${interview._id}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition-all cursor-pointer">
                View Full Report <ArrowUpRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          {interview.status === "COMPLETED" && interview.report && (
            <div className="flex items-center gap-4 pt-3 border-t border-white/8 text-xs text-gray-400">
              <span>Overall Score: <strong className="text-white">{interview.report.overallScore}/100</strong></span>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${RECOMMENDATION_STYLES[interview.report.recommendation] ?? RECOMMENDATION_STYLES.CONSIDER}`}>
                AI Verdict: {interview.report.recommendation.replace("_", " ")}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ================= STRENGTHS / WEAKNESSES ================= */}
      {(candidate.strengths?.length || candidate.weaknesses?.length) ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#12141A] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <ThumbsUp className="h-4 w-4" />
              <h3 className="font-semibold text-sm tracking-tight">Strengths</h3>
            </div>
            <ul className="space-y-2">
              {(candidate.strengths ?? []).map((s, i) => (
                <li key={i} className="text-sm text-gray-300 leading-relaxed flex gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span>{s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#12141A] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <ThumbsDown className="h-4 w-4" />
              <h3 className="font-semibold text-sm tracking-tight">Areas to Probe</h3>
            </div>
            <ul className="space-y-2">
              {(candidate.weaknesses ?? []).map((w, i) => (
                <li key={i} className="text-sm text-gray-300 leading-relaxed flex gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>{w}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {/* ================= RAG EVIDENCE DOSSIER ================= */}
      {!!candidate.skillEvidence?.length && (
        <div className="rounded-2xl border border-white/10 bg-[#12141A] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-4">
          <div className="flex items-center gap-2">
            <SearchCode className="h-4 w-4 text-[oklch(0.62_0.21_291)]" />
            <h3 className="font-semibold text-sm text-white tracking-tight">Evidence-Backed Skill Match</h3>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-gray-500">
              RAG Retrieval
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            For every required skill, the Hiring Agent embeds the job requirement and the candidate&apos;s segmented resume into the same vector space, then retrieves the most semantically similar excerpts. The verdict above is grounded in this evidence — not a free-form read of the resume.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {candidate.skillEvidence.map((entry, i) => (
              <div key={i} className={`rounded-xl border p-3.5 space-y-2 ${entry.matched ? "border-emerald-500/15 bg-emerald-500/[0.03]" : "border-red-500/15 bg-red-500/[0.03]"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-white">{entry.skill}</span>
                  {entry.matched ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-400">
                      <CheckCircle2 className="h-2.5 w-2.5" /> Evidence found
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-red-400">
                      <CircleSlash className="h-2.5 w-2.5" /> No match retrieved
                    </span>
                  )}
                </div>
                {entry.matches.length > 0 ? (
                  <ul className="space-y-1.5">
                    {entry.matches.map((m, j) => (
                      <li key={j} className="rounded-lg bg-white/[0.02] border border-white/8 p-2.5 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">{m.section}</span>
                          <span className="text-[10px] font-mono text-[oklch(0.68_0.19_330)]">{Math.round(m.similarity * 100)}% match</span>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-relaxed flex gap-1.5">
                          <Quote className="h-2.5 w-2.5 shrink-0 mt-0.5 text-gray-600" />
                          <span className="line-clamp-3">{m.excerpt}</span>
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-gray-500 italic">Nothing in this resume reaches the relevance threshold for this requirement — a real gap to probe in the interview.</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= PARSED RESUME DATA ================= */}
      {parsed && (
        <div className="space-y-4">
          <h3 className="font-semibold text-white text-base tracking-tight">AI-Extracted Resume Data</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 bg-[#12141A] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-3">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-gray-500" />
                <h4 className="font-semibold text-sm text-white">Skills</h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {parsed.skills?.map(skill => (
                  <span key={skill} className="rounded-full bg-white/[0.03] border border-white/10 px-2.5 py-1 text-[10px] font-medium text-gray-300">{skill}</span>
                ))}
              </div>
              {parsed.totalExperienceYears != null && (
                <p className="text-xs text-gray-500 pt-2 border-t border-white/8">~{parsed.totalExperienceYears} years total experience</p>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#12141A] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-gray-500" />
                <h4 className="font-semibold text-sm text-white">Experience</h4>
              </div>
              <ul className="space-y-3">
                {parsed.experience?.map((exp, i) => (
                  <li key={i}>
                    <p className="text-sm font-medium text-gray-200">{exp.role}</p>
                    <p className="text-xs text-gray-500">{exp.company}{exp.duration ? ` · ${exp.duration}` : ""}</p>
                  </li>
                ))}
                {!parsed.experience?.length && <p className="text-xs text-gray-500">No experience entries extracted.</p>}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#12141A] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-gray-500" />
                <h4 className="font-semibold text-sm text-white">Education</h4>
              </div>
              <ul className="space-y-3">
                {parsed.education?.map((ed, i) => (
                  <li key={i}>
                    <p className="text-sm font-medium text-gray-200">{ed.degree}</p>
                    <p className="text-xs text-gray-500">{ed.institution}{ed.year ? ` · ${ed.year}` : ""}</p>
                  </li>
                ))}
                {!parsed.education?.length && <p className="text-xs text-gray-500">No education entries extracted.</p>}
              </ul>
            </div>
          </div>

          {/* ================= SEGMENTED RESUME (RAG retrieval corpus) ================= */}
          {!!parsed.sections?.length && (
            <div className="rounded-2xl border border-white/10 bg-[#12141A] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-gray-500" />
                <h4 className="font-semibold text-sm text-white">Segmented Resume</h4>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-gray-500">
                  {parsed.sections.length} sections · retrieval corpus
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed pb-1">
                The Hiring Agent chunks each resume into labeled sections like a recruiter would skim it — these chunks are what get embedded and searched in the evidence-retrieval step above.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {parsed.sections.map((section, i) => (
                  <div key={i} className="rounded-xl bg-white/[0.02] border border-white/8 p-3.5 space-y-1.5">
                    <span className="inline-block rounded-full bg-[oklch(0.62_0.21_291)]/10 border border-[oklch(0.62_0.21_291)]/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.68_0.19_330)]">
                      {section.name}
                    </span>
                    <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-5 whitespace-pre-line">{section.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
