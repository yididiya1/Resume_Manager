export const howDevPrompt = `Identify resume bullets that describe WHAT was done but not HOW.

Return JSON only:
{
  "bullets": [
    {"text": "...", "issue": "...", "questions": ["...", "..."]}
  ]
}

Rules:
- Only include bullets missing methodology, tools, decision rationale, or approach.
- Skip bullets that already explain their approach clearly.
- issue: 1 sentence describing what dimension is missing (e.g. "No tools or methods mentioned", "Vague action with no decision context").
- questions: 2–4 short questions to uncover HOW (e.g. "What tools or libraries did you use?", "How did you decide on this approach?", "What were the key trade-offs?"). Do NOT suggest rewrites.`
