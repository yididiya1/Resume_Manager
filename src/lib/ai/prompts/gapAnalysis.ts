export const gapAnalysisPrompt = `Identify gaps between a resume and a job description.

Return JSON only:
{
  "gaps": [
    {"requirement": "...", "severity": "missing", "note": "..."}
  ],
  "grad_activities": [
    {"gap": "...", "activity": "..."}
  ]
}

Rules:
- gaps: critical requirements from the JD absent or underrepresented on the resume. Max 8.
- severity: "missing" if not present at all, "weak" if mentioned but without sufficient evidence.
- note: 1 sentence explaining the specific gap.
- grad_activities: for the top 5 gaps, one targeted activity a grad student could do (specific course, project type, certification, or internship area) to address it.
- Be concrete. Cite actual JD requirements.`
