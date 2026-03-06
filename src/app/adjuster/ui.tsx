'use client'

import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { pdf } from '@react-pdf/renderer'
import { AlertCircle, AlertTriangle, BatteryWarning, CheckCircle2, Download, EyeIcon, EyeOffIcon, FileWarning, Hash, HelpCircle, Info, ListChecks, MessageCircleWarning, MinusCircle, Save, ScanSearch, Sparkles, Target, Wrench, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ResumePreview } from '@/components/resume/ResumePreview'
import type { ResumeData } from '@/lib/resume/types'
import type { ResumePdfSectionKey, ResumePdfVisibleSections } from '@/components/resume/ResumePdfDocument'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { FitGauge } from '@/components/fit/FitGauge'
import { AlertDialog } from 'radix-ui'

type ResumeRow = { id: string; title: string; resume_data: ResumeData }

type BulletChange = {
  key: string
  section: 'work' | 'projects'
  itemLabel: string
  bulletIndex: number
  before: string
  after: string
}

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

function statusIcon(status: FitRequirementStatus) {
  if (status === 'have') return <CheckCircle2 className="size-4" />
  if (status === 'weak') return <HelpCircle className="size-4" />
  return <XCircle className="size-4" />
}

function statusColor(status: FitRequirementStatus): string {
  if (status === 'have') return 'var(--chart-2)'
  if (status === 'missing') return 'var(--destructive)'
  return 'var(--muted-foreground)'
}

function requirementStyle(status: FitRequirementStatus): CSSProperties {
  if (status === 'have') {
    return {
      borderColor: 'color-mix(in oklch, var(--chart-2) 55%, var(--border))',
      backgroundColor: 'color-mix(in oklch, var(--chart-2) 10%, transparent)',
    }
  }
  if (status === 'missing') {
    return {
      borderColor: 'color-mix(in oklch, var(--destructive) 60%, var(--border))',
      backgroundColor: 'color-mix(in oklch, var(--destructive) 5%, transparent)',
    }
  }
  return {
    borderColor: 'var(--border)',
    backgroundColor: 'color-mix(in oklch, var(--muted) 55%, transparent)',
  }
}

function FitGaugeArc({ percent }: { percent: number }) {
  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">Overall fit</div>
      <div className="relative w-full overflow-hidden rounded-md border bg-muted/20 px-3 py-3">
        <FitGauge value={percent} />
      </div>
    </div>
  )
}

function sectionLabel(section: FitEvidence['section']): string {
  if (section === 'work') return 'Work'
  if (section === 'projects') return 'Projects'
  if (section === 'skills') return 'Skills'
  if (section === 'summary') return 'Summary'
  if (section === 'education') return 'Education'
  return 'Certificates'
}

function rtText(node: any): string {
  if (!node) return ''
  if (typeof node.text === 'string') return node.text
  const content = Array.isArray(node.content) ? node.content : []
  return content.map(rtText).join('')
}

function extractBulletsFromRichTextDoc(doc: any): string[] {
  if (!doc || doc.type !== 'doc') return []

  const bullets: string[] = []
  const walk = (node: any) => {
    if (!node) return
    if (node.type === 'bulletList' && Array.isArray(node.content)) {
      for (const item of node.content) {
        if (item?.type !== 'listItem') continue
        const txt = rtText(item).replace(/\s+/g, ' ').trim()
        if (txt) bullets.push(txt)
      }
      return
    }
    const content = Array.isArray(node.content) ? node.content : []
    for (const child of content) walk(child)
  }
  walk(doc)
  return bullets
}

function diffWorkAndProjectBullets(prev: ResumeData, next: ResumeData): BulletChange[] {
  const changes: BulletChange[] = []

  const prevWork = new Map((prev.workExperience ?? []).map((w) => [w.id, w]))
  for (const w of next.workExperience ?? []) {
    const before = prevWork.get(w.id)
    if (!before) continue
    const beforeBullets = extractBulletsFromRichTextDoc((before as any).description)
    const afterBullets = extractBulletsFromRichTextDoc((w as any).description)
    const len = Math.min(beforeBullets.length, afterBullets.length)
    const label = `${w.jobTitle ?? ''}${w.employer ? ` @ ${w.employer}` : ''}`.trim() || 'Work experience'
    for (let i = 0; i < len; i += 1) {
      const b = beforeBullets[i] ?? ''
      const a = afterBullets[i] ?? ''
      if (b.replace(/\s+/g, ' ').trim() === a.replace(/\s+/g, ' ').trim()) continue
      changes.push({
        key: `work:${w.id}:${i}`,
        section: 'work',
        itemLabel: label,
        bulletIndex: i,
        before: b,
        after: a,
      })
    }
  }

  const prevProjects = new Map((prev.projects ?? []).map((p) => [p.id, p]))
  for (const p of next.projects ?? []) {
    const before = prevProjects.get(p.id)
    if (!before) continue
    const beforeBullets = extractBulletsFromRichTextDoc((before as any).description)
    const afterBullets = extractBulletsFromRichTextDoc((p as any).description)
    const len = Math.min(beforeBullets.length, afterBullets.length)
    const label = `${p.title ?? ''}`.trim() || 'Project'
    for (let i = 0; i < len; i += 1) {
      const b = beforeBullets[i] ?? ''
      const a = afterBullets[i] ?? ''
      if (b.replace(/\s+/g, ' ').trim() === a.replace(/\s+/g, ' ').trim()) continue
      changes.push({
        key: `projects:${p.id}:${i}`,
        section: 'projects',
        itemLabel: label,
        bulletIndex: i,
        before: b,
        after: a,
      })
    }
  }

  return changes
}

function bulletDiffStyle(kind: 'before' | 'after'): CSSProperties {
  if (kind === 'before') {
    return {
      borderColor: 'color-mix(in oklch, var(--destructive) 60%, var(--border))',
      backgroundColor: 'color-mix(in oklch, var(--destructive) 8%, transparent)',
    }
  }
  return {
    borderColor: 'color-mix(in oklch, var(--chart-2) 55%, var(--border))',
    backgroundColor: 'color-mix(in oklch, var(--chart-2) 10%, transparent)',
  }
}

type AnalysisAction = 'alignment' | 'atsAudit' | 'atsKeywords' | 'taskAudit' | 'gapAnalysis' | 'howDev'
type AnalysisResult = { type: AnalysisAction; data: Record<string, any> }

export function AdjusterClient({ resumes }: { resumes: ResumeRow[] }) {
  const [jobDescription, setJobDescription] = useState('')
  const [selectedId, setSelectedId] = useState(resumes[0]?.id ?? '')
  const selected = useMemo(() => resumes.find((r) => r.id === selectedId) ?? resumes[0], [resumes, selectedId])

  const [adjustedData, setAdjustedData] = useState<ResumeData | null>(selected?.resume_data ?? null)
  const [coverLetter, setCoverLetter] = useState<string>('')
  const [coverLetterOpen, setCoverLetterOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [meta, setMeta] = useState<{ bulletChanges?: BulletChange[]; notes?: string[] } | null>(null)
  const [fit, setFit] = useState<FitResponse | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [rightTab, setRightTab] = useState<'fit' | 'analysis'>('fit')

  const [visibleSections, setVisibleSections] = useState<ResumePdfVisibleSections>({
    header: true,
    summary: true,
    education: true,
    workExperience: true,
    projects: true,
    skills: true,
    certificates: true,
  })

  function toggleSection(key: ResumePdfSectionKey) {
    setVisibleSections((prev) => ({
      ...prev,
      [key]: prev[key] === false,
    }))
  }

  function sectionEye(key: ResumePdfSectionKey, label: string) {
    const isOn = visibleSections[key] !== false
    return (
      <button
        type="button"
        className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
        onClick={() => toggleSection(key)}
      >
        <span>{label}</span>
        <span className="text-muted-foreground">{isOn ? <EyeIcon className="size-4" /> : <EyeOffIcon className="size-4" />}</span>
      </button>
    )
  }

  function selectResume(nextId: string) {
    if (nextId === selectedId) return
    const next = resumes.find((r) => r.id === nextId) ?? null
    setSelectedId(nextId)
    setAdjustedData(next?.resume_data ?? null)
    setCoverLetter('')
    setCoverLetterOpen(false)
    setMeta(null)
    setFit(null)
    setBusy(null)
  }

  useEffect(() => {
    setAdjustedData(selected?.resume_data ?? null)
    setCoverLetter('')
    setCoverLetterOpen(false)
    setMeta(null)
    setFit(null)
    setBusy(null)
  }, [selectedId])

  const title = selected?.title ?? 'Resume'
  const data = (adjustedData ?? selected?.resume_data) ?? ({} as ResumeData)

  async function runAction(action: 'adjust' | 'optimize' | 'addProjects' | 'coverLetter' | 'fit') {
    if (!selected) return
    const prevResumeData = adjustedData ?? selected.resume_data
    setBusy(action)
    setMeta(null)

    if (action === 'coverLetter') {
      setCoverLetterOpen(true)
      setCoverLetter('')
    }

    const res = await fetch('/api/ai/adjuster', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        action,
        jobDescription,
        resume_data: prevResumeData,
      }),
    })

    const body = (await res.json().catch(() => null)) as any
    if (!res.ok) {
      alert(body?.error ?? 'AI request failed')
      setBusy(null)
      return
    }

    if (action === 'fit') {
      const nextFit = body?.fit as FitResponse | undefined
      if (nextFit) setFit(nextFit)
      setBusy(null)
      return
    }

    if (action === 'addProjects') {
      const nextResume = body?.resume_data as ResumeData | undefined
      if (nextResume) {
        setAdjustedData(nextResume)
        const bulletChanges = diffWorkAndProjectBullets(prevResumeData, nextResume)
        setMeta({ bulletChanges })
      }
      setBusy(null)
      return
    }

    if (action === 'coverLetter') {
      setCoverLetter(String(body?.cover_letter ?? ''))
      setBusy(null)
      return
    }

    const nextResume = body?.resume_data as ResumeData | undefined
    if (nextResume) {
      setAdjustedData(nextResume)
      const bulletChanges = diffWorkAndProjectBullets(prevResumeData, nextResume)
      setMeta({ bulletChanges })
    }
    setBusy(null)
  }

  async function runAnalysis(action: AnalysisAction) {
    if (!selected) return
    setBusy(action)
    const res = await fetch('/api/ai/adjuster', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        action,
        jobDescription,
        resume_data: adjustedData ?? selected.resume_data,
      }),
    })
    const body = (await res.json().catch(() => null)) as any
    if (!res.ok) {
      alert(body?.error ?? 'AI request failed')
      setBusy(null)
      return
    }
    setAnalysis({ type: action, data: body })
    setRightTab('analysis')
    setBusy(null)
  }

  async function saveAsNew() {
    if (!selected) return
    const res = await fetch('/api/resumes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title: `${selected.title} (Adjusted)`, resume_data: adjustedData ?? selected.resume_data }),
    })
    const body = (await res.json().catch(() => null)) as { id?: string; error?: string } | null
    if (!res.ok || !body?.id) {
      alert(body?.error ?? 'Save failed')
      return
    }
    window.location.href = `/builder/${body.id}`
  }

  async function downloadResume() {
    if (!selected) return
    const rightTitle = (selected.title || 'Resume').trim() || 'Resume'
    const { ResumePdfDocument } = await import('@/components/resume/ResumePdfDocument')
    const blob = await pdf(<ResumePdfDocument title={rightTitle} data={data} visibleSections={visibleSections} />).toBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${rightTitle}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function downloadCoverLetter() {
    const text = coverLetter.trim()
    if (!text) return

    const { Document, Page, StyleSheet, Text, View } = await import('@react-pdf/renderer')

    const headerName = (data?.header?.fullName ?? '').trim() || 'Cover Letter'
    const headerParts = (data?.header?.links ?? [])
      .map((l) => {
        const raw = (l?.url ?? '').trim()
        if (!raw) return null
        if (/^mailto:/i.test(raw)) return raw.replace(/^mailto:/i, '').trim()
        if (/^tel:/i.test(raw)) return raw.replace(/^tel:/i, '').trim()
        const label = (l?.label ?? '').trim()
        if (label) return label
        return raw.replace(/^https?:\/\//i, '')
      })
      .filter(Boolean) as string[]
    const headerContact = headerParts.join(' • ')

    const styles = StyleSheet.create({
      page: { paddingTop: 42, paddingBottom: 42, paddingHorizontal: 36, fontSize: 11, fontFamily: 'Helvetica' },
      header: { marginBottom: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
      headerName: { fontSize: 14, fontWeight: 700 },
      headerContact: { marginTop: 3, fontSize: 10, color: '#4B5563' },
      footer: {
        position: 'absolute',
        left: 36,
        right: 36,
        bottom: 18,
        flexDirection: 'row',
        justifyContent: 'space-between',
        fontSize: 9,
        color: '#6B7280',
      },
      paragraph: { fontSize: 11, lineHeight: 1.35, marginBottom: 8 },
    })

    const paragraphs = text
      .replace(/\r\n/g, '\n')
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\s+/g, ' ').trim())
      .filter(Boolean)

    function CoverLetterPdf() {
      return (
        <Document title="Cover Letter">
          <Page size="A4" style={styles.page}>
            <View style={styles.header} fixed>
              <Text style={styles.headerName}>{headerName}</Text>
              {headerContact ? <Text style={styles.headerContact}>{headerContact}</Text> : null}
            </View>
            <View>
              {paragraphs.map((p, idx) => (
                <Text key={idx} style={styles.paragraph}>
                  {p}
                </Text>
              ))}
            </View>

            <View style={styles.footer} fixed>
              <Text>{headerName}</Text>
              <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
            </View>
          </Page>
        </Document>
      )
    }

    const blob = await pdf(<CoverLetterPdf />).toBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cover-letter.pdf'
    a.click()
    URL.revokeObjectURL(url)
  }

  function renderAnalysis() {
    if (!analysis) {
      return (
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MinusCircle className="mt-0.5 size-4 shrink-0" />
          <span>Run an analysis tool to see results here.</span>
        </div>
      )
    }

    if (analysis.type === 'alignment') {
      const d = analysis.data
      return (
        <div className="space-y-4 text-sm">
          <div>
            <div className="font-semibold mb-2">Top 3 changes</div>
            <ol className="space-y-3">
              {(d.top3 ?? []).map((item: any, i: number) => (
                <li key={i} className="rounded-md border p-3">
                  <div className="font-medium">{item.change}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{item.why}</div>
                </li>
              ))}
            </ol>
          </div>
          {d.worth_revisiting?.length ? (
            <div>
              <div className="font-semibold mb-1">Worth revisiting</div>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-xs">
                {d.worth_revisiting.map((s: string, i: number) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          ) : null}
          {d.nice_to_have?.length ? (
            <div>
              <div className="font-semibold mb-1">Nice to have</div>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-xs">
                {d.nice_to_have.map((s: string, i: number) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          ) : null}
          {d.questions?.length ? (
            <div>
              <div className="font-semibold mb-2">Clarifying questions</div>
              <div className="space-y-2">
                {d.questions.map((q: any, i: number) => (
                  <div key={i} className="rounded-md border p-2">
                    <div className="text-xs text-muted-foreground italic mb-1">"{q.bullet}"</div>
                    <ul className="list-disc pl-4 text-xs space-y-0.5">
                      {(q.qs ?? []).map((qText: string, qi: number) => <li key={qi}>{qText}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )
    }

    if (analysis.type === 'atsAudit') {
      const d = analysis.data
      const scoreLabels: Record<string, string> = {
        formatting: 'Formatting',
        keyword_alignment: 'Keyword Alignment',
        quantified_impact: 'Quantified Impact',
        ats_readability: 'ATS Readability',
        authentic_tone: 'Authentic Tone',
      }
      return (
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-1 gap-1">
            {Object.entries(d.scores ?? {}).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between rounded-md border px-3 py-1.5">
                <span className="text-xs">{scoreLabels[key] ?? key}</span>
                <span className="font-semibold">{String(val)}/5</span>
              </div>
            ))}
          </div>
          {d.strengths?.length ? (
            <div>
              <div className="font-semibold mb-1">Strengths</div>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-xs">{d.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
            </div>
          ) : null}
          {d.fixes?.length ? (
            <div>
              <div className="font-semibold mb-1">Fixes needed</div>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-xs">{d.fixes.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
            </div>
          ) : null}
          {d.keyword_gaps?.length ? (
            <div>
              <div className="font-semibold mb-1">Top keyword gaps</div>
              <div className="flex flex-wrap gap-1">
                {d.keyword_gaps.map((k: string, i: number) => <span key={i} className="rounded-full border px-2 py-0.5 text-xs">{k}</span>)}
              </div>
            </div>
          ) : null}
          {d.next_steps?.length ? (
            <div>
              <div className="font-semibold mb-1">Next steps</div>
              <ol className="list-decimal pl-5 space-y-1 text-muted-foreground text-xs">{d.next_steps.map((s: string, i: number) => <li key={i}>{s}</li>)}</ol>
            </div>
          ) : null}
        </div>
      )
    }

    if (analysis.type === 'atsKeywords') {
      const d = analysis.data
      return (
        <div className="space-y-3 text-sm">
          <div className="text-muted-foreground text-xs">Include ~60% of these in your resume where accurate.</div>
          <div className="flex flex-wrap gap-1.5">
            {(d.keywords ?? []).map((k: string, i: number) => (
              <span key={i} className="rounded-md border bg-muted/40 px-2 py-1 text-xs font-medium">{k}</span>
            ))}
          </div>
        </div>
      )
    }

    if (analysis.type === 'taskAudit') {
      const d = analysis.data
      const tasks = (d.bullets ?? []).filter((b: any) => b.type === 'task')
      const accomplishments = (d.bullets ?? []).filter((b: any) => b.type === 'accomplishment')
      return (
        <div className="space-y-4 text-sm">
          {tasks.length ? (
            <div>
              <div className="font-semibold mb-2">Task-like bullets ({tasks.length})</div>
              <div className="space-y-2">
                {tasks.map((b: any, i: number) => (
                  <div key={i} className="rounded-md border p-3" style={{ borderColor: 'color-mix(in oklch, var(--destructive) 40%, var(--border))', backgroundColor: 'color-mix(in oklch, var(--destructive) 5%, transparent)' }}>
                    <div className="text-xs">{b.text}</div>
                    {b.questions?.length ? (
                      <ul className="mt-2 list-disc pl-4 text-xs text-muted-foreground space-y-0.5">
                        {b.questions.map((q: string, qi: number) => <li key={qi}>{q}</li>)}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {accomplishments.length ? (
            <div>
              <div className="font-semibold mb-2">Accomplishment bullets ({accomplishments.length})</div>
              <div className="space-y-1">
                {accomplishments.map((b: any, i: number) => (
                  <div key={i} className="rounded-md border p-2 text-xs text-muted-foreground" style={{ borderColor: 'color-mix(in oklch, var(--chart-2) 40%, var(--border))', backgroundColor: 'color-mix(in oklch, var(--chart-2) 8%, transparent)' }}>
                    {b.text}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )
    }

    if (analysis.type === 'gapAnalysis') {
      const d = analysis.data
      return (
        <div className="space-y-4 text-sm">
          {d.gaps?.length ? (
            <div>
              <div className="font-semibold mb-2">Gaps</div>
              <div className="space-y-2">
                {(d.gaps ?? []).map((g: any, i: number) => (
                  <div key={i} className="rounded-md border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-xs">{g.requirement}</div>
                      <span className="shrink-0 rounded-full border px-2 py-0.5 text-[10px]" style={{ color: g.severity === 'missing' ? 'var(--destructive)' : 'var(--muted-foreground)', borderColor: g.severity === 'missing' ? 'color-mix(in oklch, var(--destructive) 50%, var(--border))' : 'var(--border)' }}>
                        {g.severity}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{g.note}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {d.grad_activities?.length ? (
            <div>
              <div className="font-semibold mb-2">How to address (grad activities)</div>
              <div className="space-y-2">
                {(d.grad_activities ?? []).map((a: any, i: number) => (
                  <div key={i} className="rounded-md border p-2 text-xs">
                    <div className="font-medium">{a.gap}</div>
                    <div className="mt-0.5 text-muted-foreground">{a.activity}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )
    }

    if (analysis.type === 'howDev') {
      const d = analysis.data
      return (
        <div className="space-y-3 text-sm">
          <div className="text-xs text-muted-foreground">{d.bullets?.length ?? 0} bullet(s) lack clear methodology or approach.</div>
          {(d.bullets ?? []).map((b: any, i: number) => (
            <div key={i} className="rounded-md border p-3">
              <div className="text-xs">{b.text}</div>
              <div className="mt-1 text-[10px] text-muted-foreground italic">{b.issue}</div>
              {b.questions?.length ? (
                <ul className="mt-2 list-disc pl-4 text-xs text-muted-foreground space-y-0.5">
                  {b.questions.map((q: string, qi: number) => <li key={qi}>{q}</li>)}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      )
    }

    return null
  }

  return (
    <>
    <main className="mx-auto grid grid-cols-1 gap-4 px-6 py-6 md:grid-cols-2 xl:max-w-[90vw] xl:grid-cols-7 2xl:max-w-[75vw]">
      <div className="space-y-4 xl:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Job description</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              className="field-sizing-fixed h-40 resize-none overflow-y-auto"
              value={jobDescription}
              onChange={(e) => {
                setJobDescription(e.target.value)
                setFit(null)
              }}
              placeholder="Paste the job description here…"
            />

            <div className="mt-3">
              <Button
                className="w-full py-5 bg-gradient-to-r from-[#40c9ff] to-[#e81cff] flex flex-row-reverse items-center justify-center text-white"
                disabled={!!busy || !jobDescription.trim()}
                onClick={() => runAction('fit')}
              >
                <Sparkles className="mr-2 size-4" />
                {busy === 'fit' ? 'Checking fit…' : 'Check fit'}
              </Button>
              {!jobDescription.trim() ? (
                <div className="mt-2 text-xs text-muted-foreground">Add a job description to enable fit checking.</div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Choose a resume</CardTitle>
          </CardHeader>
          <CardContent>
            {resumes.length ? (
              <div className="grid grid-cols-2 gap-2">
                {resumes.map((r) => (
                  <label key={r.id} className="flex min-w-0 items-center gap-2 text-sm">
                    <input type="radio" name="resume" checked={selectedId === r.id} onChange={() => selectResume(r.id)} />
                    <span className="min-w-0 truncate">{r.title}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No resumes yet.</div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" disabled={!!busy} onClick={saveAsNew}>
            <Save className="mr-1 size-4 text-foreground" />
            Save
          </Button>
          <Button variant="default" disabled={!!busy} onClick={downloadResume}>
            <Download className="mr-1 size-4 text-white" />
            Download
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Tools</CardTitle>
          </CardHeader>
          <TooltipProvider delayDuration={200}>
          <CardContent className="flex flex-col gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Resume Actions</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={!!busy || !jobDescription.trim()}
                onClick={() => runAction('adjust')}
                className="flex flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left text-sm disabled:opacity-50 hover:bg-muted/50 transition-colors"
              >
                <div className="flex w-full items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Sparkles className="size-3" />
                    {busy === 'adjust' ? 'Adjusting…' : 'Adjust Resume'}
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span role="button" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-foreground">
                        <Info className="size-3" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="right">Aggressively rewrites your bullets to maximise JD fit — fabrication is allowed within your existing role and project scope. No invented employers, titles, or exact metrics.</TooltipContent>
                  </Tooltip>
                </div>
                <div className="text-[10px] text-muted-foreground">Tailored for the JD</div>
              </button>
              <button
                type="button"
                disabled={!!busy || !jobDescription.trim()}
                onClick={() => runAction('optimize')}
                className="flex flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left text-sm disabled:opacity-50 hover:bg-muted/50 transition-colors"
              >
                <div className="flex w-full items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Sparkles className="size-3" />
                    {busy === 'optimize' ? 'Optimizing…' : 'Optimize Resume'}
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span role="button" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-foreground">
                        <Info className="size-3" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="right">Rephrase-only pass: surfaces your existing keywords, improves ATS readability, and strengthens action verbs. Zero new facts added.</TooltipContent>
                  </Tooltip>
                </div>
                <div className="text-[10px] text-muted-foreground">ATS + keyword pass</div>
              </button>
              <button
                type="button"
                disabled={!!busy || !jobDescription.trim()}
                onClick={() => runAction('addProjects')}
                className="flex flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left text-sm disabled:opacity-50 hover:bg-muted/50 transition-colors"
              >
                <div className="flex w-full items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <AlertTriangle className="size-3 text-amber-500" />
                    {busy === 'addProjects' ? 'Generating…' : 'Add AI Gen Projects'}
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span role="button" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-foreground">
                        <Info className="size-3" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="right">Replaces your weakest or least-relevant project with a new fabricated one that's a strong JD fit — using your existing tech stack as a realistic basis.</TooltipContent>
                  </Tooltip>
                </div>
                <div className="text-[10px] text-muted-foreground">Replace weakest project</div>
              </button>
            </div>
            <div className="border-t pt-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Analysis</p>
              <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!!busy || !jobDescription.trim()}
              onClick={() => runAnalysis('alignment')}
              className="flex flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left text-sm disabled:opacity-50 hover:bg-muted/50 transition-colors"
            >
              <div className="flex w-full items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <Target className="size-3" />
                  {busy === 'alignment' ? 'Analyzing…' : 'Alignment'}
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span role="button" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-foreground">
                      <Info className="size-3" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right">Scores how well your resume language, skills, and experience align with the job description.</TooltipContent>
                </Tooltip>
              </div>
              <div className="text-[10px] text-muted-foreground">JD vs resume gaps</div>
            </button>
            <button
              type="button"
              disabled={!!busy || !jobDescription.trim()}
              onClick={() => runAnalysis('atsAudit')}
              className="flex flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left text-sm disabled:opacity-50 hover:bg-muted/50 transition-colors"
            >
              <div className="flex w-full items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <ScanSearch className="size-3" />
                  {busy === 'atsAudit' ? 'Auditing…' : 'ATS Audit'}
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span role="button" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-foreground">
                      <Info className="size-3" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right">Simulates how an ATS parses your resume — flags formatting issues, missing keywords, and structure problems that cause auto-rejection.</TooltipContent>
                </Tooltip>
              </div>
              <div className="text-[10px] text-muted-foreground">Score &amp; fixes</div>
            </button>
            <button
              type="button"
              disabled={!!busy || !jobDescription.trim()}
              onClick={() => runAnalysis('atsKeywords')}
              className="flex flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left text-sm disabled:opacity-50 hover:bg-muted/50 transition-colors"
            >
              <div className="flex w-full items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <Hash className="size-3" />
                  {busy === 'atsKeywords' ? 'Extracting…' : 'Keywords'}
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span role="button" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-foreground">
                      <Info className="size-3" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right">Extracts the top 20 high-value keywords from the job description, ranked by importance — so you know exactly which terms to add to your resume.</TooltipContent>
                </Tooltip>
              </div>
              <div className="text-[10px] text-muted-foreground">Top 20 from JD</div>
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={() => runAnalysis('taskAudit')}
              className="flex flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left text-sm disabled:opacity-50 hover:bg-muted/50 transition-colors"
            >
              <div className="flex w-full items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <ListChecks className="size-3" />
                  {busy === 'taskAudit' ? 'Auditing…' : 'Task audit'}
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span role="button" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-foreground">
                      <Info className="size-3" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right">Reviews your bullet points and flags ones that only describe tasks ("managed a team") instead of accomplishments ("cut onboarding time by 40%").</TooltipContent>
                </Tooltip>
              </div>
              <div className="text-[10px] text-muted-foreground">Tasks vs accomplishments</div>
            </button>
            <button
              type="button"
              disabled={!!busy || !jobDescription.trim()}
              onClick={() => runAnalysis('gapAnalysis')}
              className="flex flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left text-sm disabled:opacity-50 hover:bg-muted/50 transition-colors"
            >
              <div className="flex w-full items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <AlertCircle className="size-3" />
                  {busy === 'gapAnalysis' ? 'Analyzing…' : 'Gap analysis'}
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span role="button" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-foreground">
                      <Info className="size-3" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right">Identifies requirements in the job description that are missing or underrepresented in your resume, with suggestions on how to address each gap.</TooltipContent>
                </Tooltip>
              </div>
              <div className="text-[10px] text-muted-foreground">Missing requirements</div>
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={() => runAnalysis('howDev')}
              className="flex flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left text-sm disabled:opacity-50 hover:bg-muted/50 transition-colors"
            >
              <div className="flex w-full items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <Wrench className="size-3" />
                  {busy === 'howDev' ? 'Analyzing…' : 'HOW dev'}
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span role="button" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-foreground">
                      <Info className="size-3" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right">Analyzes your bullet points and suggests concrete ways to reframe them — focusing on how you did things, not just what you did.</TooltipContent>
                </Tooltip>
              </div>
              <div className="text-[10px] text-muted-foreground">Strengthen approach</div>
            </button>
          </div>
          </div>
          </CardContent>
          </TooltipProvider>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">PDF sections</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {sectionEye('header', 'Header')}
            {sectionEye('summary', 'Summary')}
            {sectionEye('education', 'Education')}
            {sectionEye('workExperience', 'Work')}
            {sectionEye('projects', 'Projects')}
            {sectionEye('skills', 'Skills')}
            {sectionEye('certificates', 'Certificates')}
          </CardContent>
        </Card>

        {meta ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">AI notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="font-medium">Changes</div>
                {meta.bulletChanges?.length ? (
                  <Accordion type="multiple" className="mt-2 w-full">
                    {meta.bulletChanges.map((c) => (
                      <AccordionItem key={c.key} value={c.key} className="mb-2 rounded-md border px-2">
                        <AccordionTrigger className="py-3 hover:no-underline">
                          <div className="min-w-0 line-clamp-2 text-sm font-medium">
                            {c.section === 'work' ? 'Work' : 'Projects'} • {c.itemLabel} • Bullet {c.bulletIndex + 1}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-0">
                          <div className="space-y-2 px-2 pb-2">
                            <div className="rounded-md border p-2" style={bulletDiffStyle('before')}>
                              <div className="text-xs font-medium">Before</div>
                              <div className="mt-1 whitespace-pre-wrap break-words text-xs text-muted-foreground">{c.before}</div>
                            </div>
                            <div className="rounded-md border p-2" style={bulletDiffStyle('after')}>
                              <div className="text-xs font-medium">After</div>
                              <div className="mt-1 whitespace-pre-wrap break-words text-xs text-muted-foreground">{c.after}</div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="mt-1 text-xs text-muted-foreground">No bullet text changed.</div>
                )}
              </div>
              {meta.notes?.length ? (
                <div>
                  <div className="font-medium">Notes</div>
                  <ul className="list-disc pl-5 text-muted-foreground">
                    {meta.notes.map((n, idx) => (
                      <li key={idx}>{n}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

      </div>
      <div className="rounded-md bg-white p-2 shadow-md md:h-[85vh] xl:col-span-3">
        {selected ? <ResumePreview key={selected.id} title={title} data={data} visibleSections={visibleSections} /> : <div className="p-6 text-sm text-muted-foreground">Select a resume.</div>}
      </div>

      <div className="xl:col-span-2">
        <Tabs value={rightTab} onValueChange={(v) => setRightTab(v as 'fit' | 'analysis')}>
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-2 shrink-0">
            <TabsList className="w-full">
              <TabsTrigger value="fit" className="flex-1">Job fit</TabsTrigger>
              <TabsTrigger value="analysis" className="flex-1">Analysis</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-4">
            <TabsContent value="fit" className="mt-0 space-y-4">
            {!fit ? (
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MinusCircle className="size-4" />
                  <span>Run “Check fit” to see a match breakdown.</span>
                </div>
                <div className="text-xs">This score focuses on skills first, with a secondary seniority check.</div>
              </div>
            ) : (
              <>
                <div className="rounded-md border bg-muted/30 p-3">
                  <FitGaugeArc percent={fit.overall_percent} />
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div className="rounded-md border bg-background px-2 py-1">
                      <div className="font-medium text-foreground">Must</div>
                      <div className='text-lg font-semibold text-black'>{fit.must_percent}%</div>
                    </div>
                    <div className="rounded-md border bg-background px-2 py-1">
                      <div className="font-medium text-foreground">Nice</div>
                      <div className='text-lg font-semibold text-black'>{fit.nice_percent}%</div>
                    </div>
                    <div className="rounded-md border bg-background px-2 py-1">
                      <div className="font-medium text-foreground">Seniority</div>
                      <div className='text-lg font-semibold text-black'>{fit.seniority.penalty_percent ? `-${fit.seniority.penalty_percent}%` : 'OK'}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground ">{fit.seniority.note}</div>
                </div>

                <Tabs defaultValue="must" className="w-full">
                  <TabsList className="w-full" variant="default">
                    <TabsTrigger className="flex-1" value="must">
                      Must-haves
                    </TabsTrigger>
                    <TabsTrigger className="flex-1" value="nice">
                      Nice-to-haves
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="must" className="mt-2">
                    <Accordion type="multiple" className="w-full">
                      {fit.must_haves.map((r) => (
                        <AccordionItem
                          key={`must-${r.label}`}
                          value={`must-${r.label}`}
                          className="mb-2 rounded-md border px-2"
                          style={requirementStyle(r.status)}
                        >
                          <AccordionTrigger className="py-3 hover:no-underline">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="shrink-0" style={{ color: statusColor(r.status) }}>
                                {statusIcon(r.status)}
                              </span>
                              <div className="truncate text-sm font-medium">{r.label}</div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-0">
                            <div className="space-y-3 px-2">
                              {r.jd_evidence?.length ? (
                                <div>
                                  <div className="text-xs font-medium">From job description</div>
                                  <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
                                    {r.jd_evidence.slice(0, 3).map((e, idx) => (
                                      <li key={idx}>“{e}”</li>
                                    ))}
                                  </ul>
                                </div>
                              ) : null}

                              {r.evidence?.length ? (
                                <div>
                                  <div className="text-xs font-medium">Evidence in your resume</div>
                                  <ul className="mt-1 space-y-2">
                                    {r.evidence.map((ev, idx) => (
                                      <li key={idx} className="rounded-md border bg-background p-2 text-xs">
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="font-medium">{sectionLabel(ev.section)}</div>
                                          <div className="text-muted-foreground">Similarity {Math.round((ev.similarity ?? 0) * 100)}%</div>
                                        </div>
                                        <div className="mt-1 text-muted-foreground">{ev.text}</div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : (
                                <div className="text-xs text-muted-foreground">No evidence found in the current resume.</div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </TabsContent>

                  <TabsContent value="nice" className="mt-2">
                    <Accordion type="multiple" className="w-full">
                      {fit.nice_to_haves.map((r) => (
                        <AccordionItem
                          key={`nice-${r.label}`}
                          value={`nice-${r.label}`}
                          className="mb-2 rounded-md border px-2"
                          style={requirementStyle(r.status)}
                        >
                          <AccordionTrigger className="py-3 hover:no-underline">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="shrink-0" style={{ color: statusColor(r.status) }}>
                                {statusIcon(r.status)}
                              </span>
                              <div className="truncate text-sm font-medium">{r.label}</div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-0">
                            <div className="space-y-3 px-2">
                              {r.jd_evidence?.length ? (
                                <div>
                                  <div className="text-xs font-medium">From job description</div>
                                  <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
                                    {r.jd_evidence.slice(0, 3).map((e, idx) => (
                                      <li key={idx}>“{e}”</li>
                                    ))}
                                  </ul>
                                </div>
                              ) : null}

                              {r.evidence?.length ? (
                                <div>
                                  <div className="text-xs font-medium">Evidence in your resume</div>
                                  <ul className="mt-1 space-y-2">
                                    {r.evidence.map((ev, idx) => (
                                      <li key={idx} className="rounded-md border bg-background p-2 text-xs">
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="font-medium">{sectionLabel(ev.section)}</div>
                                          <div className="text-muted-foreground">Similarity {Math.round((ev.similarity ?? 0) * 100)}%</div>
                                        </div>
                                        <div className="mt-1 text-muted-foreground">{ev.text}</div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : (
                                <div className="text-xs text-muted-foreground">No evidence found in the current resume.</div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </TabsContent>
                </Tabs>

                {fit.suggestions?.length ? (
                  <div className="rounded-md border bg-background p-3">
                    <div className="text-sm font-medium">How to improve</div>
                    <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                      {fit.suggestions.slice(0, 10).map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            )}
            </TabsContent>
            <TabsContent value="analysis" className="mt-0 space-y-4">
              {renderAnalysis()}
            </TabsContent>
          </CardContent>
        </Card>
        </Tabs>
      </div>
    </main>

    {coverLetterOpen ? (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) setCoverLetterOpen(false)
        }}
      >
        <div className="w-full max-w-3xl">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-base">Cover letter</CardTitle>
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" variant="outline" onClick={downloadCoverLetter} disabled={!coverLetter.trim()}>
                  Download
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setCoverLetterOpen(false)}>
                  <XCircle className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                className="h-[55vh] resize-none"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder={busy === 'coverLetter' ? 'Writing…' : 'Generate a cover letter to see it here…'}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    ) : null}
    </>
  )
}
