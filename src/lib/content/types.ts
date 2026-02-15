import { z } from 'zod'

function normalizeUrl(value: unknown) {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

const normalizedUrlSchema = z.preprocess(normalizeUrl, z.string().url())

export const dateRangeSchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
})

// Flexible (Tiptap/ProseMirror JSON).
export const richTextDocSchema = z.any()

export const contentKindSchema = z.enum([
  'education',
  'workExperience',
  'projects',
  'skills',
  'certificates',
  'custom',
])

export type ContentKind = z.infer<typeof contentKindSchema>

export const educationContentSchema = z.object({
  degree: z.string().default(''),
  school: z.string().default(''),
  dates: dateRangeSchema.default({}),
  location: z.string().optional().default(''),
  description: richTextDocSchema.optional(),
  link: normalizedUrlSchema.optional(),
})

export const workExperienceContentSchema = z.object({
  jobTitle: z.string().default(''),
  employer: z.string().default(''),
  dates: dateRangeSchema.default({}),
  location: z.string().optional().default(''),
  description: richTextDocSchema.optional(),
})

export const projectContentSchema = z.object({
  title: z.string().default(''),
  subtitle: z.string().optional().default(''),
  dates: dateRangeSchema.default({}),
  description: richTextDocSchema.optional(),
})

export const skillContentSchema = z.object({
  category: z.string().default(''),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  details: richTextDocSchema.optional(),
})

export const certificateContentSchema = z.object({
  title: z.string().default(''),
  link: normalizedUrlSchema.optional(),
  details: richTextDocSchema.optional(),
})

export const customContentSchema = z.object({
  title: z.string().default(''),
  body: richTextDocSchema.optional(),
})

export const contentItemDataSchema = z.union([
  educationContentSchema,
  workExperienceContentSchema,
  projectContentSchema,
  skillContentSchema,
  certificateContentSchema,
  customContentSchema,
])

export type ContentItemData = z.infer<typeof contentItemDataSchema>

export type ContentItemRow = {
  id: string
  kind: ContentKind
  item_data: unknown
  created_at?: string
  updated_at?: string
}

export function emptyContentData(kind: ContentKind): ContentItemData {
  switch (kind) {
    case 'education':
      return educationContentSchema.parse({})
    case 'workExperience':
      return workExperienceContentSchema.parse({})
    case 'projects':
      return projectContentSchema.parse({})
    case 'skills':
      return skillContentSchema.parse({})
    case 'certificates':
      return certificateContentSchema.parse({})
    case 'custom':
      return customContentSchema.parse({})
  }
}

export function contentKindLabel(kind: ContentKind) {
  switch (kind) {
    case 'education':
      return 'Education'
    case 'workExperience':
      return 'Work experience'
    case 'projects':
      return 'Projects'
    case 'skills':
      return 'Skills'
    case 'certificates':
      return 'Certifications'
    case 'custom':
      return 'Custom'
  }
}

export function contentDisplayTitle(kind: ContentKind, data: unknown) {
  if (kind === 'education') {
    const parsed = educationContentSchema.safeParse(data)
    if (!parsed.success) return 'Education item'
    return [parsed.data.degree, parsed.data.school].filter(Boolean).join(' — ') || 'Education item'
  }
  if (kind === 'workExperience') {
    const parsed = workExperienceContentSchema.safeParse(data)
    if (!parsed.success) return 'Work experience item'
    return [parsed.data.jobTitle, parsed.data.employer].filter(Boolean).join(' — ') || 'Work experience item'
  }
  if (kind === 'projects') {
    const parsed = projectContentSchema.safeParse(data)
    if (!parsed.success) return 'Project'
    return parsed.data.title || 'Project'
  }
  if (kind === 'skills') {
    const parsed = skillContentSchema.safeParse(data)
    if (!parsed.success) return 'Skill'
    return parsed.data.category || 'Skill'
  }
  if (kind === 'certificates') {
    const parsed = certificateContentSchema.safeParse(data)
    if (!parsed.success) return 'Certification'
    return parsed.data.title || 'Certification'
  }
  const parsed = customContentSchema.safeParse(data)
  if (!parsed.success) return 'Custom item'
  return parsed.data.title || 'Custom item'
}
