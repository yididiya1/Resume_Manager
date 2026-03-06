'use client'

import { useMemo, useEffect, useRef, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { CheckCircle2, ChevronRight, Download, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { ResumeData } from '@/lib/resume/types'
import { GradientSparklesIcon } from '@/components/icons/GradientSparklesIcon'

type ResumeRow = { id: string; title: string; resume_data: ResumeData }
type Highlight = { point: string; why: string }
type MCQuestion = { q: string; options: string[] }
type Step = 'setup' | 'questions' | 'draft'

function StepIndicator({ current }: { current: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: 'setup', label: 'Analyze' },
    { id: 'questions', label: 'Answer' },
    { id: 'draft', label: 'Draft' },
  ]
  const idx = steps.findIndex((s) => s.id === current)

  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => {
        const done = i < idx
        const active = i === idx
        return (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className="flex size-6 items-center justify-center rounded-full text-xs font-semibold"
                style={{
                  background: done || active ? 'var(--primary)' : 'var(--muted)',
                  color: done || active ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                }}
              >
                {done ? <CheckCircle2 className="size-3.5" /> : i + 1}
              </div>
              <span className={`text-[10px] ${active ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="mx-2 mb-[14px] h-px w-8 transition-colors"
                style={{ background: done ? 'var(--primary)' : 'var(--border)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

export function CoverLetterClient({ resumes }: { resumes: ResumeRow[] }) {
  const [selectedId, setSelectedId] = useState(resumes[0]?.id ?? '')
  const selected = useMemo(() => resumes.find((r) => r.id === selectedId) ?? resumes[0], [resumes, selectedId])

  const [jd, setJd] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [step, setStep] = useState<Step>('setup')
  const [busy, setBusy] = useState(false)

  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [selectedHighlights, setSelectedHighlights] = useState<Set<number>>(new Set())
  const [questions, setQuestions] = useState<MCQuestion[]>([])  
  const [answers, setAnswers] = useState<string[]>([])

  const [letter, setLetter] = useState('')

  async function analyze() {
    if (!selected || !jd.trim()) return
    setBusy(true)
    const res = await fetch('/api/ai/adjuster', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'clHighlights', jobDescription: jd, resume_data: selected.resume_data }),
    })
    const body = await res.json().catch(() => null)
    if (!res.ok) { alert(body?.error ?? 'Failed to analyze'); setBusy(false); return }
    const hl: Highlight[] = (body?.highlights ?? []).slice(0, 4)
    const qs: MCQuestion[] = (body?.questions ?? []).slice(0, 4)
    setHighlights(hl)
    setSelectedHighlights(new Set(hl.map((_, i) => i)))
    setQuestions(qs)
    setAnswers(Array(qs.length).fill(''))
    if (body?.company_name && !companyName.trim()) setCompanyName(String(body.company_name))
    setStep('questions')
    setBusy(false)
  }

  async function draftLetter() {
    if (!jd.trim()) return
    setBusy(true)
    const res = await fetch('/api/ai/adjuster', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        action: 'clDraft',
        jobDescription: jd,
        extra: { highlights: highlights.filter((_, i) => selectedHighlights.has(i)), questions: questions.map((q) => q.q), answers },
      }),
    })
    const body = await res.json().catch(() => null)
    if (!res.ok) { alert(body?.error ?? 'Failed to draft'); setBusy(false); return }
    setLetter(String(body?.cover_letter ?? ''))
    setStep('draft')
    setBusy(false)
  }

  async function downloadPdf() {
    const text = letter.trim()
    if (!text) return
    const data = selected?.resume_data
    const { Document, Page, StyleSheet, Text, View, Link } = await import('@react-pdf/renderer')

    const fullName = (data?.header?.fullName ?? '').trim() || 'Your Name'

    // Parse links by type
    const links = data?.header?.links ?? []
    let email = ''
    let phone = ''
    let linkedin = ''
    let github = ''
    const extras: string[] = []

    for (const l of links) {
      const raw = (l?.url ?? '').trim()
      if (!raw) continue
      if (/^mailto:/i.test(raw)) { email = raw.replace(/^mailto:/i, '').trim(); continue }
      if (/^tel:/i.test(raw)) { phone = raw.replace(/^tel:/i, '').trim(); continue }
      if (raw.includes('@')) { email = raw; continue }
      if (/linkedin\.com/i.test(raw)) { linkedin = raw.replace(/^https?:\/\//i, ''); continue }
      if (/github\.com/i.test(raw)) { github = raw.replace(/^https?:\/\//i, ''); continue }
      const label = (l?.label ?? '').trim()
      extras.push(label || raw.replace(/^https?:\/\//i, ''))
    }

    const company = companyName.trim()

    const styles = StyleSheet.create({
      page: { paddingTop: 48, paddingBottom: 48, paddingHorizontal: 54, fontSize: 11, fontFamily: 'Helvetica', color: '#111827' },
      salutation: { fontSize: 11, marginBottom: 4 },
      companyLine: { fontSize: 11, marginBottom: 18, color: '#374151' },
      paragraph: { fontSize: 11, lineHeight: 1.5, marginBottom: 10 },
      closing: { marginTop: 24, fontSize: 11 },
      sigName: { marginTop: 18, fontSize: 11, fontFamily: 'Helvetica-Bold' },
      sigContact: { marginTop: 4, flexDirection: 'row', flexWrap: 'wrap', fontSize: 9.5 },
      sigContactText: { color: '#4B5563' },
      sigContactLink: { color: '#2563EB', textDecoration: 'underline' },
      sigSep: { color: '#9CA3AF', marginHorizontal: 4 },
    })

    const paragraphs = text.replace(/\r\n/g, '\n').split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean)

    type SigPart = { type: 'text' | 'link'; value: string; href?: string }
    const sigParts: SigPart[] = []
    if (email) sigParts.push({ type: 'text', value: email })
    if (linkedin) sigParts.push({ type: 'link', value: linkedin.replace(/^https?:\/\//i, ''), href: linkedin.startsWith('http') ? linkedin : `https://${linkedin}` })
    if (github) sigParts.push({ type: 'link', value: github.replace(/^https?:\/\//i, ''), href: github.startsWith('http') ? github : `https://${github}` })
    if (phone) sigParts.push({ type: 'text', value: phone })
    extras.forEach((e) => sigParts.push({ type: 'text', value: e }))

    function CoverLetterPdf() {
      return (
        <Document title="Cover Letter">
          <Page size="LETTER" style={styles.page}>
            <Text style={styles.salutation}>Hiring Manager,</Text>
            {company ? <Text style={styles.companyLine}>{company}</Text> : null}
            <View style={{ marginTop: company ? 0 : 18 }}>
              {paragraphs.map((p, i) => <Text key={i} style={styles.paragraph}>{p}</Text>)}
            </View>
            <Text style={styles.closing}>Sincerely,</Text>
            <Text style={styles.sigName}>{fullName}</Text>
            {sigParts.length > 0 && (
              <View style={styles.sigContact}>
                {sigParts.map((part, i) => (
                  <View key={i} style={{ flexDirection: 'row' }}>
                    {i > 0 && <Text style={styles.sigSep}>|</Text>}
                    {part.type === 'link' ? (
                      <Link src={part.href!} style={styles.sigContactLink}>{part.value}</Link>
                    ) : (
                      <Text style={styles.sigContactText}>{part.value}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
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

  function reset() {
    setStep('setup')
    setHighlights([])
    setSelectedHighlights(new Set())
    setQuestions([])
    setAnswers([])
    setLetter('')
    autoDraftRef.current = false
  }

  const canAnalyze = !!selected && jd.trim().length > 0
  const allAnswered = questions.length > 0 && answers.every((a) => a.trim().length > 0) && selectedHighlights.size > 0

  // We track auto-draft with a ref to avoid double calls
  const autoDraftRef = useRef(false)

  useEffect(() => {
    if (allAnswered && step === 'questions' && !busy && !autoDraftRef.current) {
      autoDraftRef.current = true
      draftLetter()
    }
    if (!allAnswered) {
      autoDraftRef.current = false
    }
  }, [allAnswered, step, busy])

  return (
    <main className="mx-auto grid grid-cols-1 gap-4 px-6 py-6 md:grid-cols-2 xl:max-w-[90vw] xl:grid-cols-7 2xl:max-w-[75vw]">
      {/* Left panel */}
      <div className="space-y-4 xl:col-span-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Cover Letter Studio</CardTitle>
              <StepIndicator current={step} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Resume picker */}
            <div>
              <div className="mb-2 text-sm font-medium">Resume</div>
              {resumes.length ? (
                <div className="space-y-1">
                  {resumes.map((r) => (
                    <label key={r.id} className="flex min-w-0 items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="cl-resume"
                        checked={selectedId === r.id}
                        onChange={() => { setSelectedId(r.id); reset() }}
                      />
                      <span className="min-w-0 truncate">{r.title}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No resumes yet. Create one in the Builder.</div>
              )}
            </div>

            {/* JD */}
            <div>
              <div className="mb-2 text-sm font-medium">Job description</div>
              <Textarea
                className="field-sizing-fixed h-40 resize-none overflow-y-auto"
                value={jd}
                onChange={(e) => { setJd(e.target.value); if (step !== 'setup') reset() }}
                placeholder="Paste the job description here…"
              />
            </div>

            {/* Company name (for PDF) */}
            <div>
              <div className="mb-2 text-sm font-medium">Company name <span className="text-muted-foreground font-normal">(for PDF)</span></div>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Corp"
              />
            </div>

            {/* Step 1 CTA */}
            <div className="rounded-md bg-gradient-to-r from-[#40c9ff] to-[#e81cff] p-[1px]">
              <Button
                className="w-full rounded-md border-0 bg-background"
                variant="outline"
                disabled={busy || !canAnalyze}
                onClick={analyze}
              >
                {busy && step === 'setup' ? (
                  <><Loader2 className="mr-2 size-4 animate-spin" />Analyzing…</>
                ) : (
                  <>
                    <span className="bg-gradient-to-r from-[#40c9ff] to-[#e81cff] bg-clip-text text-transparent">
                      {step === 'setup' ? 'Analyze & get questions' : 'Re-analyze'}
                    </span>
                    <GradientSparklesIcon className="ml-1" size={16} />
                  </>
                )}
              </Button>
            </div>

            {!canAnalyze && (
              <div className="text-xs text-muted-foreground">Select a resume and add a job description to continue.</div>
            )}
          </CardContent>
        </Card>

        {/* Q&A section — multiple choice */}
        {step !== 'setup' && questions.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Your motivation</CardTitle>
                {allAnswered && (
                  <span className="text-[10px] text-muted-foreground">
                    {busy ? 'Generating…' : 'All answered ✓'}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {questions.map((q, i) => (
                <div key={i}>
                  <div className="mb-2 text-xs font-medium">{q.q}</div>
                  <div className="space-y-1.5">
                    {q.options.map((opt, oi) => {
                      const selected = answers[i] === opt
                      return (
                        <button
                          key={oi}
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            const next = [...answers]
                            next[i] = opt
                            setAnswers(next)
                          }}
                          className="w-full rounded-md border px-3 py-2 text-left text-xs transition-colors disabled:opacity-60"
                          style={selected ? {
                            borderColor: 'var(--primary)',
                            backgroundColor: 'color-mix(in oklch, var(--primary) 10%, transparent)',
                            color: 'var(--foreground)',
                          } : {
                            borderColor: 'var(--border)',
                            backgroundColor: 'transparent',
                            color: 'var(--muted-foreground)',
                          }}
                        >
                          <span className="font-medium" style={selected ? { color: 'var(--primary)' } : {}}>
                            {String.fromCharCode(65 + oi)}.
                          </span>{' '}{opt}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              {step === 'draft' && !busy && (
                <div className="rounded-md bg-gradient-to-r from-[#40c9ff] to-[#e81cff] p-[1px]">
                  <Button
                    className="w-full rounded-md border-0 bg-background"
                    variant="outline"
                    disabled={busy || !allAnswered}
                    onClick={() => { autoDraftRef.current = false; draftLetter() }}
                  >
                    <span className="bg-gradient-to-r from-[#40c9ff] to-[#e81cff] bg-clip-text text-transparent">Redraft letter</span>
                    <GradientSparklesIcon className="ml-1" size={16} />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right panel */}
      <div className="space-y-4 xl:col-span-5">
        {step === 'setup' && (
          <Card className="h-full">
            <CardContent className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              <div className="space-y-2 text-center">
                <Sparkles className="mx-auto size-8 opacity-20" />
                <div>Select a resume, paste a job description, and click Analyze to start.</div>
              </div>
            </CardContent>
          </Card>
        )}

        {step !== 'setup' && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
            {/* Highlights */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Resume highlights for this role</CardTitle>
                  <span className="text-[10px] text-muted-foreground">{selectedHighlights.size}/{highlights.length} selected</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {highlights.map((h, i) => {
                  const checked = selectedHighlights.has(i)
                  return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setSelectedHighlights((prev) => {
                        const next = new Set(prev)
                        if (next.has(i)) { next.delete(i) } else { next.add(i) }
                        return next
                      })
                    }}
                    className="w-full rounded-md border p-3 text-left transition-colors"
                    style={checked ? {
                      borderColor: 'var(--primary)',
                      backgroundColor: 'color-mix(in oklch, var(--primary) 8%, transparent)',
                    } : {
                      borderColor: 'var(--border)',
                      backgroundColor: 'transparent',
                      opacity: 0.5,
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition-colors"
                        style={checked
                          ? { background: 'var(--primary)', color: 'var(--primary-foreground)' }
                          : { background: 'var(--muted)', color: 'var(--muted-foreground)' }
                        }
                      >
                        {checked ? '✓' : i + 1}
                      </span>
                      <div>
                        <div className="text-xs font-medium">{h.point}</div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">{h.why}</div>
                      </div>
                    </div>
                  </button>
                  )
                })}
              </CardContent>
            </Card>

            {/* Draft or placeholder */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    {step === 'draft' ? 'Cover letter draft' : 'Draft will appear here'}
                  </CardTitle>
                  {step === 'draft' && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{wordCount(letter)} words</span>
                      <Button size="sm" variant="default" onClick={downloadPdf} disabled={!letter.trim()}>
                        <Download className="mr-1 size-3.5" />
                        PDF
                      </Button>
                      <Button size="sm" variant="ghost" onClick={reset} title="Start over">
                        <RefreshCw className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {step === 'draft' ? (
                  <Textarea
                    className="field-sizing-fixed h-[60vh] resize-none overflow-y-auto text-sm"
                    value={letter}
                    onChange={(e) => setLetter(e.target.value)}
                    placeholder="Your cover letter will appear here…"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                    {busy ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        <span>Drafting your letter…</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <ChevronRight className="size-4 opacity-40" />
                        <span>Answer the questions and click "Draft letter"</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  )
}
