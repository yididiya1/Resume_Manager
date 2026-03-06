'use client'

import { useMemo, useState } from 'react'
import {
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardCopy,
  Lightbulb,
  Loader2,
  MessageSquare,
  MessagesSquare,
  Sparkles,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import type { ResumeData } from '@/lib/resume/types'
import { GradientSparklesIcon } from '@/components/icons/GradientSparklesIcon'

type ResumeRow = { id: string; title: string; resume_data: ResumeData }

type Mode = 'interviewQuestions' | 'questionsToAsk' | 'informationalInterview'

// ── Prompt-result types ─────────────────────────────────────────────────────

type StarPrompts = { situation: string; task: string; action: string; result: string }
type InterviewQuestion = {
  question: string
  category: 'behavioral' | 'technical' | 'situational' | 'company'
  competency: string
  star_prompts: StarPrompts
}
type InterviewQuestionsResult = { questions: InterviewQuestion[] }

type QTA = { question: string; purpose: string }
type QTACategory = { label: string; questions: QTA[] }
type QuestionsToAskResult = { categories: QTACategory[] }

type InfoQuestion = { question: string; purpose: string; follow_up: string }
type InfoInterviewResult = { questions: InfoQuestion[] }

// ── Category config ─────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  InterviewQuestion['category'],
  { label: string; color: string; bg: string }
> = {
  behavioral: { label: 'Behavioral', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/40' },
  technical: { label: 'Technical', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40' },
  situational: { label: 'Situational', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' },
  company: { label: 'Company / Culture', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StarBuilder({ prompts, question }: { prompts: StarPrompts; question: string }) {
  const fields: { key: keyof StarPrompts; label: string }[] = [
    { key: 'situation', label: 'Situation' },
    { key: 'task', label: 'Task' },
    { key: 'action', label: 'Action' },
    { key: 'result', label: 'Result' },
  ]
  const [values, setValues] = useState<Record<keyof StarPrompts, string>>({
    situation: '',
    task: '',
    action: '',
    result: '',
  })
  const [copied, setCopied] = useState(false)

  const filled = fields.some(({ key }) => values[key].trim())

  function copyAnswer() {
    const parts = fields
      .filter(({ key }) => values[key].trim())
      .map(({ key, label }) => `**${label}:** ${values[key].trim()}`)
      .join('\n\n')
    const text = `Q: ${question}\n\n${parts}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="mt-3 grid gap-2">
      {fields.map(({ key, label }) => (
        <div key={key}>
          <div className="mb-1 flex items-baseline gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
            <span className="text-[11px] text-muted-foreground">{prompts[key]}</span>
          </div>
          <Textarea
            className="min-h-[60px] resize-none text-sm"
            placeholder={`Your ${label.toLowerCase()}…`}
            value={values[key]}
            onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
          />
        </div>
      ))}
      <Button
        size="sm"
        variant="outline"
        className="mt-1 w-full gap-2"
        disabled={!filled}
        onClick={copyAnswer}
      >
        {copied ? (
          <><Check className="size-3.5 text-green-500" />Copied!</>
        ) : (
          <><ClipboardCopy className="size-3.5" />Copy answer</>
        )}
      </Button>
    </div>
  )
}

function InterviewQuestionCard({ q, index }: { q: InterviewQuestion; index: number }) {
  const [open, setOpen] = useState(false)
  const cfg = CATEGORY_CONFIG[q.category]

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <button
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug">{q.question}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg.color} ${cfg.bg}`}>
              {cfg.label}
            </span>
            <span className="text-[11px] text-muted-foreground">{q.competency}</span>
          </div>
        </div>
        {open ? (
          <ChevronUp className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="border-t px-4 pb-4">
          <p className="mt-2 text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
            STAR Answer Builder
          </p>
          <StarBuilder prompts={q.star_prompts} question={q.question} />
        </div>
      )}
    </div>
  )
}

function QuestionsToAskCard({ q }: { q: QTA }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border bg-card px-4 py-3 shadow-sm">
      <button className="flex w-full items-start gap-2 text-left" onClick={() => setOpen((o) => !o)}>
        <MessageSquare className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="flex-1 text-sm font-medium leading-snug">{q.question}</p>
        {open ? (
          <ChevronUp className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open && (
        <p className="mt-2 border-t pt-2 text-[12px] text-muted-foreground leading-relaxed">{q.purpose}</p>
      )}
    </div>
  )
}

function InfoQuestionCard({ q }: { q: InfoQuestion }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border bg-card px-4 py-3 shadow-sm">
      <button className="flex w-full items-start gap-2 text-left" onClick={() => setOpen((o) => !o)}>
        <MessagesSquare className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="flex-1 text-sm font-medium leading-snug">{q.question}</p>
        {open ? (
          <ChevronUp className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="mt-2 space-y-2 border-t pt-2">
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">Why it matters: </span>
            {q.purpose}
          </p>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">Follow-up: </span>
            {q.follow_up}
          </p>
        </div>
      )}
    </div>
  )
}

// ── Mode config ─────────────────────────────────────────────────────────────

const MODES: { id: Mode; label: string; icon: React.ReactNode; needsResume: boolean; desc: string }[] = [
  {
    id: 'interviewQuestions',
    label: 'Interview Prep',
    icon: <BrainCircuit className="size-4" />,
    needsResume: true,
    desc: 'Tailored questions with STAR answer builders',
  },
  {
    id: 'questionsToAsk',
    label: 'Questions to Ask',
    icon: <Lightbulb className="size-4" />,
    needsResume: false,
    desc: 'Smart questions to ask your interviewer',
  },
  {
    id: 'informationalInterview',
    label: 'Informational',
    icon: <Users className="size-4" />,
    needsResume: false,
    desc: 'Questions for networking conversations',
  },
]

// ── Main component ───────────────────────────────────────────────────────────

export function InterviewClient({ resumes }: { resumes: ResumeRow[] }) {
  const [selectedId, setSelectedId] = useState(resumes[0]?.id ?? '')
  const selected = useMemo(() => resumes.find((r) => r.id === selectedId) ?? resumes[0], [resumes, selectedId])

  const [jd, setJd] = useState('')
  const [mode, setMode] = useState<Mode>('interviewQuestions')
  const [busy, setBusy] = useState(false)
  const [hasResult, setHasResult] = useState(false)

  const [interviewResult, setInterviewResult] = useState<InterviewQuestionsResult | null>(null)
  const [qtaResult, setQtaResult] = useState<QuestionsToAskResult | null>(null)
  const [infoResult, setInfoResult] = useState<InfoInterviewResult | null>(null)

  const currentMode = MODES.find((m) => m.id === mode)!
  const canGenerate = jd.trim().length > 0

  function switchMode(next: Mode) {
    setMode(next)
    setHasResult(false)
    setInterviewResult(null)
    setQtaResult(null)
    setInfoResult(null)
  }

  async function generate() {
    if (!canGenerate) return
    setBusy(true)
    setHasResult(false)
    setInterviewResult(null)
    setQtaResult(null)
    setInfoResult(null)

    const body: Record<string, unknown> = { action: mode, jobDescription: jd }
    if (mode === 'interviewQuestions' && selected) body.resume_data = selected.resume_data

    try {
      const res = await fetch('/api/ai/adjuster', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) { alert(json?.error ?? 'Something went wrong'); return }
      if (mode === 'interviewQuestions') setInterviewResult(json)
      else if (mode === 'questionsToAsk') setQtaResult(json)
      else setInfoResult(json)
      setHasResult(true)
    } finally {
      setBusy(false)
    }
  }

  const groupedQuestions = useMemo(() => {
    if (!interviewResult) return {} as Record<InterviewQuestion['category'], InterviewQuestion[]>
    const groups: Record<string, InterviewQuestion[]> = {}
    for (const q of interviewResult.questions) {
      ;(groups[q.category] ??= []).push(q)
    }
    return groups as Record<InterviewQuestion['category'], InterviewQuestion[]>
  }, [interviewResult])

  return (
    <main className="mx-auto grid grid-cols-1 gap-4 px-6 py-6 md:grid-cols-2 xl:max-w-[90vw] xl:grid-cols-7 2xl:max-w-[75vw]">
      {/* ── Left panel ── */}
      <div className="space-y-4 xl:col-span-2">
        {/* Mode selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Interview Prep</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pb-4">
            {MODES.map((m) => (
              <label key={m.id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm hover:bg-muted/50">
                <input
                  type="radio"
                  name="interview-mode"
                  checked={mode === m.id}
                  onChange={() => switchMode(m.id)}
                />
                <span className="text-muted-foreground">{m.icon}</span>
                <span className={mode === m.id ? 'font-medium' : ''}>{m.label}</span>
              </label>
            ))}
            <p className="pt-1 pl-1 text-[11px] text-muted-foreground">{currentMode.desc}</p>
          </CardContent>
        </Card>

        {/* Resume picker — Interview Prep only */}
        {currentMode.needsResume && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resume</CardTitle>
            </CardHeader>
            <CardContent>
              {resumes.length ? (
                <div className="grid grid-cols-2 gap-2">
                  {resumes.map((r) => (
                    <label key={r.id} className="flex min-w-0 items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="interview-resume"
                        checked={selectedId === r.id}
                        onChange={() => setSelectedId(r.id)}
                      />
                      <span className="min-w-0 truncate">{r.title}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No resumes yet. Create one in the Builder.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Job description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Job description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              className="field-sizing-fixed h-40 resize-none overflow-y-auto"
              value={jd}
              onChange={(e) => { setJd(e.target.value); if (hasResult) switchMode(mode) }}
              placeholder="Paste the job description here…"
            />
            <div className="rounded-md bg-gradient-to-r from-[#40c9ff] to-[#e81cff] p-[1px]">
              <Button
                className="w-full rounded-md border-0 bg-background"
                variant="outline"
                disabled={busy || !canGenerate}
                onClick={generate}
              >
                {busy ? (
                  <><Loader2 className="mr-2 size-4 animate-spin" />Generating…</>
                ) : (
                  <>
                    <span className="bg-gradient-to-r from-[#40c9ff] to-[#e81cff] bg-clip-text text-transparent">
                      {hasResult ? 'Regenerate' : 'Generate'}
                    </span>
                    <GradientSparklesIcon className="ml-1" size={16} />
                  </>
                )}
              </Button>
            </div>
            {!canGenerate && (
              <p className="text-xs text-muted-foreground">Add a job description to continue.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Right panel ── */}
      <div className="space-y-4 xl:col-span-5">
        {/* Empty / loading state */}
        {!hasResult && (
          <Card>
            <CardContent className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              <div className="space-y-2 text-center">
                {busy ? (
                  <><Loader2 className="mx-auto size-8 animate-spin opacity-40" /><div>Generating…</div></>
                ) : (
                  <><Sparkles className="mx-auto size-8 opacity-20" /><div>Paste a job description and click Generate to start.</div></>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Interview Prep results ── */}
        {!busy && interviewResult && (
          <>
            {(Object.keys(CATEGORY_CONFIG) as InterviewQuestion['category'][]).map((cat) => {
              const qs = groupedQuestions[cat]
              if (!qs?.length) return null
              const cfg = CATEGORY_CONFIG[cat]
              return (
                <Card key={cat}>
                  <CardHeader className="pb-3">
                    <CardTitle className={`text-xs font-semibold uppercase tracking-widest ${cfg.color}`}>
                      {cfg.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {qs.map((q, i) => (
                      <InterviewQuestionCard key={i} q={q} index={i} />
                    ))}
                  </CardContent>
                </Card>
              )
            })}
          </>
        )}

        {/* ── Questions to Ask results ── */}
        {!busy && qtaResult && (
          <>
            {qtaResult.categories.map((cat) => (
              <Card key={cat.label}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    <Lightbulb className="size-3.5 text-amber-500" />
                    {cat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {cat.questions.map((q, i) => (
                    <QuestionsToAskCard key={i} q={q} />
                  ))}
                </CardContent>
              </Card>
            ))}
          </>
        )}

        {/* ── Informational Interview results ── */}
        {!busy && infoResult && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <Users className="size-3.5 text-primary" />
                Informational Interview Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {infoResult.questions.map((q, i) => (
                <InfoQuestionCard key={i} q={q} />
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
