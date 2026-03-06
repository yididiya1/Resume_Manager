export const interviewQuestionsPrompt = `Generate targeted interview questions for a candidate based on their resume and a job description.

Return JSON only:
{
  "questions": [
    {
      "question": "...",
      "category": "behavioral" | "technical" | "situational" | "company",
      "competency": "...",
      "star_prompts": { "situation": "...", "task": "...", "action": "...", "result": "..." }
    }
  ]
}

Rules:
- Return 9-10 questions total, spread across all 4 categories.
- behavioral: asks about past behavior ("Tell me about a time..."). Competency = the skill being assessed (e.g. "Cross-functional collaboration").
- technical: tests specific skills, tools, or concepts from the JD and resume. Competency = the technical area.
- situational: "What would you do if..." scenario. Competency = the judgment being assessed.
- company: about the company, role, or industry ("Why this company / role / industry"). Competency = "Role fit" or similar.
- star_prompts: short 1-sentence coaching hint per STAR step to help the candidate structure their answer. Make them specific to the question, not generic.
- Tailor every question to the exact role — reference actual requirements, tools, or context from the JD.
- No generic filler questions.`
