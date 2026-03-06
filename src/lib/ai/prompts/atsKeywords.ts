export const atsKeywordsPrompt = `Extract the top 20 ATS keywords from this job description.

Return JSON only:
{"keywords": ["...", "..."]}

Include: technical skills, tools, frameworks, methodologies, role-specific terms, industry terms.
Order by importance (most critical first). Exactly 20 keywords. No duplicates.`
