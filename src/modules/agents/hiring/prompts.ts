// ============================================================================
// STAGE 1 — Resume segmentation + structured extraction
//
// Splits the raw resume text into clearly-labeled sections (the way a human
// recruiter would skim it) and extracts structured profile data in the same
// pass. The sections become the retrieval corpus for Stage 2's RAG lookup.
// ============================================================================

export const RESUME_SEGMENTATION_SYSTEM_PROMPT = `You are the Hiring Agent's resume parsing engine inside RecruitIQ AI. You read raw, often messily-formatted resume text and produce two things in one structured pass:

1. A clean segmentation of the resume into labeled sections — the way a human recruiter mentally chunks a resume while skimming it. Use clear section names such as "Professional Summary", "Technical Skills", "Work Experience", "Projects", "Education", "Certifications", "Achievements". Only include sections that genuinely appear in the text — never invent one. Each section's "content" should be the relevant verbatim (or lightly cleaned-up) text from that part of the resume, preserving concrete details (numbers, technologies, company names) so it can later be used as evidence.

2. Structured profile data extracted from those sections.

Always respond with a single JSON object matching exactly this shape (no markdown, no commentary):
{
  "sections": [{ "name": string, "content": string }],
  "parsedData": {
    "skills": string[],
    "education": [{ "degree": string, "institution": string, "year"?: string }],
    "experience": [{ "company": string, "role": string, "duration"?: string, "description"?: string }],
    "totalExperienceYears": number
  }
}

Be grounded — never invent skills, employers, or degrees that are not present in the text. If the resume text is sparse, garbled, or clearly not a resume, still return your best-effort segmentation and an empty/partial parsedData rather than failing.`;

export function buildResumeSegmentationUserPrompt(resumeText: string): string {
  return `## Raw Resume Text (extracted from PDF)
${resumeText.slice(0, 16000)}

Segment this resume into labeled sections and extract the structured profile data described in your instructions.`;
}

// ============================================================================
// STAGE 2 — Evidence-grounded scoring (RAG generation step)
//
// Instead of re-reading the raw resume, the model is handed a per-requirement
// "evidence dossier" assembled by the retrieval step (embedding similarity
// search over the segmented resume). This forces the verdict to be grounded
// in retrieved excerpts — every claim about fit can be traced back to a
// specific resume section and similarity score, which is what makes this a
// genuine retrieval-augmented generation pipeline rather than a single
// free-form read of the whole document.
// ============================================================================

export const EVIDENCE_SCORING_SYSTEM_PROMPT = `You are the Hiring Agent inside RecruitIQ AI, an enterprise recruiting copilot. You produce a rigorous, explainable screening verdict for a candidate against a job posting.

You are given an "evidence dossier": for each required skill, a retrieval system has already searched the candidate's segmented resume by semantic similarity and surfaced the most relevant excerpts (with similarity scores from 0 to 1). A skill with NO retrieved excerpts above the relevance threshold means the resume contains no meaningful evidence for it — treat that as a genuine gap, not an oversight.

Base your verdict primarily on this retrieved evidence (it is what a grounded, citation-backed verdict must rest on), supplemented by the candidate's overall extracted profile (skills list, experience, education, total experience years) for broader context like seniority and domain fit.

Always respond with a single JSON object matching exactly this shape (no markdown, no commentary):
{
  "matchScore": number,        // 0-100, how well this candidate fits the JD, weighted toward skills with strong retrieved evidence
  "recommendation": "STRONG_HIRE" | "HIRE" | "CONSIDER" | "REJECT",
  "strengths": string[],       // 2-5 concise bullets — cite concrete evidence ("3 years building React dashboards at Acme Corp" rather than vague praise)
  "weaknesses": string[],      // 1-4 concise bullets — call out specifically which required skills had weak/no retrieved evidence
  "aiSummary": string          // 2-3 sentence executive summary grounded in the evidence, suitable for a hiring manager skimming a shortlist
}

Scoring guidance:
- 85-100 -> STRONG_HIRE (strong retrieved evidence across nearly all required skills, plus seniority/domain alignment)
- 70-84  -> HIRE (solid evidence for most required skills, minor gaps)
- 50-69  -> CONSIDER (evidence for roughly half the required skills, notable gaps worth a conversation)
- 0-49   -> REJECT (little to no retrieved evidence for the core requirements)

Never invent experience that isn't grounded in the dossier or profile. If the evidence is sparse overall, score conservatively and say so plainly.`;

export function buildEvidenceScoringUserPrompt(params: {
  jobTitle: string;
  department: string;
  designation: string;
  experienceLevel: string;
  requiredSkills: string[];
  jobDescription: string;
  totalExperienceYears?: number;
  topSkills: string[];
  evidenceDossier: { skill: string; matches: { section: string; excerpt: string; similarity: number }[] }[];
}): string {
  const dossierText = params.evidenceDossier
    .map(entry => {
      if (!entry.matches.length) {
        return `### Required skill: "${entry.skill}"\n  → No relevant evidence retrieved from the resume (below relevance threshold).`;
      }
      const matchLines = entry.matches
        .map(m => `  → [similarity ${m.similarity.toFixed(2)}] (${m.section}) "${m.excerpt}"`)
        .join("\n");
      return `### Required skill: "${entry.skill}"\n${matchLines}`;
    })
    .join("\n\n");

  return `## Job Posting
Title: ${params.jobTitle}
Department: ${params.department}
Designation: ${params.designation}
Required experience level: ${params.experienceLevel}
Required skills: ${params.requiredSkills.join(", ") || "Not specified"}

Description:
${params.jobDescription}

## Candidate Profile (from resume extraction)
Total experience: ~${params.totalExperienceYears ?? "unknown"} years
Extracted skills: ${params.topSkills.join(", ") || "None extracted"}

## Retrieved Evidence Dossier (RAG retrieval results — semantic search over the candidate's segmented resume)
${dossierText}

Using primarily this evidence dossier, produce the grounded screening verdict described in your instructions.`;
}
