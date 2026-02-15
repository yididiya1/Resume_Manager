export type ResumeTemplateMeta = {
  id: string
  title: string
  description: string
}

export const RESUME_TEMPLATES: ResumeTemplateMeta[] = [
  {
    id: 'template-analytics',
    title: 'Analytics / Data Science',
    description: 'Great for data science, analytics, and ML roles with project bullets and skills categories.',
  },
  {
    id: 'template-software',
    title: 'Software Engineer',
    description: 'Classic engineering resume with experience-first sections and impact-focused bullets.',
  },
  {
    id: 'template-general',
    title: 'General Professional',
    description: 'Clean, flexible template you can adapt to most roles quickly.',
  },
]
