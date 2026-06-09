"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Briefcase, MapPin, ArrowLeft, Loader2, UploadCloud, CheckCircle2, AlertCircle, Sparkles,
} from "lucide-react";

interface JobPosting {
  _id: string;
  title: string;
  department: string;
  designation: string;
  description: string;
  requiredSkills: string[];
  experienceLevel: string;
  employmentType: string;
}

export default function JobApplicationPage() {
  const params = useParams();
  const jobId = params?.id as string;

  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!jobId) return;
    fetch(`/api/careers/${jobId}`)
      .then(async res => {
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const payload = await res.json();
        setJob(payload.data);
      })
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!form.fullName.trim() || !form.email.trim() || !file) {
      setResult({ ok: false, message: "Please provide your name, email, and a PDF resume." });
      return;
    }
    if (file.type !== "application/pdf") {
      setResult({ ok: false, message: "Only PDF resumes are supported." });
      return;
    }

    setSubmitting(true);
    setResult(null);
    try {
      const body = new FormData();
      body.append("jobPostingId", jobId);
      body.append("fullName", form.fullName.trim());
      body.append("email", form.email.trim());
      if (form.phone.trim()) body.append("phone", form.phone.trim());
      body.append("file", file);

      const res = await fetch("/api/careers/apply", { method: "POST", body });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Something went wrong while submitting your application.");

      setResult({
        ok: true,
        message: `Thanks, ${payload.data.fullName.split(" ")[0]} — your application for "${payload.data.jobTitle}" has been received. Our Hiring Agent has already reviewed your resume; our team will reach out if there's a match.`,
      });
      setForm({ fullName: "", email: "", phone: "" });
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: any) {
      setResult({ ok: false, message: err.message || "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090C] text-white">
      <div className="w-full flex justify-center fixed top-5 z-50 px-4 pointer-events-none">
        <header className="w-full max-w-5xl rounded-full border border-white/10 bg-[#0D0F15]/70 backdrop-blur-xl px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.35)] pointer-events-auto">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-7 w-7 rounded-xl bg-gradient-to-br from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] flex items-center justify-center shadow-xs overflow-hidden">
              <Image src="/logo.png" alt="HireNova Logo" width={20} height={20} style={{ width: 20, height: "auto" }} className="object-contain" priority />
            </div>
            <span className="text-sm font-bold tracking-tight text-white">HireNova Careers</span>
          </Link>
          <Link href="/login" className="text-xs font-semibold text-gray-300 hover:text-white px-3 py-1.5 transition-all">
            Employee / HR Login
          </Link>
        </header>
      </div>

      <main className="max-w-2xl mx-auto px-4 sm:px-8 pt-32 pb-20 space-y-8">
        <Link href="/careers" className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to open roles
        </Link>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500 gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading role details...
          </div>
        ) : notFound || !job ? (
          <div className="text-center py-20 rounded-2xl border border-white/10 bg-[#12141A] shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
            <AlertCircle className="h-8 w-8 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400">This role isn&apos;t accepting applications anymore.</p>
            <Link href="/careers" className="inline-block mt-4 text-xs font-semibold text-[oklch(0.62_0.21_291)] hover:underline">
              View other open roles
            </Link>
          </div>
        ) : (
          <>
            {/* Job details */}
            <div className="rounded-2xl border border-white/10 bg-[#12141A] p-6 sm:p-8 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-5">
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight text-white">{job.title}</h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {job.department}</span>
                  <span className="inline-flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {job.designation}</span>
                  <span>{job.experienceLevel}</span>
                  <span className="uppercase tracking-wide text-[10px] font-semibold text-gray-400 bg-white/[0.03] border border-white/10 px-2 py-0.5 rounded-md">
                    {job.employmentType.replace("_", " ")}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{job.description}</p>
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Required skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.requiredSkills.map(skill => (
                    <span key={skill} className="text-[11px] font-medium text-[oklch(0.62_0.21_291)] bg-[oklch(0.62_0.21_291)]/8 border border-[oklch(0.62_0.21_291)]/15 px-2.5 py-1 rounded-md">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Application form */}
            <div className="rounded-2xl border border-white/10 bg-[#12141A] p-6 sm:p-8 shadow-[0_12px_30px_rgba(0,0,0,0.35)] space-y-5">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                  Apply for this role <Sparkles className="h-3.5 w-3.5 text-[oklch(0.62_0.21_291)]" />
                </h2>
                <p className="text-xs text-gray-500 leading-relaxed">
                  No account needed — just upload your resume. Our Hiring Agent reads it instantly and our
                  team reviews the AI-ranked shortlist.
                </p>
              </div>

              {result && (
                <div className={`rounded-xl p-4 text-xs leading-relaxed flex items-start gap-3 border ${result.ok ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                  {result.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                  <span>{result.message}</span>
                </div>
              )}

              {!result?.ok && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Full Name</label>
                      <input
                        value={form.fullName}
                        onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                        className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
                        placeholder="e.g. Aisha Sharma"
                        disabled={submitting}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
                        placeholder="you@email.com"
                        disabled={submitting}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Phone (optional)</label>
                    <input
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-white/25 focus:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
                      placeholder="+91..."
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Resume (PDF, max 8MB)</label>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-6 text-sm text-gray-400 hover:bg-white/[0.03] hover:border-white/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <UploadCloud className="h-4 w-4" />
                      {fileName || "Click to choose a PDF"}
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={e => setFileName(e.target.files?.[0]?.name || "")}
                      disabled={submitting}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-[oklch(0.62_0.21_291)] to-[oklch(0.68_0.19_330)] hover:opacity-90 text-white text-sm font-medium px-6 py-3 rounded-full shadow-md shadow-[oklch(0.62_0.21_291)]/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Our Hiring Agent is reading your resume...</>
                    ) : (
                      "Submit Application"
                    )}
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
