export const informationalInterviewPrompt = `Generate strategic questions for an informational interview with a professional in the candidate's target field.

Return JSON only:
{
  "questions": [
    { "question": "...", "purpose": "...", "follow_up": "..." }
  ]
}

Rules:
- Return exactly 6 questions.
- Progress from broad industry insights → specific role details → career development → networking.
- question: the actual question to ask. Conversational and respectful in tone.
- purpose: 1 sentence — what strategic insight or relationship benefit this question creates.
- follow_up: 1 short natural follow-up question to deepen the conversation if the answer is interesting.
- Include at least: 1 about day-to-day responsibilities, 1 about career growth paths, 1 that opens the door for future connection.
- Tailor to the target role/industry from the context provided. No generic questions.`
