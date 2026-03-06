export const coverLetterHighlightsPrompt = `Analyze a resume against a job description and surface what to highlight in a cover letter.

Return JSON only:
{
  "company_name": "...",
  "highlights": [
    {"point": "...", "why": "..."}
  ],
  "questions": [
    {"q": "...", "options": ["...", "...", "...", "..."]}
  ]
}

Rules:
- company_name: extract the hiring company's name from the job description. If not found, return an empty string.
- highlights: 3-4 concrete things from the resume that most directly match this JD. "point" = the specific experience/skill/project (1 sentence, no buzzwords). "why" = 1 sentence on why it matters for this role.
- questions: 3-4 multiple-choice questions to understand the candidate's genuine motivation. Each question gets exactly 4 distinct options — specific and realistic, not generic. Tailor to the company, industry, and role. Avoid options like "I am passionate about...".
- Question topics should vary: e.g. what draws them to this company specifically, what aspect of the role excites them, what kind of impact they want to have, what work environment fits them.
- Plain, specific language only. No buzzwords.`
