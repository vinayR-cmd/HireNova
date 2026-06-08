"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Sparkles, Loader2, Trophy, ThumbsUp, ThumbsDown,
  MessageSquareText, CheckCircle2,
} from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";

interface InterviewQuestionRecord {
  question: string;
  category: string;
  difficulty: string;
  answer?: string;
  score?: number;
  feedback?: string;
}

interface InterviewDetail {
  _id: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  questions: InterviewQuestionRecord[];
  currentIndex: number;
  candidateId: { _id: string; fullName: string } | string;
  jobPostingId: { _id: string; title: string } | string;
  report?: {
    technicalScore: number;
    communicationScore: number;
    confidenceScore: number;
    problemSolvingScore: number;
    overallScore: number;
    recommendation: string;
    summary: string;
    strengths: string[];
    weaknesses: string[];
  };
}

const RECOMMENDATION_STYLES: Record<string, string> = {
  STRONG_HIRE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  HIRE: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  CONSIDER: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  REJECT: "bg-red-500/10 text-red-400 border-red-500/20",
};

const DIFFICULTY_STYLES: Record<string, string> = {
  EASY: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  MEDIUM: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  HARD: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function InterviewReportPage() {
  const { id } = useParams<{ id: string }>();
  const [interview, setInterview] = useState<InterviewDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/interviews/${id}`);
      if (res.ok) {
        const payload = await res.json();
        setInterview(payload.data);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading || !interview) {
    return <div className="flex items-center justify-center py-24 text-gray-500"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  const candidate = typeof interview.candidateId === "object" ? interview.candidateId : null;
  const posting = typeof interview.jobPostingId === "object" ? interview.jobPostingId : null;
  const report = interview.report;

  return (
    <div className="space-y-8 max-w-4xl mx-auto text-white">
      <Link href={candidate ? `/admin/hiring/candidates/${candidate._id}` : "/admin/hiring"} className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to {candidate?.fullName ?? "Hiring Agent"}
      </Link>

      {/* ================= HEADER ================= */}
      <div className="rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[oklch(0.62_0.21_291)]/20 bg-[oklch(0.62_0.21_291)]/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.62_0.21_291)] mb-2">
              <Sparkles className="h-3 w-3" /> Interview Agent Report
            </div>
            <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-white">{candidate?.fullName ?? "Candidate"}</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">Interviewed for {posting?.title ?? "the role"}</p>
          </div>
          <span className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 ${
            interview.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
          }`}>
            {interview.status === "COMPLETED" && <CheckCircle2 className="h-3 w-3" />}
            {interview.status.replace("_", " ")}
          </span>
        </div>

        {report ? (
          <>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-baseline gap-2">
                <Trophy className="h-5 w-5 text-[oklch(0.62_0.21_291)]" />
                <span className="text-3xl font-semibold tracking-tight text-white">{report.overallScore}</span>
                <span className="text-xs text-gray-500">/100 overall</span>
                <span className={`ml-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${RECOMMENDATION_STYLES[report.recommendation] ?? RECOMMENDATION_STYLES.CONSIDER}`}>
                  AI Verdict: {report.recommendation.replace("_", " ")}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <ScoreTile label="Technical" value={report.technicalScore} />
                <ScoreTile label="Communication" value={report.communicationScore} />
                <ScoreTile label="Confidence" value={report.confidenceScore} />
                <ScoreTile label="Problem Solving" value={report.problemSolvingScore} />
              </div>
            </div>

            <div className="rounded-xl bg-[oklch(0.62_0.21_291)]/5 border border-[oklch(0.62_0.21_291)]/15 p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[oklch(0.62_0.21_291)]" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.62_0.21_291)]">Executive Summary</span>
              </div>
              <p className="text-sm text-gray-200 leading-relaxed">{report.summary}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-400"><ThumbsUp className="h-4 w-4" /><h3 className="font-semibold text-sm">Strengths</h3></div>
                <ul className="space-y-1.5">
                  {report.strengths.map((s, i) => <li key={i} className="text-sm text-gray-300 flex gap-2"><span className="text-emerald-500 mt-0.5">•</span>{s}</li>)}
                </ul>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-400"><ThumbsDown className="h-4 w-4" /><h3 className="font-semibold text-sm">Weaknesses</h3></div>
                <ul className="space-y-1.5">
                  {report.weaknesses.map((w, i) => <li key={i} className="text-sm text-gray-300 flex gap-2"><span className="text-amber-500 mt-0.5">•</span>{w}</li>)}
                </ul>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-400">This interview is still {interview.status === "NOT_STARTED" ? "waiting for the candidate to begin" : "in progress"} — the final report will appear here once all questions are answered.</p>
        )}
      </div>

      {/* ================= TRANSCRIPT ================= */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquareText className="h-4 w-4 text-gray-500" />
          <h3 className="font-semibold text-white text-base tracking-tight">Full Transcript</h3>
        </div>
        <div className="space-y-3">
          {interview.questions.map((q, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-[#12141A] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-gray-500">Q{i + 1}</span>
                <span className="rounded-full bg-white/[0.03] border border-white/10 px-2.5 py-1 text-[10px] font-medium text-gray-300">{q.category.replace("_", " ")}</span>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${DIFFICULTY_STYLES[q.difficulty]}`}>{q.difficulty}</span>
                {q.score != null && (
                  <span className="ml-auto rounded-full bg-white/10 text-white px-2.5 py-1 text-[10px] font-semibold">{q.score}/10</span>
                )}
              </div>
              <p className="text-sm font-medium text-white leading-relaxed">{q.question}</p>
              {q.answer ? (
                <div className="rounded-xl bg-white/[0.04] border border-white/8 p-4 space-y-2">
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{q.answer}</p>
                  {q.feedback && (
                    <p className="text-xs text-gray-500 pt-2 border-t border-white/10"><span className="font-semibold text-gray-400">AI feedback:</span> {q.feedback}</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">Not yet answered.</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScoreTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-[#12141A] border border-white/10 px-3 py-2 text-center">
      <p className="font-semibold text-white text-sm">{value}</p>
      <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}
