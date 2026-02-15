'use client'

import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { pdf } from '@react-pdf/renderer'
import { CheckCircle2, EyeIcon, EyeOffIcon, HelpCircle, MinusCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ResumePreview } from '@/components/resume/ResumePreview'
import type { ResumeData } from '@/lib/resume/types'
import type { ResumePdfSectionKey, ResumePdfVisibleSections } from '@/components/resume/ResumePdfDocument'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { FitGauge } from '@/components/fit/FitGauge'

type ResumeRow = { id: string; title: string; resume_data: ResumeData }

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
      backgroundColor: 'color-mix(in oklch, var(--chart-2) 12%, transparent)',
    }
  }
  if (status === 'missing') {
    return {
      borderColor: 'color-mix(in oklch, var(--destructive) 60%, var(--border))',
      backgroundColor: 'color-mix(in oklch, var(--destructive) 10%, transparent)',
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

export function AdjusterClient({ resumes }: { resumes: ResumeRow[] }) {
  const [jobDescription, setJobDescription] = useState('')
  const [selectedId, setSelectedId] = useState(resumes[0]?.id ?? '')
  const selected = useMemo(() => resumes.find((r) => r.id === selectedId) ?? resumes[0], [resumes, selectedId])

  const [adjustedData, setAdjustedData] = useState<ResumeData | null>(selected?.resume_data ?? null)
  const [coverLetter, setCoverLetter] = useState<string>('')
  const [busy, setBusy] = useState<string | null>(null)
  const [meta, setMeta] = useState<{ changes?: string[]; warnings?: string[]; questions?: string[]; notes?: string[] } | null>(null)
  const [fit, setFit] = useState<FitResponse | null>(null)

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
    setMeta(null)
    setFit(null)
    setBusy(null)
  }

  useEffect(() => {
    setAdjustedData(selected?.resume_data ?? null)
    setCoverLetter('')
    setMeta(null)
    setFit(null)
    setBusy(null)
  }, [selectedId])

  const title = selected?.title ?? 'Resume'
  const data = (adjustedData ?? selected?.resume_data) ?? ({} as ResumeData)

  async function runAction(action: 'adjust' | 'optimize' | 'addProjects' | 'coverLetter' | 'fit') {
    if (!selected) return
    setBusy(action)
    setMeta(null)

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

    if (action === 'fit') {
      const nextFit = body?.fit as FitResponse | undefined
      if (nextFit) setFit(nextFit)
      setBusy(null)
      return
    }

    if (action === 'addProjects') {
      const projects = (body?.projects ?? []) as Array<any>
      const next = {
        ...(adjustedData ?? selected.resume_data),
        projects: [
          ...((adjustedData ?? selected.resume_data).projects ?? []),
          ...projects.map((p) => ({
            id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now() + Math.random()),
            title: p.title ?? '',
            subtitle: p.subtitle ?? '',
            dates: { start: p.dates?.start ?? '', end: p.dates?.end ?? '' },
            description: p.description,
          })),
        ],
      } as ResumeData

      setAdjustedData(next)
      setMeta({ notes: body?.meta?.notes ?? [] })
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
      setMeta({
        changes: body?.meta?.changes ?? [],
        warnings: body?.meta?.warnings ?? [],
        questions: body?.meta?.missing_info_questions ?? [],
      })
    }
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

    const styles = StyleSheet.create({
      page: { padding: 36, fontSize: 11, fontFamily: 'Helvetica' },
      title: { fontSize: 14, fontWeight: 700, marginBottom: 12 },
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
            <Text style={styles.title}>Cover Letter</Text>
            <View>
              {paragraphs.map((p, idx) => (
                <Text key={idx} style={styles.paragraph}>
                  {p}
                </Text>
              ))}
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

  return (
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
                className="w-full"
                disabled={!!busy || !jobDescription.trim()}
                onClick={() => runAction('fit')}
              >
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
          <CardContent className="space-y-2">
            {resumes.map((r) => (
              <label key={r.id} className="flex items-center gap-2 text-sm">
                <input type="radio" name="resume" checked={selectedId === r.id} onChange={() => selectResume(r.id)} />
                <span>{r.title}</span>
              </label>
            ))}
            {!resumes.length ? <div className="text-sm text-muted-foreground">No resumes yet.</div> : null}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" disabled={!!busy} onClick={() => runAction('adjust')}>
            {busy === 'adjust' ? 'Adjusting…' : 'Adjust Resume'}
          </Button>
          <Button variant="outline" disabled={!!busy} onClick={() => runAction('addProjects')}>
            {busy === 'addProjects' ? 'Generating…' : 'Add AI Generated Projects'}
          </Button>
          <Button variant="outline" disabled={!!busy} onClick={() => runAction('optimize')}>
            {busy === 'optimize' ? 'Optimizing…' : 'Optimize Resume'}
          </Button>
          <Button variant="outline" disabled={!!busy} onClick={() => runAction('coverLetter')}>
            {busy === 'coverLetter' ? 'Writing…' : 'Generate cover letter'}
          </Button>
          <Button disabled={!!busy} onClick={saveAsNew}>
            Save Resume
          </Button>
          <Button variant="default" disabled={!!busy} onClick={downloadResume}>
            Download Resume
          </Button>
        </div>

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
              {meta.changes?.length ? (
                <div>
                  <div className="font-medium">Changes</div>
                  <ul className="list-disc pl-5 text-muted-foreground">
                    {meta.changes.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {meta.warnings?.length ? (
                <div>
                  <div className="font-medium">Warnings</div>
                  <ul className="list-disc pl-5 text-muted-foreground">
                    {meta.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {meta.questions?.length ? (
                <div>
                  <div className="font-medium">Questions</div>
                  <ul className="list-disc pl-5 text-muted-foreground">
                    {meta.questions.map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-base">Cover letter</CardTitle>
            <Button type="button" size="sm" variant="outline" onClick={downloadCoverLetter} disabled={!coverLetter.trim()}>
              Download
            </Button>
          </CardHeader>
          <CardContent>
            <Textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} placeholder="Generate a cover letter to see it here…" />
          </CardContent>
        </Card>
      </div>
      <div className="rounded-md bg-white p-2 shadow-md md:h-[85vh] xl:col-span-3">
        {selected ? <ResumePreview key={selected.id} title={title} data={data} visibleSections={visibleSections} /> : <div className="p-6 text-sm text-muted-foreground">Select a resume.</div>}
      </div>

      <div className="xl:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-base">Job fit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                      <div>{fit.must_percent}%</div>
                    </div>
                    <div className="rounded-md border bg-background px-2 py-1">
                      <div className="font-medium text-foreground">Nice</div>
                      <div>{fit.nice_percent}%</div>
                    </div>
                    <div className="rounded-md border bg-background px-2 py-1">
                      <div className="font-medium text-foreground">Seniority</div>
                      <div>{fit.seniority.penalty_percent ? `-${fit.seniority.penalty_percent}%` : 'OK'}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">{fit.seniority.note}</div>
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
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
