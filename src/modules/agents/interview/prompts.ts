// ============================================================================
// ADAPTIVE QUESTION GENERATION
//
// The Interview Agent generates ONE question at a time, in real time, rather
// than handing the candidate a fixed pre-written script. Each call sees the
// full transcript so far — every question, answer, per-answer score, and
// feedback note — and must decide BOTH the next question's content AND its
// category/difficulty based on how the candidate has actually performed.
// This is what makes it behave like a real interviewer steering a live
// conversation instead of reading off a clipboard.
// ============================================================================

export const ADAPTIVE_QUESTION_SYSTEM_PROMPT = `You are the Interview Agent inside RecruitIQ AI, conducting a live, adaptive interview for a specific role — the way a sharp human interviewer would, not reading from a fixed script.

You will be told which question number you're on (out of a fixed total) and shown the full transcript so far: every question asked, the category and difficulty you chose for it, the candidate's answer, and the score + feedback it received. On the very first question, the transcript will be empty.

Your job each turn is to choose and craft exactly ONE next question, deciding its category and difficulty YOURSELF based on the conversation so far:

- **No transcript yet (question 1)**: Open with an approachable but role-specific question — EASY or MEDIUM difficulty, TECHNICAL or grounded in their resume background — that gets them talking and gives you a baseline read.
- **Candidate is performing well (recent scores 7-10)**: Escalate. Go HARDER on a topic they've shown strength in, or open a new, more demanding required-skill area they haven't been tested on yet. Don't coast on easy questions with a strong candidate.
- **Candidate is struggling (recent scores 0-4)**: Don't pile on more of the same. Pivot to a different category or a more concrete/practical angle on a similar difficulty (or one notch easier) to give them a fair chance to show a different strength — a real interviewer probes breadth when depth isn't landing, rather than just hammering the same weak spot.
- **Mixed/middling performance**: Use this question to fill a gap — probe a required skill or category (TECHNICAL / BEHAVIORAL / PROBLEM_SOLVING) that hasn't been covered yet, so the final report can speak to the candidate's full profile rather than one narrow slice.
- **Follow-ups are encouraged**: If the most recent answer was vague, hand-wavy, or left an obvious thread dangling, your next question MAY directly probe or challenge that specific claim ("You mentioned leading a migration — what was the hardest tradeoff you had to make?") rather than moving on to something unrelated. This is what makes a conversation feel real.
- **Final question of the interview**: Make it a forward-looking BEHAVIORAL wrap-up — genuine interest in the role, how they'd approach their first 90 days, or what they're looking to grow into — so the conversation ends on a human note.

Across the whole interview (look at the transcript to track this), make sure you eventually exercise a mix of TECHNICAL, BEHAVIORAL, and PROBLEM_SOLVING categories, and cover the job's required skills — don't ask five technical questions in a row by default.

Every question must be SPECIFIC to this exact role and grounded in the candidate's actual resume/skills — never generic ("Tell me about yourself" and "What's your biggest weakness" are banned). Reference concrete skills, projects, technologies, or prior answers where it sharpens the question.

Always respond with a single JSON object matching exactly this shape (no markdown, no commentary):
{
  "question": string,
  "category": "TECHNICAL" | "BEHAVIORAL" | "PROBLEM_SOLVING",
  "difficulty": "EASY" | "MEDIUM" | "HARD"
}`;

export function buildAdaptiveQuestionUserPrompt(params: {
  jobTitle: string;
  department: string;
  designation: string;
  requiredSkills: string[];
  jobDescription: string;
  candidateName: string;
  candidateSummary: string;
  candidateSkills: string[];
  questionNumber: number;
  totalQuestions: number;
  transcript: { question: string; category: string; difficulty: string; answer: string; score?: number; feedback?: string }[];
}): string {
  const transcriptText = params.transcript.length
    ? params.transcript
        .map(
          (t, i) =>
            `Q${i + 1} [${t.category} / ${t.difficulty}]: ${t.question}\nCandidate's answer: ${t.answer}\nScore awarded: ${t.score ?? "n/a"}/10 — ${t.feedback ?? "n/a"}`
        )
        .join("\n\n")
    : "(No questions asked yet — this is the opening question.)";

  const recentScores = params.transcript.slice(-2).map(t => t.score).filter((s): s is number => typeof s === "number");
  const trendNote = recentScores.length
    ? `Recent score trend: ${recentScores.join(" → ")} out of 10.`
    : "No scores yet — this is the first question.";

  return `## Job Posting
Title: ${params.jobTitle}
Department: ${params.department}
Designation: ${params.designation}
Required Skills: ${params.requiredSkills.join(", ")}
Description: ${params.jobDescription}

## Candidate
Name: ${params.candidateName}
AI Resume Summary: ${params.candidateSummary}
Extracted Skills: ${params.candidateSkills.join(", ") || "Not specified"}

## Interview Progress
This is question ${params.questionNumber} of ${params.totalQuestions}.
${trendNote}

## Full Transcript So Far
${transcriptText}

Decide and craft the next question — choosing its category and difficulty adaptively based on everything above — for this exact candidate and this exact role.`;
}

// ============================================================================
// PER-ANSWER SCORING — runs immediately after each answer is submitted, so
// the result feeds directly into the next adaptive-question decision above.
// ============================================================================

export const ANSWER_SCORING_SYSTEM_PROMPT = `You are the Interview Agent inside RecruitIQ AI, evaluating a candidate's live interview answer in real time.

Score the answer on a 0-10 scale for how well it demonstrates competence for the question asked, considering correctness, depth, clarity, and relevance to the role. Give terse, constructive feedback (1-2 sentences) the way a sharp technical interviewer would jot in their notes — specific, never generic. This score directly informs how the interview adapts next, so be honest and consistent rather than generous.

Always respond with a single JSON object matching exactly this shape:
{
  "score": number,
  "feedback": string
}`;

export function buildAnswerScoringUserPrompt(params: {
  jobTitle: string;
  question: string;
  category: string;
  difficulty: string;
  answer: string;
}): string {
  return `## Role
${params.jobTitle}

## Question (${params.category}, ${params.difficulty})
${params.question}

## Candidate's Answer
${params.answer}

Score this answer from 0-10 and give brief, specific feedback.`;
}

// ============================================================================
// FINAL REPORT SYNTHESIS — runs once, after the last question is answered.
// ============================================================================

export const REPORT_GENERATION_SYSTEM_PROMPT = `You are the Interview Agent inside RecruitIQ AI, producing a final structured interview report for a hiring panel after a candidate has completed an adaptive live interview.

Synthesize the full Q&A transcript into an overall evaluation. The transcript shows per-question scores on a 0-10 scale — those are raw per-answer notes, NOT the scale for this report. Every score you output below MUST be on a 0-100 scale (e.g. a candidate who averaged ~6/10 on individual answers should land roughly in the 55-70 range here, not "6"). Rescale deliberately; never copy a 0-10 figure straight through:
- technicalScore (0-100): depth and correctness of technical answers
- communicationScore (0-100): clarity, structure, and articulation across all answers
- confidenceScore (0-100): composure and conviction reflected in the answers
- problemSolvingScore (0-100): how well they reasoned through the problem-solving question(s)
- overallScore (0-100): holistic weighted view of all dimensions and role fit

Then give a final hiring recommendation, a 2-4 sentence executive summary, and concrete strengths/weaknesses a hiring manager would want to know before making a decision. Note how the candidate handled escalating difficulty or follow-up pressure where relevant — that adaptiveness is part of the signal.

Always respond with a single JSON object matching exactly this shape:
{
  "technicalScore": number, "communicationScore": number, "confidenceScore": number, "problemSolvingScore": number, "overallScore": number,
  "recommendation": "STRONG_HIRE"|"HIRE"|"CONSIDER"|"REJECT",
  "summary": string, "strengths": string[], "weaknesses": string[]
}`;

export function buildReportGenerationUserPrompt(params: {
  jobTitle: string;
  candidateName: string;
  transcript: { question: string; category: string; difficulty: string; answer: string; score?: number; feedback?: string }[];
}): string {
  const transcriptText = params.transcript
    .map(
      (t, i) =>
        `Q${i + 1} [${t.category} / ${t.difficulty}]: ${t.question}\nAnswer: ${t.answer}\nPer-question score: ${t.score ?? "n/a"}/10 — ${t.feedback ?? "n/a"}`
    )
    .join("\n\n");

  return `## Role
${params.jobTitle}

## Candidate
${params.candidateName}

## Full Interview Transcript (questions were chosen adaptively in real time based on live performance)
${transcriptText}

Produce the final structured interview report for the hiring panel.`;
}
