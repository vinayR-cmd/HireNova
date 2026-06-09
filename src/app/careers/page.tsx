"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Briefcase, MapPin, ArrowRight, Sparkles, Loader2 } from "lucide-react";

interface JobPosting {
  _id: string;
  title: string;
  department: string;
  designation: string;
  experienceLevel: string;
  employmentType: string;
  requiredSkills: string[];
}

export default function CareersPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/careers")
      .then(res => res.json())
      .then(payload => setJobs(payload.data?.records || []))
      .finally(() => setLoading(false));
  }, []);

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

      <main className="max-w-4xl mx-auto px-4 sm:px-8 pt-32 pb-20 space-y-10">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/[0.07] border border-white/15 px-3.5 py-1 rounded-full text-[10px] font-bold text-gray-300 uppercase tracking-wider shadow-2xs">
            <Sparkles className="h-3 w-3 text-[oklch(0.62_0.21_291)]" /> Open Roles — Reviewed by AI, Decided by Humans
          </div>
          <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-white leading-tight">
            Join the team building what&apos;s next.
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            Apply directly — no account needed. Our Hiring Agent reads your resume, scores it against the role,
            and our team takes it from there. You&apos;ll hear back faster because nothing sits in an inbox.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500 gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading open roles...
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-white/10 bg-[#12141A] shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
            <Briefcase className="h-8 w-8 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No open roles right now — check back soon.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <Link
                key={job._id}
                href={`/careers/${job._id}`}
                className="group block rounded-2xl border border-white/10 bg-[#12141A] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition-all hover:border-[oklch(0.62_0.21_291)]/30 hover:shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-white tracking-tight group-hover:text-[oklch(0.62_0.21_291)] transition-colors">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {job.department}</span>
                      <span className="inline-flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {job.designation}</span>
                      <span>{job.experienceLevel}</span>
                      <span className="uppercase tracking-wide text-[10px] font-semibold text-gray-400 bg-white/[0.03] border border-white/10 px-2 py-0.5 rounded-md">
                        {job.employmentType.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.requiredSkills.slice(0, 6).map(skill => (
                        <span key={skill} className="text-[10px] font-medium text-[oklch(0.62_0.21_291)] bg-[oklch(0.62_0.21_291)]/8 border border-[oklch(0.62_0.21_291)]/15 px-2 py-0.5 rounded-md">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-[oklch(0.62_0.21_291)] group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
