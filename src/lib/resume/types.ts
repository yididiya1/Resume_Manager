import { z } from 'zod'

function normalizeUrl(value: unknown) {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function normalizeHeaderLinkUrl(value: unknown) {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!trimmed) return undefined

  // Treat common link schemes as-is.
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) return trimmed

  // Only auto-prefix when it *looks* like a real domain.
  if (trimmed.includes('.')) return `https://${trimmed}`

  // Otherwise keep as plain text (e.g., phone number, location).
  return trimmed
}

const normalizedUrlSchema = z.preprocess(normalizeUrl, z.string().url())
const optionalNormalizedUrlSchema = z.preprocess(normalizeUrl, z.string().url().optional())
const headerLinkUrlSchema = z.preprocess(normalizeHeaderLinkUrl, z.string().optional())

export const dateRangeSchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
})

// For MVP we keep this flexible (Tiptap/ProseMirror JSON).
export const richTextDocSchema = z.any()

export const educationItemSchema = z.object({
  id: z.string(),
  degree: z.string(),
  school: z.string(),
  dates: dateRangeSchema,
  location: z.string().optional(),
  description: richTextDocSchema.optional(),
  link: optionalNormalizedUrlSchema,
})

export const workExperienceItemSchema = z.object({
  id: z.string(),
  jobTitle: z.string(),
  employer: z.string(),
  dates: dateRangeSchema,
  location: z.string().optional(),
  description: richTextDocSchema.optional(),
})

export const projectItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  dates: dateRangeSchema,
  description: richTextDocSchema.optional(),
})

export const skillItemSchema = z.object({
  id: z.string(),
  category: z.string(),
  details: richTextDocSchema.optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
})

export const certificateItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  details: richTextDocSchema.optional(),
  link: optionalNormalizedUrlSchema,
})

export const resumeLinkSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  url: headerLinkUrlSchema,
})

export const resumeHeaderSchema = z.object({
  fullName: z.string().default(''),
  links: z.array(resumeLinkSchema).default([]),
})

export const resumeSchema = z.object({
  header: resumeHeaderSchema.default({ fullName: '', links: [] }),
  summary: richTextDocSchema.optional(),
  education: z.array(educationItemSchema).default([]),
  workExperience: z.array(workExperienceItemSchema).default([]),
  projects: z.array(projectItemSchema).default([]),
  skills: z.array(skillItemSchema).default([]),
  certificates: z.array(certificateItemSchema).default([]),
})

export type ResumeData = z.infer<typeof resumeSchema>

export function emptyResumeData(): ResumeData {
  return {
    header: { fullName: '', links: [] },
    summary: undefined,
    education: [],
    workExperience: [],
    projects: [],
    skills: [],
    certificates: [],
  }
}
