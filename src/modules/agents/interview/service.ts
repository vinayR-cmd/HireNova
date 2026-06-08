import { randomBytes } from "crypto";
import { connectDB } from "@/lib/db";
import { interviewRepository } from "@/repositories/interview.repository";
import { candidateRepository } from "@/repositories/candidate.repository";
import { jobPostingRepository } from "@/repositories/job-posting.repository";
import { auditRepository } from "@/repositories/audit.repository";
import { chatJSON } from "@/modules/agents/shared/ai-client";
import {
  ADAPTIVE_QUESTION_SYSTEM_PROMPT,
  buildAdaptiveQuestionUserPrompt,
  ANSWER_SCORING_SYSTEM_PROMPT,
  buildAnswerScoringUserPrompt,
  REPORT_GENERATION_SYSTEM_PROMPT,
  buildReportGenerationUserPrompt,
} from "./prompts";
import type { IInterviewQuestion, IInterviewReport, HiringRecommendation } from "@/lib/models";
import mongoose from "mongoose";

// Total turns in a live adaptive interview. Kept modest so the demo flow stays
// tight, but long enough for the agent to genuinely range across categories,
// escalate/de-escalate difficulty, and land a closing behavioral question.
const TOTAL_QUESTIONS = 6;

interface GeneratedQuestion {
  question: string;
  category: IInterviewQuestion["category"];
  difficulty: IInterviewQuestion["difficulty"];
}

interface AnswerScoreResult {
  score: number;
  feedback: string;
}

interface ReportResult extends Omit<IInterviewReport, "recommendation"> {
  recommendation: HiringRecommendation;
}

function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

/**
 * Asks the Interview Agent to choose and craft exactly one next question,
 * grounded in the full transcript so far — this is the adaptive core that
 * replaces a fixed pre-written question bank with a live, reactive interviewer.
 */
async function generateAdaptiveQuestion(params: {
  candidate: { fullName: string; aiSummary?: string; parsedData?: { skills?: string[] } };
  posting: { title: string; department: string; designation: string; requiredSkills: string[]; description: string };
  questions: IInterviewQuestion[];
  questionNumber: number;
}): Promise<GeneratedQuestion> {
  return chatJSON<GeneratedQuestion>({
    system: ADAPTIVE_QUESTION_SYSTEM_PROMPT,
    user: buildAdaptiveQuestionUserPrompt({
      jobTitle: params.posting.title,
      department: params.posting.department,
      designation: params.posting.designation,
      requiredSkills: params.posting.requiredSkills,
      jobDescription: params.posting.description,
      candidateName: params.candidate.fullName,
      candidateSummary: params.candidate.aiSummary || "Not available",
      candidateSkills: params.candidate.parsedData?.skills || [],
      questionNumber: params.questionNumber,
      totalQuestions: TOTAL_QUESTIONS,
      transcript: params.questions.map(q => ({
        question: q.question,
        category: q.category,
        difficulty: q.difficulty,
        answer: q.answer || "",
        score: q.score,
        feedback: q.feedback,
      })),
    }),
    temperature: 0.6,
  });
}

export class InterviewAgentService {
  /**
   * Core flow: an admin requests an interview for a shortlisted candidate.
   * Unlike a fixed question bank, the agent crafts ONLY the opening question
   * up front — the rest of the conversation is generated turn-by-turn, live,
   * as the candidate answers (see submitAnswer), so the interview can
   * genuinely react to how they perform rather than following a script.
   */
  async startInterview(adminUserId: string, candidateId: string) {
    await connectDB();

    const candidate = await candidateRepository.findById(candidateId);
    if (!candidate) throw new Error("Candidate not found.");

    const existing = await interviewRepository.findByCandidateId(candidateId);
    if (existing) return existing;

    const posting = await jobPostingRepository.findById(candidate.jobPostingId.toString());
    if (!posting) throw new Error("Job posting not found.");

    const opener = await generateAdaptiveQuestion({ candidate, posting, questions: [], questionNumber: 1 });
    if (!opener?.question) {
      throw new Error("The Interview Agent could not generate an opening question for this candidate. Please try again.");
    }

    const interview = await interviewRepository.create({
      candidateId: new mongoose.Types.ObjectId(candidateId),
      jobPostingId: candidate.jobPostingId,
      token: generateToken(),
      status: "NOT_STARTED",
      questions: [{ question: opener.question, category: opener.category, difficulty: opener.difficulty }],
      currentIndex: 0,
    });

    await candidateRepository.update(candidateId, { status: "INTERVIEWING" });

    auditRepository
      .log(adminUserId, "INTERVIEW_SCHEDULED", `Generated adaptive AI interview for "${candidate.fullName}" (${posting.title}).`, {
        targetId: interview._id as mongoose.Types.ObjectId,
        targetModel: "Interview",
      })
      .catch(err => console.error("Audit log failed:", err));

    return interview;
  }

  async getInterview(id: string) {
    await connectDB();
    const interview = await interviewRepository.findByIdPopulated(id);
    if (!interview) throw new Error("Interview not found.");
    return interview;
  }

  async getByCandidateId(candidateId: string) {
    await connectDB();
    return interviewRepository.findByCandidateId(candidateId);
  }

  /**
   * Public, token-gated view used by the candidate-facing interview page.
   * Never exposes scores/feedback for unanswered questions.
   */
  async getPublicInterview(token: string) {
    await connectDB();
    const interview = await interviewRepository.findByToken(token);
    if (!interview) throw new Error("This interview link is invalid or has expired.");

    const [candidate, posting] = await Promise.all([
      candidateRepository.findById(interview.candidateId.toString()),
      jobPostingRepository.findById(interview.jobPostingId.toString()),
    ]);

    return {
      status: interview.status,
      currentIndex: interview.currentIndex,
      totalQuestions: TOTAL_QUESTIONS,
      currentQuestion:
        interview.status !== "COMPLETED" && interview.questions[interview.currentIndex]
          ? {
              question: interview.questions[interview.currentIndex].question,
              category: interview.questions[interview.currentIndex].category,
              difficulty: interview.questions[interview.currentIndex].difficulty,
            }
          : null,
      candidateName: candidate?.fullName || "Candidate",
      jobTitle: posting?.title || "the role",
      report: interview.status === "COMPLETED" ? interview.report : undefined,
    };
  }

  async beginInterview(token: string) {
    await connectDB();
    const interview = await interviewRepository.findByToken(token);
    if (!interview) throw new Error("This interview link is invalid or has expired.");
    if (interview.status === "COMPLETED") throw new Error("This interview has already been completed.");

    if (interview.status === "NOT_STARTED") {
      await interviewRepository.updateByToken(token, { status: "IN_PROGRESS", startedAt: new Date() });
    }
    return this.getPublicInterview(token);
  }

  /**
   * The heart of the adaptive interviewer. Each turn:
   *   1. Scores the candidate's answer to the current question in real time
   *   2. Either crafts the NEXT question live — grounded in the full
   *      transcript-so-far including that fresh score — or, once the
   *      question budget is spent, synthesizes the final report and
   *      completes the interview.
   *
   * Nothing about question N+1 exists until question N has been answered
   * and scored — this is what makes the interview a live conversation
   * rather than a form with a pre-printed list of questions.
   */
  async submitAnswer(token: string, answer: string) {
    await connectDB();

    const interview = await interviewRepository.findByToken(token);
    if (!interview) throw new Error("This interview link is invalid or has expired.");
    if (interview.status === "COMPLETED") throw new Error("This interview has already been completed.");
    if (interview.status === "NOT_STARTED") throw new Error("Please start the interview before answering.");

    const idx = interview.currentIndex;
    const current = interview.questions[idx];
    if (!current) throw new Error("No active question found for this interview.");

    const [posting, candidate] = await Promise.all([
      jobPostingRepository.findById(interview.jobPostingId.toString()),
      candidateRepository.findById(interview.candidateId.toString()),
    ]);
    if (!posting) throw new Error("Job posting not found.");
    if (!candidate) throw new Error("Candidate not found.");

    const scored = await chatJSON<AnswerScoreResult>({
      system: ANSWER_SCORING_SYSTEM_PROMPT,
      user: buildAnswerScoringUserPrompt({
        jobTitle: posting.title,
        question: current.question,
        category: current.category,
        difficulty: current.difficulty,
        answer,
      }),
    });

    const updatedQuestions = [...interview.questions];
    updatedQuestions[idx] = { ...current, answer, score: scored.score, feedback: scored.feedback };

    const isLast = updatedQuestions.length >= TOTAL_QUESTIONS;

    if (!isLast) {
      // Live-generate the next question, grounded in everything answered so far —
      // including the score that was just awarded for this very answer.
      const next = await generateAdaptiveQuestion({
        candidate,
        posting,
        questions: updatedQuestions,
        questionNumber: updatedQuestions.length + 1,
      });

      updatedQuestions.push({ question: next.question, category: next.category, difficulty: next.difficulty });

      await interviewRepository.updateByToken(token, {
        questions: updatedQuestions,
        currentIndex: idx + 1,
      });
      return this.getPublicInterview(token);
    }

    // Final question answered — synthesize the full report and complete the interview.
    const report = await chatJSON<ReportResult>({
      system: REPORT_GENERATION_SYSTEM_PROMPT,
      user: buildReportGenerationUserPrompt({
        jobTitle: posting.title,
        candidateName: candidate.fullName,
        transcript: updatedQuestions.map(q => ({
          question: q.question,
          category: q.category,
          difficulty: q.difficulty,
          answer: q.answer || "",
          score: q.score,
          feedback: q.feedback,
        })),
      }),
    });

    await interviewRepository.updateByToken(token, {
      questions: updatedQuestions,
      status: "COMPLETED",
      completedAt: new Date(),
      report,
    });

    await candidateRepository.update(interview.candidateId.toString(), { status: "INTERVIEWED" });

    return this.getPublicInterview(token);
  }
}

export const interviewAgentService = new InterviewAgentService();
