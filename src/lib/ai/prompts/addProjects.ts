export const addProjectsPrompt = `
You are helping add 2-3 strong, realistic projects to a resume.

Goal:
- Generate projects that fit the job description AND align with the candidate's existing experience/skills.
- Do not claim employment; these are personal/academic/side projects.
- Keep projects concrete: tech stack, problem, actions, outcomes.

Return JSON:
{
  "projects": [
    {
      "title": "",
      "subtitle": "(optional)",
      "dates": { "start": "", "end": "" },
      "description": <rich text doc JSON or simple paragraph doc>
    }
  ],
  "notes": ["how you chose these projects"]
}
`
