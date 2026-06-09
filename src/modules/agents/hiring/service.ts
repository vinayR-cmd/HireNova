import { connectDB } from "@/lib/db";
import { jobPostingRepository } from "@/repositories/job-posting.repository";
import { candidateRepository } from "@/repositories/candidate.repository";
import { auditRepository } from "@/repositories/audit.repository";
import { notificationRepository } from "@/repositories/notification.repository";
import { employeeRepository } from "@/repositories/employee.repository";
import { emailService } from "@/services/email";
import { uploadBuffer } from "@/lib/cloudinary";
import { extractTextFromPdf } from "@/lib/pdf";
import { chatJSON } from "@/modules/agents/shared/ai-client";
import { embedTexts, retrieveTopMatches } from "@/modules/agents/shared/embeddings";
import {
  RESUME_SEGMENTATION_SYSTEM_PROMPT,
  buildResumeSegmentationUserPrompt,
  EVIDENCE_SCORING_SYSTEM_PROMPT,
  buildEvidenceScoringUserPrompt,
} from "./prompts";
import type {
  ICandidateEducation,
  ICandidateExperience,
  IResumeSection,
  ISkillEvidence,
  HiringRecommendation,
  JobPostingStatus,
  CandidateStatus,
} from "@/lib/models";
import { User, Employee } from "@/lib/models";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import mongoose from "mongoose";

function generateTempPassword(): string {
  return randomBytes(6).toString("base64url");
}

interface ResumeSegmentationResult {
  sections: IResumeSection[];
  parsedData: {
    skills: string[];
    education: ICandidateEducation[];
    experience: ICandidateExperience[];
    totalExperienceYears?: number;
  };
}

interface EvidenceScoringResult {
  matchScore: number;
  recommendation: HiringRecommendation;
  strengths: string[];
  weaknesses: string[];
  aiSummary: string;
}

export class HiringAgentService {
  async createJobPosting(
    adminUserId: string,
    data: {
      title: string;
      department: string;
      designation: string;
      description: string;
      requiredSkills: string[];
      experienceLevel: string;
      employmentType?: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";
      status?: JobPostingStatus;
    }
  ) {
    await connectDB();

    const posting = await jobPostingRepository.create({
      ...data,
      createdBy: new mongoose.Types.ObjectId(adminUserId),
    });

    auditRepository
      .log(adminUserId, "JOB_POSTING_CREATED", `Created job posting "${data.title}" (${data.department} / ${data.designation}).`, {
        targetId: posting._id as mongoose.Types.ObjectId,
        targetModel: "JobPosting",
      })
      .catch(err => console.error("Audit log failed:", err));

    return posting;
  }

  async listJobPostings(filters: { status?: JobPostingStatus; page?: number; limit?: number } = {}) {
    await connectDB();
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const query: Record<string, unknown> = {};
    if (filters.status) query.status = filters.status;

    const [postings, total] = await Promise.all([
      jobPostingRepository.findAll(query, { skip: (page - 1) * limit, limit }),
      jobPostingRepository.count(query),
    ]);

    const enriched = await Promise.all(
      postings.map(async posting => {
        const [applicants, shortlisted, hired] = await Promise.all([
          candidateRepository.count({ jobPostingId: posting._id }),
          candidateRepository.count({ jobPostingId: posting._id, status: "SHORTLISTED" }),
          candidateRepository.count({ jobPostingId: posting._id, status: "HIRED" }),
        ]);
        return { ...posting, applicantCount: applicants, shortlistedCount: shortlisted, hiredCount: hired };
      })
    );

    return { records: enriched, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getJobPosting(id: string) {
    await connectDB();
    const posting = await jobPostingRepository.findById(id);
    if (!posting) throw new Error("Job posting not found.");
    return posting;
  }

  async updateJobPostingStatus(adminUserId: string, id: string, status: JobPostingStatus) {
    await connectDB();
    const posting = await jobPostingRepository.update(id, { status });
    if (!posting) throw new Error("Job posting not found.");
    return posting;
  }

  /**
   * Core Hiring Agent flow — a genuine retrieval-augmented generation (RAG)
   * pipeline rather than a single free-form LLM read of the resume:
   *
   *   1. EXTRACT  — pull raw text out of the uploaded resume PDF
   *   2. SEGMENT  — ask the model to chunk the resume into labeled sections
   *                 ("Work Experience", "Technical Skills", "Projects", …)
   *                 and extract structured profile data in the same pass
   *   3. EMBED    — vectorize every resume section AND every required skill
   *                 from the job posting into the same embedding space
   *   4. RETRIEVE — for each required skill, run a cosine-similarity search
   *                 over the section vectors and keep the top matches above
   *                 a relevance threshold — this assembles a per-skill
   *                 "evidence dossier" of concrete, citable resume excerpts
   *   5. GENERATE — hand that dossier (not the raw resume) to the scoring
   *                 model so its verdict is *grounded*: every strength or
   *                 gap it cites traces back to a retrieved excerpt and a
   *                 similarity score, rather than free-associating over text
   *
   * The sections + evidence dossier are persisted so the admin UI can show
   * exactly which resume excerpt backs (or fails to back) each requirement.
   */
  async submitCandidate(params: {
    jobPostingId: string;
    fullName: string;
    email: string;
    phone?: string;
    fileBuffer: Buffer;
    filename: string;
  }) {
    await connectDB();

    const posting = await jobPostingRepository.findById(params.jobPostingId);
    if (!posting) throw new Error("Job posting not found.");

    // 1. EXTRACT
    const [resumeText, upload] = await Promise.all([
      extractTextFromPdf(params.fileBuffer),
      uploadBuffer(params.fileBuffer, { folder: "hirenova/resumes", resourceType: "raw", filename: params.filename }),
    ]);

    if (!resumeText || resumeText.length < 30) {
      throw new Error("Could not extract readable text from this resume. Please upload a text-based PDF.");
    }

    // 2. SEGMENT — chunk the resume into a retrieval corpus + structured profile
    const segmentation = await chatJSON<ResumeSegmentationResult>({
      system: RESUME_SEGMENTATION_SYSTEM_PROMPT,
      user: buildResumeSegmentationUserPrompt(resumeText),
    });

    const sections = (segmentation.sections || []).filter(s => s.name && s.content?.trim().length > 0);
    const requiredSkills: string[] = posting.requiredSkills?.length ? posting.requiredSkills : [];

    let skillEvidence: ISkillEvidence[] = [];

    // 3 & 4. EMBED + RETRIEVE — only meaningful if we have both a corpus and queries
    if (sections.length > 0 && requiredSkills.length > 0) {
      const [sectionEmbeddings, skillEmbeddings] = await Promise.all([
        embedTexts(sections.map(s => `${s.name}: ${s.content}`)),
        embedTexts(requiredSkills),
      ]);

      skillEvidence = requiredSkills.map((skill, skillIdx) => {
        const topMatches = retrieveTopMatches(skillEmbeddings[skillIdx], sectionEmbeddings, { topK: 2, minSimilarity: 0.25 });
        const matches = topMatches.map(m => ({
          section: sections[m.sourceIndex].name,
          excerpt: sections[m.sourceIndex].content.slice(0, 400),
          similarity: Math.round(m.similarity * 100) / 100,
        }));
        return { skill, matched: matches.length > 0, matches };
      });
    }

    // 5. GENERATE — score grounded in the retrieved evidence dossier, not raw text
    const evidenceDossier = skillEvidence.length > 0
      ? skillEvidence.map(e => ({ skill: e.skill, matches: e.matches }))
      : requiredSkills.map(skill => ({ skill, matches: [] as { section: string; excerpt: string; similarity: number }[] }));

    const verdict = await chatJSON<EvidenceScoringResult>({
      system: EVIDENCE_SCORING_SYSTEM_PROMPT,
      user: buildEvidenceScoringUserPrompt({
        jobTitle: posting.title,
        department: posting.department,
        designation: posting.designation,
        experienceLevel: posting.experienceLevel,
        requiredSkills,
        jobDescription: posting.description,
        totalExperienceYears: segmentation.parsedData?.totalExperienceYears,
        topSkills: segmentation.parsedData?.skills || [],
        evidenceDossier,
      }),
    });

    const candidate = await candidateRepository.create({
      jobPostingId: new mongoose.Types.ObjectId(params.jobPostingId),
      fullName: params.fullName,
      email: params.email.toLowerCase().trim(),
      phone: params.phone,
      resumeUrl: upload.url,
      resumeText: resumeText.slice(0, 20000),
      parsedData: { ...segmentation.parsedData, sections },
      skillEvidence,
      matchScore: verdict.matchScore,
      recommendation: verdict.recommendation,
      strengths: verdict.strengths,
      weaknesses: verdict.weaknesses,
      aiSummary: verdict.aiSummary,
      status: verdict.matchScore >= 70 ? "SHORTLISTED" : "SCREENED",
    });

    return candidate;
  }

  async listCandidates(jobPostingId: string, options?: { status?: CandidateStatus }) {
    await connectDB();
    return candidateRepository.findByJobPosting(jobPostingId, options);
  }

  async getCandidate(id: string) {
    await connectDB();
    const candidate = await candidateRepository.findByIdPopulated(id);
    if (!candidate) throw new Error("Candidate not found.");
    return candidate;
  }

  async updateCandidateStatus(id: string, status: CandidateStatus) {
    await connectDB();
    const candidate = await candidateRepository.update(id, { status });
    if (!candidate) throw new Error("Candidate not found.");
    return candidate;
  }

  /**
   * Closes the loop on the demo flow: converts a hired candidate straight
   * into an active employee account — creating the User + Employee records
   * (mirroring the registration/approval pattern, but pre-activated since
   * the Hiring Agent has already vetted them), then hands off to the
   * Onboarding Agent via a welcome notification + email with credentials.
   */
  async hireCandidate(adminUserId: string, candidateId: string) {
    await connectDB();

    const candidate = await candidateRepository.findById(candidateId);
    if (!candidate) throw new Error("Candidate not found.");
    if (candidate.status === "HIRED") throw new Error("This candidate has already been hired.");

    const posting = await jobPostingRepository.findById(candidate.jobPostingId.toString());
    if (!posting) throw new Error("Job posting not found.");

    const normalizedEmail = candidate.email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) throw new Error("An account with this candidate's email already exists in the system.");

    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 12);
    const nextEmployeeId = await employeeRepository.getNextEmployeeId();

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const [newUser] = await User.create(
        [{ email: normalizedEmail, password: hashedPassword, role: "EMPLOYEE", status: "ACTIVE" }],
        { session }
      );

      const [newEmployee] = await Employee.create(
        [{
          userId: newUser._id,
          fullName: candidate.fullName,
          email: normalizedEmail,
          mobile: candidate.phone || "Not provided",
          employeeId: nextEmployeeId,
          department: posting.department,
          designation: posting.designation,
          officialDepartment: posting.department,
          officialDesignation: posting.designation,
          employmentType: posting.employmentType,
          joiningDate: new Date(),
          employmentStatus: "ACTIVE",
        }],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      await candidateRepository.update(candidateId, {
        status: "HIRED",
        hiredEmployeeId: newEmployee._id as mongoose.Types.ObjectId,
      });

      auditRepository
        .log(adminUserId, "CANDIDATE_HIRED", `Hired ${candidate.fullName} for "${posting.title}" — assigned ID ${nextEmployeeId}.`, {
          targetId: newEmployee._id as mongoose.Types.ObjectId,
          targetModel: "Employee",
        })
        .catch(err => console.error("Audit log failed:", err));

      notificationRepository
        .create({
          userId: newUser._id as mongoose.Types.ObjectId,
          type: "ONBOARDING_WELCOME",
          title: "Welcome to the team!",
          message: `Your account is active — Employee ID ${nextEmployeeId}. Your AI Onboarding Assistant is ready to help you get started.`,
        })
        .catch(err => console.error("Notification creation failed:", err));

      emailService
        .sendOnboardingWelcomeEmail(normalizedEmail, candidate.fullName, nextEmployeeId, posting.title, tempPassword)
        .catch(err => console.error("Onboarding email failed to dispatch:", err));

      return {
        employeeId: nextEmployeeId,
        fullName: candidate.fullName,
        email: normalizedEmail,
        tempPassword,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async getFunnelOverview() {
    await connectDB();
    const [openJobs, totalCandidates, funnel] = await Promise.all([
      jobPostingRepository.countByStatus("OPEN"),
      candidateRepository.count(),
      candidateRepository.funnelCounts(),
    ]);

    const funnelMap: Record<string, number> = {};
    for (const bucket of funnel as Array<{ _id: string; count: number }>) {
      funnelMap[bucket._id] = bucket.count;
    }

    return {
      openJobs,
      totalCandidates,
      shortlisted: funnelMap["SHORTLISTED"] || 0,
      interviewing: (funnelMap["INTERVIEWING"] || 0) + (funnelMap["INTERVIEWED"] || 0),
      hired: funnelMap["HIRED"] || 0,
      funnel: funnelMap,
    };
  }
}

export const hiringAgentService = new HiringAgentService();
