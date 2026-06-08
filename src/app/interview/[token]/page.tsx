"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
  Sparkles, Loader2, Mic, Send, CheckCircle2, AlertCircle,
  Trophy, ThumbsUp, ThumbsDown, ArrowRight,
} from "lucide-react";

interface PublicInterviewState {
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  currentIndex: number;
  totalQuestions: number;
  currentQuestion?: { question: string; category: string; difficulty: string } | null;
  candidateName: string;
  jobTitle: string;
  report?: {
    overallScore: number;
    technicalScore: number;
    communicationScore: number;
    confidenceScore: number;
    problemSolvingScore: number;
    recommendation: string;
    summary: string;
    strengths: string[];
    weaknesses: string[];
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  TECHNICAL: "Technical",
  BEHAVIORAL: "Behavioral",
  PROBLEM_SOLVING: "Problem Solving",
};

const DIFFICULTY_STYLES: Record<string, string> = {
  EASY: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  MEDIUM: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  HARD: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function PublicInterviewPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<PublicInterviewState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/interviews/public/${token}`);
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "This interview link is invalid.");
      setState(payload.data);
    } catch (err: any) {
      setError(err.message || "This interview link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const begin = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/interviews/public/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "begin" }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Could not start the interview.");
      setState(payload.data);
    } catch (err: any) {
      setError(err.message || "Could not start the interview.");
    } finally {
      setBusy(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/interviews/public/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Could not submit your answer.");
      setState(payload.data);
      setAnswer("");
    } catch (err: any) {
      setError(err.message || "Could not submit your answer.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090C] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Image src="/logo.png" alt="RecruitIQ AI" width={28} height={28} className="rounded-lg" />
          <span className="font-semibold text-white tracking-tight">RecruitIQ AI</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[oklch(0.62_0.21_291)]/20 bg-[oklch(0.62_0.21_291)]/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.62_0.21_291)] ml-1">
            <Sparkles className="h-3 w-3" /> Interview Agent
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-500"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : error && !state ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center space-y-2">
            <AlertCircle className="h-6 w-6 text-red-500 mx-auto" />
            <p className="text-sm font-medium text-red-400">{error}</p>
          </div>
        ) : state ? (
          <div className="rounded-2xl border border-white/10 bg-[#12141A] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {error && (
              <div className="flex items-center gap-2.5 bg-red-500/10 border-b border-red-500/20 px-6 py-3 text-xs font-medium text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            {state.status === "NOT_STARTED" && (
              <div className="p-8 sm:p-10 text-center space-y-5">
                <div className="h-12 w-12 rounded-2xl bg-[oklch(0.62_0.21_291)]/10 flex items-center justify-center mx-auto">
                  <Mic className="h-5 w-5 text-[oklch(0.62_0.21_291)]" />
                </div>
                <div className="space-y-1.5">
                  <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-white">
                    Hi {state.candidateName.split(" ")[0]}, ready for your AI interview?
                  </h1>
                  <p className="text-sm text-gray-400 max-w-md mx-auto">
                    You&apos;re interviewing for <strong className="text-gray-200">{state.jobTitle}</strong>. This is a live, adaptive interview — the Interview Agent crafts each of the {state.totalQuestions} questions in real time based on your resume and how you answer, the way a real interviewer would. Take your time and answer in your own words.
                  </p>
                </div>
                <button onClick={begin} disabled={busy}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-all cursor-pointer disabled:opacity-50">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  Begin Interview
                </button>
              </div>
            )}

            {state.status === "IN_PROGRESS" && state.currentQuestion && (
              <div className="p-6 sm:p-8 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Question {state.currentIndex + 1} of {state.totalQuestions}</span>
                    <span>{Math.round(((state.currentIndex) / state.totalQuestions) * 100)}% complete</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/[0.05] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] transition-all duration-500" style={{ width: `${(state.currentIndex / state.totalQuestions) * 100}%` }} />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white/[0.03] border border-white/10 px-2.5 py-1 text-[10px] font-medium text-gray-300">
                      {CATEGORY_LABELS[state.currentQuestion.category] ?? state.currentQuestion.category}
                    </span>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${DIFFICULTY_STYLES[state.currentQuestion.difficulty]}`}>
                      {state.currentQuestion.difficulty}
                    </span>
                  </div>
                  <p className="text-base sm:text-lg font-medium text-white leading-relaxed">{state.currentQuestion.question}</p>
                </div>

                <div className="space-y-3">
                  <textarea
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    rows={6}
                    placeholder="Type your answer here — be specific, walk through your reasoning, and don't worry about being perfectly polished."
                    className="w-full px-4 py-3 text-sm rounded-xl border border-white/10 bg-white/[0.03] text-gray-200 focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all resize-none"
                  />
                  <div className="flex justify-end">
                    <button onClick={submitAnswer} disabled={busy || !answer.trim()}
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] px-6 py-2.5 text-xs font-semibold text-white hover:opacity-90 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      {busy ? "Evaluating your answer…" : state.currentIndex === state.totalQuestions - 1 ? "Submit Final Answer" : "Submit & Continue"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {state.status === "COMPLETED" && (
              <div className="p-6 sm:p-8 space-y-6">
                <div className="text-center space-y-2">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-white">Interview complete — thank you, {state.candidateName.split(" ")[0]}!</h1>
                  <p className="text-sm text-gray-400">The Interview Agent has compiled your results below. The hiring team will be in touch with next steps.</p>
                </div>

                {state.report && (
                  <>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-baseline gap-2">
                        <Trophy className="h-5 w-5 text-[oklch(0.62_0.21_291)]" />
                        <span className="text-3xl font-semibold tracking-tight text-white">{state.report.overallScore}</span>
                        <span className="text-xs text-gray-500">/100 overall</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <ScoreTile label="Technical" value={state.report.technicalScore} />
                        <ScoreTile label="Communication" value={state.report.communicationScore} />
                        <ScoreTile label="Confidence" value={state.report.confidenceScore} />
                        <ScoreTile label="Problem Solving" value={state.report.problemSolvingScore} />
                      </div>
                    </div>

                    <div className="rounded-xl bg-[oklch(0.62_0.21_291)]/5 border border-[oklch(0.62_0.21_291)]/15 p-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-[oklch(0.62_0.21_291)]" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.62_0.21_291)]">Interview Agent Summary</span>
                      </div>
                      <p className="text-sm text-gray-200 leading-relaxed">{state.report.summary}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-emerald-400"><ThumbsUp className="h-4 w-4" /><h3 className="font-semibold text-sm">Strengths</h3></div>
                        <ul className="space-y-1.5">
                          {state.report.strengths.map((s, i) => <li key={i} className="text-sm text-gray-300 flex gap-2"><span className="text-emerald-500 mt-0.5">•</span>{s}</li>)}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-amber-400"><ThumbsDown className="h-4 w-4" /><h3 className="font-semibold text-sm">Growth Areas</h3></div>
                        <ul className="space-y-1.5">
                          {state.report.weaknesses.map((w, i) => <li key={i} className="text-sm text-gray-300 flex gap-2"><span className="text-amber-500 mt-0.5">•</span>{w}</li>)}
                        </ul>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ) : null}
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
