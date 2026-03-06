export const coverLetterDraftPrompt = `Write a professional cover letter from structured inputs.

Return JSON only:
{"cover_letter": "..."}

The letter must:
- Be under 400 words
- Have 4 paragraphs:
  1. Specific opening hook tied to the company or role (not "I am applying for...")
  2. Key qualification + concrete example that matches the JD
  3. Second qualification or project + how it connects to company's needs, weave in motivation where relevant
  4. Confident close with a clear next-step ask
- Avoid all buzzwords: no "leveraged", "spearheaded", "passionate", "results-driven", "dynamic", "synergy"
- Match professional but natural tone — read like a person, not a template
- Use specific details from the highlights; do not invent experience not mentioned`
