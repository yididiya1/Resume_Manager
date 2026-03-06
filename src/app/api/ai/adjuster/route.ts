import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { resumeSchema } from '@/lib/resume/types'
import { adjustResumePrompt } from '@/lib/ai/prompts/adjustResume'
import { optimizeResumePrompt } from '@/lib/ai/prompts/optimizeResume'
import { addProjectsPrompt } from '@/lib/ai/prompts/addProjects'
import { coverLetterPrompt } from '@/lib/ai/prompts/coverLetter'
import { jobFitPrompt } from '@/lib/ai/prompts/jobFit'
import { alignmentAnalysisPrompt } from '@/lib/ai/prompts/alignmentAnalysis'
import { atsAuditPrompt } from '@/lib/ai/prompts/atsAudit'
import { atsKeywordsPrompt } from '@/lib/ai/prompts/atsKeywords'
import { taskAuditPrompt } from '@/lib/ai/prompts/taskAudit'
import { gapAnalysisPrompt } from '@/lib/ai/prompts/gapAnalysis'
import { howDevPrompt } from '@/lib/ai/prompts/howDev'
import { coverLetterHighlightsPrompt } from '@/lib/ai/prompts/coverLetterHighlights'
import { coverLetterDraftPrompt } from '@/lib/ai/prompts/coverLetterDraft'
import { interviewQuestionsPrompt } from '@/lib/ai/prompts/interviewQuestions'
import { questionsToAskPrompt } from '@/lib/ai/prompts/questionsToAsk'
import { informationalInterviewPrompt } from '@/lib/ai/prompts/informationalInterview'

const actionSchema = z.enum([
  'adjust', 'optimize', 'addProjects', 'coverLetter', 'fit',
  'alignment', 'atsAudit', 'atsKeywords', 'taskAudit', 'gapAnalysis', 'howDev',
  'clHighlights', 'clDraft',
  'interviewQuestions', 'questionsToAsk', 'informationalInterview',
])

const requestSchema = z.object({
  action: actionSchema,
  jobDescription: z.string().optional().default(''),
  resume_data: z.unknown().optional(),
  extra: z.unknown().optional(),
})

// Partial-output schemas — AI returns only editable sections, server merges with frozen data
const adjustResponseSchema = z.object({
  workExperience: z.array(z.any()),
  projects: z.array(z.any()),
  warnings: z.array(z.string()).optional().default([]),
})

const optimizeResponseSchema = z.object({
  workExperience: z.array(z.any()),
  projects: z.array(z.any()),
})

const addProjectsResponseSchema = z.object({
  projects: z.array(z.any()),
})

const coverLetterResponseSchema = z.object({
  cover_letter: z.string().default(''),
})

const fitExtractionSchema = z.object({
  role_min_years: z.number().nullable().optional().default(null),
  must_haves: z
    .array(
      z.object({
        label: z.string().default(''),
        aliases: z.array(z.string()).optional().default([]),
        jd_evidence: z.array(z.string()).optional().default([]),
      }),
    )
    .optional()
    .default([]),
  nice_to_haves: z
    .array(
      z.object({
        label: z.string().default(''),
        aliases: z.array(z.string()).optional().default([]),
        jd_evidence: z.array(z.string()).optional().default([]),
      }),
    )
    .optional()
    .default([]),
})

type FitRequirement = z.infer<typeof fitExtractionSchema>['must_haves'][number]

type FitRequirementStatus = 'have' | 'weak' | 'missing'

type FitEvidence = {
  section: 'summary' | 'skills' | 'work' | 'projects' | 'education' | 'certificates'
  text: string
  similarity: number
}

type FitRequirementResult = {
  label: string
  status: FitRequirementStatus
  score: number
  jd_evidence: string[]
  evidence: FitEvidence[]
}

type FitResponse = {
  overall_percent: number
  must_percent: number
  nice_percent: number
  seniority: {
    role_min_years: number | null
    estimated_years: number | null
    penalty_percent: number
    note: string
  }
  must_haves: FitRequirementResult[]
  nice_to_haves: FitRequirementResult[]
  suggestions: string[]
}

function clamp01(value: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length)
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < len; i += 1) {
    const av = a[i] ?? 0
    const bv = b[i] ?? 0
    dot += av * bv
    na += av * av
    nb += bv * bv
  }
  if (!na || !nb) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

function normText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+.#/\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function shortText(value: string, maxLen: number): string {
  const trimmed = value.replace(/\s+/g, ' ').trim()
  if (trimmed.length <= maxLen) return trimmed
  return `${trimmed.slice(0, Math.max(0, maxLen - 1)).trim()}…`
}

function richTextToPlainText(doc: unknown): string {
  const root = doc as { type?: string; content?: unknown[] } | null
  if (!root || root.type !== 'doc') return ''

  const parts: string[] = []
  const walk = (node: unknown) => {
    const n = node as { text?: unknown; content?: unknown[] } | null
    if (!n) return
    if (typeof n.text === 'string') parts.push(n.text)
    const c = Array.isArray(n.content) ? n.content : []
    for (const child of c) walk(child)
  }

  for (const node of root.content ?? []) walk(node)
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

function resumeSnippets(resumeJson: string, resumeData: z.infer<typeof resumeSchema>): Array<{ section: FitEvidence['section']; text: string }> {
  const snippets: Array<{ section: FitEvidence['section']; text: string }> = []

  // Summary
  if (resumeData.summary) {
    const txt = richTextToPlainText(resumeData.summary)
    if (txt) snippets.push({ section: 'summary', text: txt })
  }

  // Skills
  for (const s of resumeData.skills ?? []) {
    const txt = richTextToPlainText(s.details)
    const line = [s.category, txt].filter(Boolean).join(': ')
    if (line.trim()) snippets.push({ section: 'skills', text: line })
  }

  // Work
  for (const w of resumeData.workExperience ?? []) {
    const base = [w.jobTitle, w.employer].filter(Boolean).join(' — ')
    const desc = richTextToPlainText(w.description)
    if (desc) {
      snippets.push({ section: 'work', text: `${base}: ${desc}` })
    } else if (base) {
      snippets.push({ section: 'work', text: base })
    }
  }

  // Projects
  for (const p of resumeData.projects ?? []) {
    const base = [p.title, p.subtitle].filter(Boolean).join(' — ')
    const desc = richTextToPlainText(p.description)
    if (desc) {
      snippets.push({ section: 'projects', text: `${base}: ${desc}` })
    } else if (base) {
      snippets.push({ section: 'projects', text: base })
    }
  }

  // Education
  for (const e of resumeData.education ?? []) {
    const base = [e.degree, e.school].filter(Boolean).join(' — ')
    const desc = richTextToPlainText(e.description)
    if (desc) {
      snippets.push({ section: 'education', text: `${base}: ${desc}` })
    } else if (base) {
      snippets.push({ section: 'education', text: base })
    }
  }

  // Certificates
  for (const c of resumeData.certificates ?? []) {
    const base = c.title?.trim() ?? ''
    const desc = richTextToPlainText(c.details)
    if (desc) snippets.push({ section: 'certificates', text: `${base}: ${desc}` })
    else if (base) snippets.push({ section: 'certificates', text: base })
  }

  // Light cap to control cost.
  const dedup = new Map<string, { section: FitEvidence['section']; text: string }>()
  for (const s of snippets) {
    const key = `${s.section}:${normText(s.text)}`
    if (!dedup.has(key)) dedup.set(key, { section: s.section, text: shortText(s.text, 320) })
  }

  const out = Array.from(dedup.values())
  // If resume is huge, trim while keeping some variety by section.
  if (out.length <= 60) return out

  const sectionOrder: FitEvidence['section'][] = ['skills', 'work', 'projects', 'summary', 'education', 'certificates']
  const buckets = new Map<FitEvidence['section'], Array<{ section: FitEvidence['section']; text: string }>>()
  for (const s of out) buckets.set(s.section, [...(buckets.get(s.section) ?? []), s])

  const limited: Array<{ section: FitEvidence['section']; text: string }> = []
  while (limited.length < 60) {
    let pushed = false
    for (const sec of sectionOrder) {
      const arr = buckets.get(sec) ?? []
      if (!arr.length) continue
      limited.push(arr.shift()!)
      buckets.set(sec, arr)
      pushed = true
      if (limited.length >= 60) break
    }
    if (!pushed) break
  }
  return limited
}

function parseYear(value: string | undefined): number | null {
  const v = (value ?? '').trim()
  if (!v) return null
  if (/present/i.test(v)) return new Date().getFullYear()
  const m = v.match(/(19|20)\d{2}/)
  if (!m) return null
  const y = Number(m[0])
  return Number.isFinite(y) ? y : null
}

function estimateExperienceYears(resumeData: z.infer<typeof resumeSchema>): number | null {
  const starts: number[] = []
  const ends: number[] = []
  for (const w of resumeData.workExperience ?? []) {
    const sy = parseYear(w.dates?.start)
    const ey = parseYear(w.dates?.end)
    if (sy) starts.push(sy)
    if (ey) ends.push(ey)
  }
  if (!starts.length) return null
  const start = Math.min(...starts)
  const end = ends.length ? Math.max(...ends) : new Date().getFullYear()
  const years = Math.max(0, end - start)
  return years
}

// Converts resume to compact plain text for analysis actions (much fewer tokens than full JSON)
function resumeToAnalysisText(resumeData: z.infer<typeof resumeSchema>): string {
  const lines: string[] = []

  if (resumeData.header?.fullName) lines.push(`Name: ${resumeData.header.fullName}`)

  if (resumeData.summary) {
    const txt = richTextToPlainText(resumeData.summary)
    if (txt) lines.push(`\nSUMMARY\n${txt}`)
  }

  if (resumeData.skills?.length) {
    lines.push('\nSKILLS')
    for (const s of resumeData.skills) {
      const d = richTextToPlainText(s.details)
      const line = [s.category, d].filter(Boolean).join(': ')
      if (line) lines.push(line)
    }
  }

  if (resumeData.workExperience?.length) {
    lines.push('\nWORK EXPERIENCE')
    for (const w of resumeData.workExperience) {
      const header = [w.jobTitle, w.employer, w.dates?.start ? `(${w.dates.start}–${w.dates.end ?? 'Present'})` : ''].filter(Boolean).join(' | ')
      if (header) lines.push(header)
      const desc = richTextToPlainText(w.description)
      if (desc) lines.push(desc)
    }
  }

  if (resumeData.projects?.length) {
    lines.push('\nPROJECTS')
    for (const p of resumeData.projects) {
      if (p.title) lines.push(p.title)
      const desc = richTextToPlainText(p.description)
      if (desc) lines.push(desc)
    }
  }

  if (resumeData.education?.length) {
    lines.push('\nEDUCATION')
    for (const e of resumeData.education) {
      const line = [e.degree, e.school].filter(Boolean).join(', ')
      if (line) lines.push(line)
    }
  }

  if (resumeData.certificates?.length) {
    lines.push('\nCERTIFICATES')
    for (const c of resumeData.certificates) {
      if (c.title) lines.push(c.title)
    }
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

function flatNodeText(node: unknown): string {
  const n = node as { text?: unknown; content?: unknown[] } | null
  if (!n) return ''
  if (typeof n.text === 'string') return n.text
  return ((n.content ?? []) as unknown[]).map(flatNodeText).join('')
}

// Extracts bullet points from a ProseMirror document
function extractBullets(doc: unknown): string[] {
  const root = doc as { type?: string; content?: unknown[] } | null
  if (!root || root.type !== 'doc') return []
  const bullets: string[] = []
  const walk = (node: unknown) => {
    const n = node as { type?: string; content?: unknown[] } | null
    if (!n) return
    if (n.type === 'listItem') {
      const txt = flatNodeText(n).replace(/\s+/g, ' ').trim()
      if (txt) bullets.push(txt)
      return
    }
    for (const child of (n.content ?? [])) walk(child)
  }
  walk(root)
  return bullets
}

function resumeToBulletsText(resumeData: z.infer<typeof resumeSchema>): string {
  const lines: string[] = []
  for (const w of resumeData.workExperience ?? []) {
    const label = [w.jobTitle, w.employer].filter(Boolean).join(' @ ')
    const bullets = extractBullets(w.description)
    if (bullets.length) {
      lines.push(`[${label}]`)
      lines.push(...bullets.map((b) => `- ${b}`))
    }
  }
  for (const p of resumeData.projects ?? []) {
    const bullets = extractBullets(p.description)
    if (bullets.length) {
      lines.push(`[${p.title ?? 'Project'}]`)
      lines.push(...bullets.map((b) => `- ${b}`))
    }
  }
  return lines.join('\n')
}

async function callOpenAIEmbeddings({ inputs }: { inputs: string[] }) {
  const apiKey = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, input: inputs }),
  })

  const raw = (await res.json().catch(() => null)) as unknown
  const data = raw as { data?: Array<{ embedding?: number[] }> ; error?: { message?: string } }
  if (!res.ok) {
    throw new Error(data?.error?.message || 'OpenAI embeddings request failed')
  }
  const embeddings = (data.data ?? []).map((d) => d.embedding ?? [])
  if (embeddings.length !== inputs.length) {
    throw new Error('OpenAI embeddings returned unexpected result length')
  }
  return embeddings
}

async function callOpenAIJson({ system, user }: { system: string; user: string }) {
  const apiKey = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  // Some OpenAI models (notably certain reasoning models) only support the default
  // sampling parameters and will error if `temperature` is provided.
  const supportsTemperature = (() => {
    const m = model.toLowerCase()
    if (m.startsWith('gpt-5')) return false
    if (m.startsWith('o1') || m.startsWith('o3')) return false
    if (m.includes('reasoning')) return false
    return true
  })()

  const buildBody = (withTemperature: boolean) =>
    JSON.stringify({
      model,
      ...(withTemperature ? { temperature: 0.4 } : {}),
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    })

  async function doRequest(withTemperature: boolean) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: buildBody(withTemperature),
    })

    const raw = (await res.json().catch(() => null)) as any
    return { res, raw }
  }

  const first = await doRequest(supportsTemperature)
  let res = first.res
  let raw = first.raw

  if (!res.ok) {
    const msg = raw?.error?.message || 'OpenAI request failed'
    const temperatureRejected = typeof msg === 'string' && msg.toLowerCase().includes("unsupported value: 'temperature'")
    if (supportsTemperature && temperatureRejected) {
      const retry = await doRequest(false)
      res = retry.res
      raw = retry.raw
    }
  }

  if (!res.ok) {
    const msg = raw?.error?.message || 'OpenAI request failed'
    throw new Error(msg)
  }

  const content = raw?.choices?.[0]?.message?.content
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('OpenAI returned empty response')
  }

  try {
    return JSON.parse(content)
  } catch {
    throw new Error('OpenAI returned non-JSON content')
  }
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as unknown
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { action, jobDescription, resume_data, extra } = parsed.data

  const resumeParsed = resume_data != null ? resumeSchema.safeParse(resume_data) : null
  if (resumeParsed && !resumeParsed.success) {
    return NextResponse.json({ error: 'Invalid resume_data' }, { status: 400 })
  }

  const resumeJson = resumeParsed ? JSON.stringify(resumeParsed.data) : '{}'
  const jd = (jobDescription || '').trim()

  // Slim payload helpers — only send editable sections to reduce tokens ~50%
  function editPayload() {
    if (!resumeParsed?.success) return '{}'
    const d = resumeParsed.data
    return JSON.stringify({ workExperience: d.workExperience, projects: d.projects })
  }
  function addProjectsPayload() {
    if (!resumeParsed?.success) return '{}'
    const d = resumeParsed.data
    return JSON.stringify({
      projects: d.projects,
      skills: d.skills,
      work_context: d.workExperience.map(({ id, jobTitle, employer, dates }) => ({ id, jobTitle, employer, dates })),
    })
  }
  // Merge AI-returned partial arrays back onto original by id (prevents AI from dropping frozen fields)
  function mergeByDescription<T extends { id: string; description?: unknown }>(originals: T[], aiItems: T[]): T[] {
    return originals.map(orig => {
      const ai = aiItems.find(a => a.id === orig.id)
      if (!ai) return orig
      return { ...orig, description: ai.description ?? orig.description }
    })
  }

  try {
    if (action === 'adjust') {
      if (!jd) return NextResponse.json({ error: 'Job description is required for Adjust Resume' }, { status: 400 })
      if (!resumeParsed?.success) return NextResponse.json({ error: 'resume_data is required' }, { status: 400 })
      const out = await callOpenAIJson({
        system: adjustResumePrompt,
        user: `JOB DESCRIPTION:\n${jd}\n\nRESUME SECTIONS TO EDIT (JSON):\n${editPayload()}`,
      })
      const shaped = adjustResponseSchema.parse(out)
      const merged = {
        ...resumeParsed.data,
        workExperience: mergeByDescription(resumeParsed.data.workExperience, shaped.workExperience),
        projects: mergeByDescription(resumeParsed.data.projects, shaped.projects),
      }
      const nextResume = resumeSchema.safeParse(merged)
      if (!nextResume.success) return NextResponse.json({ error: 'AI returned invalid resume_data' }, { status: 502 })
      return NextResponse.json({ resume_data: nextResume.data })
    }

    if (action === 'optimize') {
      if (!jd) return NextResponse.json({ error: 'Job description is required for Optimize Resume' }, { status: 400 })
      if (!resumeParsed?.success) return NextResponse.json({ error: 'resume_data is required' }, { status: 400 })
      const out = await callOpenAIJson({
        system: optimizeResumePrompt,
        user: `JOB DESCRIPTION:\n${jd}\n\nRESUME SECTIONS TO EDIT (JSON):\n${editPayload()}`,
      })
      const shaped = optimizeResponseSchema.parse(out)
      const merged = {
        ...resumeParsed.data,
        workExperience: mergeByDescription(resumeParsed.data.workExperience, shaped.workExperience),
        projects: mergeByDescription(resumeParsed.data.projects, shaped.projects),
      }
      const nextResume = resumeSchema.safeParse(merged)
      if (!nextResume.success) return NextResponse.json({ error: 'AI returned invalid resume_data' }, { status: 502 })
      return NextResponse.json({ resume_data: nextResume.data })
    }

    if (action === 'addProjects') {
      if (!jd) return NextResponse.json({ error: 'Job description is required for Add AI Generated Projects' }, { status: 400 })
      if (!resumeParsed?.success) return NextResponse.json({ error: 'resume_data is required' }, { status: 400 })
      const out = await callOpenAIJson({
        system: addProjectsPrompt,
        user: `JOB DESCRIPTION:\n${jd}\n\nCURRENT PROJECTS + CONTEXT (JSON):\n${addProjectsPayload()}`,
      })
      const shaped = addProjectsResponseSchema.parse(out)
      const nextResume = resumeSchema.safeParse({ ...resumeParsed.data, projects: shaped.projects })
      if (!nextResume.success) return NextResponse.json({ error: 'AI returned invalid resume_data' }, { status: 502 })
      return NextResponse.json({ resume_data: nextResume.data })
    }

    if (action === 'coverLetter') {
      if (!jd) {
        return NextResponse.json({ error: 'Job description is required for Generate cover letter' }, { status: 400 })
      }
      const out = await callOpenAIJson({
        system: coverLetterPrompt,
        user: `JOB DESCRIPTION:\n${jd}\n\nCURRENT RESUME JSON:\n${resumeJson}`,
      })
      const shaped = coverLetterResponseSchema.parse(out)
      return NextResponse.json({ cover_letter: shaped.cover_letter })
    }

    if (action === 'fit') {
      if (!jd) return NextResponse.json({ error: 'Job description is required for Check fit' }, { status: 400 })
      if (!resumeParsed) return NextResponse.json({ error: 'resume_data is required for Check fit' }, { status: 400 })

      const extractedRaw = await callOpenAIJson({
        system: jobFitPrompt,
        user: `JOB DESCRIPTION:\n${jd}`,
      })
      const extracted = fitExtractionSchema.parse(extractedRaw)

      const must = (extracted.must_haves ?? [])
        .map((r) => ({
          label: String(r.label ?? '').trim(),
          aliases: (r.aliases ?? []).map((a) => String(a).trim()).filter(Boolean),
          jd_evidence: (r.jd_evidence ?? []).map((e) => String(e).trim()).filter(Boolean),
        }))
        .filter((r) => r.label)
        .slice(0, 12)

      const nice = (extracted.nice_to_haves ?? [])
        .map((r) => ({
          label: String(r.label ?? '').trim(),
          aliases: (r.aliases ?? []).map((a) => String(a).trim()).filter(Boolean),
          jd_evidence: (r.jd_evidence ?? []).map((e) => String(e).trim()).filter(Boolean),
        }))
        .filter((r) => r.label)
        .slice(0, 10)

      const resumeData = resumeParsed.data
      const snippets = resumeSnippets(resumeJson, resumeData)
      const snippetTexts = snippets.map((s) => s.text)

      const requirementText = (r: FitRequirement) => {
        const aliases = (r.aliases ?? []).filter(Boolean)
        const parts = [r.label, aliases.length ? `Aliases: ${aliases.join(', ')}` : ''].filter(Boolean)
        return parts.join(' | ')
      }

      const reqTexts = [...must.map(requirementText), ...nice.map(requirementText)].map((t) => shortText(t, 220))
      const allEmbedInputs = [...reqTexts, ...snippetTexts.map((t) => shortText(t, 320))]

      const vectors = await callOpenAIEmbeddings({ inputs: allEmbedInputs })
      const reqVecs = vectors.slice(0, reqTexts.length)
      const snippetVecs = vectors.slice(reqTexts.length)

      const STRONG_SIM = 0.83
      const WEAK_SIM = 0.77

      function scoreRequirement(r: FitRequirement, idx: number): FitRequirementResult {
        const targetVec = reqVecs[idx] ?? []
        const keys = [r.label, ...(r.aliases ?? [])].map(normText).filter(Boolean)

        const scored = snippets.map((s, si) => {
          const sim = cosineSimilarity(targetVec, snippetVecs[si] ?? [])
          const hay = normText(s.text)
          const keywordHit = keys.some((k) => (k.length >= 2 ? hay.includes(k) : false))
          return { section: s.section, text: s.text, similarity: sim, keywordHit }
        })

        scored.sort((a, b) => {
          if (a.keywordHit !== b.keywordHit) return a.keywordHit ? -1 : 1
          return b.similarity - a.similarity
        })

        const top = scored[0]
        const bestSim = top?.similarity ?? 0
        const hasKeyword = Boolean(top?.keywordHit)

        const status: FitRequirementStatus = hasKeyword || bestSim >= STRONG_SIM ? 'have' : bestSim >= WEAK_SIM ? 'weak' : 'missing'
        const score = status === 'have' ? 1 : status === 'weak' ? 0.5 : 0

        const evidence: FitEvidence[] = scored
          .filter((x) => x.keywordHit || x.similarity >= WEAK_SIM)
          .slice(0, 3)
          .map((x) => ({ section: x.section, text: x.text, similarity: clamp01(x.similarity) }))

        return {
          label: r.label,
          status,
          score,
          jd_evidence: r.jd_evidence ?? [],
          evidence,
        }
      }

      const mustResults = must.map((r, i) => scoreRequirement(r, i))
      const niceResults = nice.map((r, i) => scoreRequirement(r, must.length + i))

      const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
      const mustScore = avg(mustResults.map((r) => r.score))
      const niceScore = avg(niceResults.map((r) => r.score))
      const baseOverall = 0.8 * mustScore + 0.2 * niceScore

      const estimatedYears = estimateExperienceYears(resumeData)
      const requiredYears = extracted.role_min_years
      const diff = requiredYears != null && estimatedYears != null ? requiredYears - estimatedYears : 0

      // Only penalize when mismatch is large (>= 3 years), per product intent.
      const penalty = diff >= 3 ? Math.min(0.2, diff / 12) : 0
      const overall = clamp01(baseOverall * (1 - penalty))

      const seniorityNote = (() => {
        if (requiredYears == null) return 'No explicit years requirement found in the job description.'
        if (estimatedYears == null) return 'Could not estimate years of experience from resume dates.'
        if (diff <= 0) return 'Resume timeline meets or exceeds the job’s minimum years requirement.'
        if (diff < 3) return 'Small years-of-experience mismatch; minimal impact on score.'
        return 'Large years-of-experience mismatch; score is reduced accordingly.'
      })()

      const suggestions: string[] = []
      const missingMust = mustResults.filter((r) => r.status === 'missing').slice(0, 6)
      for (const m of missingMust) {
        suggestions.push(`If you have it, add evidence for: ${m.label}`)
      }
      const weakMust = mustResults.filter((r) => r.status === 'weak').slice(0, 4)
      for (const w of weakMust) {
        suggestions.push(`Strengthen evidence for: ${w.label} (add a specific bullet with tools + impact)`) 
      }

      const resp: FitResponse = {
        overall_percent: Math.round(overall * 100),
        must_percent: Math.round(mustScore * 100),
        nice_percent: Math.round(niceScore * 100),
        seniority: {
          role_min_years: requiredYears,
          estimated_years: estimatedYears,
          penalty_percent: Math.round(penalty * 100),
          note: seniorityNote,
        },
        must_haves: mustResults,
        nice_to_haves: niceResults,
        suggestions,
      }

      return NextResponse.json({ fit: resp })
    }

    if (action === 'clHighlights') {
      if (!jd) return NextResponse.json({ error: 'Job description is required' }, { status: 400 })
      if (!resumeParsed) return NextResponse.json({ error: 'resume_data is required' }, { status: 400 })
      const resumeText = resumeToAnalysisText(resumeParsed.data)
      const out = await callOpenAIJson({
        system: coverLetterHighlightsPrompt,
        user: `JOB DESCRIPTION:\n${jd}\n\nRESUME:\n${resumeText}`,
      })
      return NextResponse.json(out)
    }

    if (action === 'clDraft') {
      if (!jd) return NextResponse.json({ error: 'Job description is required' }, { status: 400 })
      const { highlights = [], answers = [], questions = [] } = (extra as any) ?? {}
      const highlightText = (highlights as Array<{ point: string; why: string }>)
        .map((h, i) => `${i + 1}. ${h.point} — ${h.why}`)
        .join('\n')
      const qaText = (questions as string[])
        .map((q, i) => `Q: ${q}\nA: ${(answers as string[])[i]?.trim() || '(no answer)'}`)
        .join('\n\n')
      const jdTrimmed = jd.slice(0, 1200)
      const out = await callOpenAIJson({
        system: coverLetterDraftPrompt,
        user: `JOB DESCRIPTION (excerpt):\n${jdTrimmed}\n\nHIGHLIGHTS FROM RESUME:\n${highlightText}\n\nCANDIDATE MOTIVATION:\n${qaText}`,
      })
      return NextResponse.json(out)
    }

    if (!resumeParsed) {
      return NextResponse.json({ error: 'resume_data is required for this action' }, { status: 400 })
    }
    const resumeData = resumeParsed.data

    if (action === 'alignment') {
      if (!jd) return NextResponse.json({ error: 'Job description is required for Alignment Analysis' }, { status: 400 })
      const resumeText = resumeToAnalysisText(resumeData)
      const out = await callOpenAIJson({
        system: alignmentAnalysisPrompt,
        user: `JOB DESCRIPTION:\n${jd}\n\nRESUME:\n${resumeText}`,
      })
      return NextResponse.json(out)
    }

    if (action === 'atsAudit') {
      if (!jd) return NextResponse.json({ error: 'Job description is required for ATS Audit' }, { status: 400 })
      const resumeText = resumeToAnalysisText(resumeData)
      const out = await callOpenAIJson({
        system: atsAuditPrompt,
        user: `JOB DESCRIPTION:\n${jd}\n\nRESUME:\n${resumeText}`,
      })
      return NextResponse.json(out)
    }

    if (action === 'atsKeywords') {
      if (!jd) return NextResponse.json({ error: 'Job description is required for ATS Keywords' }, { status: 400 })
      const out = await callOpenAIJson({
        system: atsKeywordsPrompt,
        user: `JOB DESCRIPTION:\n${jd}`,
      })
      return NextResponse.json(out)
    }

    if (action === 'taskAudit') {
      const bullets = resumeToBulletsText(resumeData)
      if (!bullets.trim()) return NextResponse.json({ error: 'No bullet points found in resume' }, { status: 400 })
      const out = await callOpenAIJson({
        system: taskAuditPrompt,
        user: `RESUME BULLETS:\n${bullets}`,
      })
      return NextResponse.json(out)
    }

    if (action === 'gapAnalysis') {
      if (!jd) return NextResponse.json({ error: 'Job description is required for Gap Analysis' }, { status: 400 })
      const resumeText = resumeToAnalysisText(resumeData)
      const out = await callOpenAIJson({
        system: gapAnalysisPrompt,
        user: `JOB DESCRIPTION:\n${jd}\n\nRESUME:\n${resumeText}`,
      })
      return NextResponse.json(out)
    }

    if (action === 'howDev') {
      const bullets = resumeToBulletsText(resumeData)
      if (!bullets.trim()) return NextResponse.json({ error: 'No bullet points found in resume' }, { status: 400 })
      const out = await callOpenAIJson({
        system: howDevPrompt,
        user: `RESUME BULLETS:\n${bullets}`,
      })
      return NextResponse.json(out)
    }

    if (action === 'interviewQuestions') {
      if (!jd) return NextResponse.json({ error: 'Job description is required' }, { status: 400 })
      const resumeText = resumeToAnalysisText(resumeData)
      const out = await callOpenAIJson({
        system: interviewQuestionsPrompt,
        user: `JOB DESCRIPTION:\n${jd}\n\nRESUME:\n${resumeText}`,
      })
      return NextResponse.json(out)
    }

    if (action === 'questionsToAsk') {
      if (!jd) return NextResponse.json({ error: 'Job description is required' }, { status: 400 })
      const out = await callOpenAIJson({
        system: questionsToAskPrompt,
        user: `JOB DESCRIPTION:\n${jd}`,
      })
      return NextResponse.json(out)
    }

    if (action === 'informationalInterview') {
      const context = ((extra as any)?.context ?? '').toString().trim()
      const roleContext = context || jd.slice(0, 800)
      if (!roleContext) return NextResponse.json({ error: 'Role context or job description is required' }, { status: 400 })
      const out = await callOpenAIJson({
        system: informationalInterviewPrompt,
        user: `TARGET ROLE CONTEXT:\n${roleContext}`,
      })
      return NextResponse.json(out)
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI request failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
