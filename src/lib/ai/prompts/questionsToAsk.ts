export const questionsToAskPrompt = `Generate thoughtful questions a candidate should ask their interviewers, based on the job description.

Return JSON only:
{
  "categories": [
    {
      "label": "...",
      "questions": [
        { "question": "...", "purpose": "..." }
      ]
    }
  ]
}

Rules:
- Return exactly 4 categories in this order: "Role & technical work", "Team & culture", "Growth & development", "Company strategy & vision".
- 3 questions per category (12 total).
- question: the exact question the candidate should ask. Specific to this role/company, not generic.
- purpose: 1 short sentence (10-15 words) on what insight this question reveals.
- Avoid questions that could be answered by reading the JD. Show genuine curiosity and research.`
