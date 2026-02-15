import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { resumeSchema } from '@/lib/resume/types'
import { adjustResumePrompt } from '@/lib/ai/prompts/adjustResume'
import { optimizeResumePrompt } from '@/lib/ai/prompts/optimizeResume'
import { addProjectsPrompt } from '@/lib/ai/prompts/addProjects'
import { coverLetterPrompt } from '@/lib/ai/prompts/coverLetter'
import { jobFitPrompt } from '@/lib/ai/prompts/jobFit'

const actionSchema = z.enum(['adjust', 'optimize', 'addProjects', 'coverLetter', 'fit'])

const requestSchema = z.object({
  action: actionSchema,
  jobDescription: z.string().optional().default(''),
  resume_data: z.unknown(),
})

const adjustResponseSchema = z.object({
  resume_data: z.unknown(),
  changes: z.array(z.string()).optional().default([]),
  warnings: z.array(z.string()).optional().default([]),
  missing_info_questions: z.array(z.string()).optional().default([]),
})

const optimizeResponseSchema = z.object({
  resume_data: z.unknown(),
  changes: z.array(z.string()).optional().default([]),
  warnings: z.array(z.string()).optional().default([]),
})

const addProjectsResponseSchema = z.object({
  projects: z
    .array(
      z.object({
        title: z.string().default(''),
        subtitle: z.string().optional().default(''),
        dates: z
          .object({
            start: z.string().optional().default(''),
            end: z.string().optional().default(''),
          })
          .default({ start: '', end: '' }),
        description: z.unknown().optional(),
      }),
    )
    .default([]),
  notes: z.array(z.string()).optional().default([]),
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

  const { action, jobDescription, resume_data } = parsed.data

  const resumeParsed = resumeSchema.safeParse(resume_data)
  if (!resumeParsed.success) {
    return NextResponse.json({ error: 'Invalid resume_data' }, { status: 400 })
  }

  const resumeJson = JSON.stringify(resumeParsed.data)
  const jd = (jobDescription || '').trim()

  try {
    if (action === 'adjust') {
      if (!jd) {
        return NextResponse.json({ error: 'Job description is required for Adjust Resume' }, { status: 400 })
      }
      const out = await callOpenAIJson({
        system: adjustResumePrompt,
        user: `JOB DESCRIPTION:\n${jd}\n\nCURRENT RESUME JSON:\n${resumeJson}`,
      })
      const shaped = adjustResponseSchema.parse(out)
      const nextResume = resumeSchema.safeParse(shaped.resume_data)
      if (!nextResume.success) {
        return NextResponse.json({ error: 'AI returned invalid resume_data' }, { status: 502 })
      }
      return NextResponse.json({
        resume_data: nextResume.data,
        meta: {
          changes: shaped.changes,
          warnings: shaped.warnings,
          missing_info_questions: shaped.missing_info_questions,
        },
      })
    }

    if (action === 'optimize') {
      const out = await callOpenAIJson({
        system: optimizeResumePrompt,
        user: `JOB DESCRIPTION (optional):\n${jd || '(none)'}\n\nCURRENT RESUME JSON:\n${resumeJson}`,
      })
      const shaped = optimizeResponseSchema.parse(out)
      const nextResume = resumeSchema.safeParse(shaped.resume_data)
      if (!nextResume.success) {
        return NextResponse.json({ error: 'AI returned invalid resume_data' }, { status: 502 })
      }
      return NextResponse.json({
        resume_data: nextResume.data,
        meta: { changes: shaped.changes, warnings: shaped.warnings },
      })
    }

    if (action === 'addProjects') {
      if (!jd) {
        return NextResponse.json({ error: 'Job description is required for Add AI Generated Projects' }, { status: 400 })
      }
      const out = await callOpenAIJson({
        system: addProjectsPrompt,
        user: `JOB DESCRIPTION:\n${jd}\n\nCURRENT RESUME JSON:\n${resumeJson}`,
      })
      const shaped = addProjectsResponseSchema.parse(out)
      return NextResponse.json({ projects: shaped.projects, meta: { notes: shaped.notes } })
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
      if (!jd) {
        return NextResponse.json({ error: 'Job description is required for Check fit' }, { status: 400 })
      }

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

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI request failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
