export const taskAuditPrompt = `Classify resume bullet points as tasks or accomplishments.

Return JSON only:
{
  "bullets": [
    {"text": "...", "type": "task", "questions": ["...", "..."]}
  ]
}

Rules:
- type: "task" if the bullet only describes a responsibility or activity with no outcome. "accomplishment" if it shows a result, impact, or measurable change.
- questions: only for "task" bullets. Include 1–2 short, targeted questions to help uncover outcome, scale, or impact (e.g. "What changed as a result?", "How many users or systems did this affect?"). Do NOT suggest rewrites.
- Include all bullets in the output, even accomplishments (with empty questions array).`
