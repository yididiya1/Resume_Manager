'use client'

import { useEffect, useMemo, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ResumePreview } from '@/components/resume/ResumePreview'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import type { ResumeData } from '@/lib/resume/types'
import type { ResumePdfSectionKey, ResumePdfVisibleSections } from '@/components/resume/ResumePdfDocument'
import {
  certificateContentSchema,
  contentDisplayTitle,
  contentKindLabel,
  educationContentSchema,
  projectContentSchema,
  skillContentSchema,
  workExperienceContentSchema,
  type ContentKind,
} from '@/lib/content/types'

function uuid() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now())
}

export function BuilderClient({
  resumeId,
  initialTitle,
  initialData,
}: {
  resumeId: string
  initialTitle: string
  initialData: ResumeData
}) {
  const [title, setTitle] = useState(initialTitle)
  const [data, setData] = useState<ResumeData>(initialData)
  const [status, setStatus] = useState<string | null>(null)

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

  function sectionEye(key: ResumePdfSectionKey) {
    const isOn = visibleSections[key] !== false
    return (
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label={isOn ? 'Hide section in PDF' : 'Show section in PDF'}
        onClick={() => toggleSection(key)}
      >
        {isOn ? <EyeIcon className="size-4" /> : <EyeOffIcon className="size-4" />}
      </Button>
    )
  }

  const rightTitle = useMemo(() => title.trim() || 'Untitled Resume', [title])

  function insertFromLibrary(kind: ContentKind, item_data: unknown) {
    if (kind === 'education') {
      const parsed = educationContentSchema.safeParse(item_data)
      if (!parsed.success) return
      const v = parsed.data
      setData((d) => ({
        ...d,
        education: [
          ...d.education,
          {
            id: uuid(),
            degree: v.degree ?? '',
            school: v.school ?? '',
            dates: { start: v.dates?.start ?? '', end: v.dates?.end ?? '' },
            location: v.location ?? '',
            description: v.description,
            link: v.link,
          },
        ],
      }))
      return
    }

    if (kind === 'workExperience') {
      const parsed = workExperienceContentSchema.safeParse(item_data)
      if (!parsed.success) return
      const v = parsed.data
      setData((d) => ({
        ...d,
        workExperience: [
          ...d.workExperience,
          {
            id: uuid(),
            jobTitle: v.jobTitle ?? '',
            employer: v.employer ?? '',
            dates: { start: v.dates?.start ?? '', end: v.dates?.end ?? '' },
            location: v.location ?? '',
            description: v.description,
          },
        ],
      }))
      return
    }

    if (kind === 'projects') {
      const parsed = projectContentSchema.safeParse(item_data)
      if (!parsed.success) return
      const v = parsed.data
      setData((d) => ({
        ...d,
        projects: [
          ...d.projects,
          {
            id: uuid(),
            title: v.title ?? '',
            subtitle: v.subtitle ?? '',
            dates: { start: v.dates?.start ?? '', end: v.dates?.end ?? '' },
            description: v.description,
          },
        ],
      }))
      return
    }

    if (kind === 'skills') {
      const parsed = skillContentSchema.safeParse(item_data)
      if (!parsed.success) return
      const v = parsed.data
      setData((d) => ({
        ...d,
        skills: [
          ...d.skills,
          {
            id: uuid(),
            category: v.category ?? '',
            details: v.details,
            level: v.level,
          },
        ],
      }))
      return
    }

    if (kind === 'certificates') {
      const parsed = certificateContentSchema.safeParse(item_data)
      if (!parsed.success) return
      const v = parsed.data
      setData((d) => ({
        ...d,
        certificates: [
          ...d.certificates,
          {
            id: uuid(),
            title: v.title ?? '',
            details: v.details,
            link: v.link,
          },
        ],
      }))
    }
  }

  function addBlank(kind: ContentKind) {
    if (kind === 'education') {
      setData((d) => ({
        ...d,
        education: [
          ...d.education,
          {
            id: uuid(),
            degree: '',
            school: '',
            dates: { start: '', end: '' },
            location: '',
            description: undefined,
            link: undefined,
          },
        ],
      }))
      return
    }
    if (kind === 'workExperience') {
      setData((d) => ({
        ...d,
        workExperience: [
          ...d.workExperience,
          {
            id: uuid(),
            jobTitle: '',
            employer: '',
            dates: { start: '', end: '' },
            location: '',
            description: undefined,
          },
        ],
      }))
      return
    }
    if (kind === 'projects') {
      setData((d) => ({
        ...d,
        projects: [
          ...d.projects,
          {
            id: uuid(),
            title: '',
            subtitle: '',
            dates: { start: '', end: '' },
            description: undefined,
          },
        ],
      }))
      return
    }
    if (kind === 'skills') {
      setData((d) => ({
        ...d,
        skills: [
          ...d.skills,
          {
            id: uuid(),
            category: '',
            details: undefined,
            level: undefined,
          },
        ],
      }))
      return
    }
    if (kind === 'certificates') {
      setData((d) => ({
        ...d,
        certificates: [
          ...d.certificates,
          {
            id: uuid(),
            title: '',
            details: undefined,
            link: undefined,
          },
        ],
      }))
    }
  }


  useEffect(() => {
    console.log('BuilderClient mounted with resumeId:', resumeId)
    console.log('Initial title:', initialTitle)
    console.log('Initial data:', initialData)
    console.log('Parsed initial data:', data)
  }, [])

  async function save() {
    setStatus('Saving…')
    const res = await fetch(`/api/resumes/${resumeId}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title: rightTitle, resume_data: data }),
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null
      setStatus(body?.error ?? 'Save failed')
      return
    }
    setStatus('Saved')
    setTimeout(() => setStatus(null), 1200)
  }

  async function download() {
    setStatus('Preparing PDF…')
    const { ResumePdfDocument } = await import('@/components/resume/ResumePdfDocument')
    const blob = await pdf(<ResumePdfDocument title={rightTitle} data={data} visibleSections={visibleSections} />).toBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${rightTitle}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    setStatus(null)
  }

  return (
    <main className="grid grid-cols-1 gap-0 md:grid-cols-2  xl:max-w-[75vw] 2xl:max-w-[60vw] mx-auto">
      <div className="px-6 py-6">
        <div className="flex items-end justify-between gap-3">
          <div className="flex-1">
            <div className="text-sm text-muted-foreground">Resume title</div>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Untitled Resume" className='bg-background' />
          </div>
          <div className="flex items-end gap-2">
            <Button variant="outline" onClick={download}>
              Download
            </Button>
            <Button onClick={save}>Save</Button>
          </div>
        </div>
        {status ? <div className="mt-2 text-sm text-muted-foreground">{status}</div> : null}

        <div className="mt-6 mb-6">
          <Accordion type="multiple" defaultValue={['header', 'summary']} className="w-full space-y-2 ">
            <AccordionItem value="header" className="rounded-md border bg-background">
              <AccordionTrigger className="px-4" rightSlot={sectionEye('header')}>
                Header
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Full name</div>
                    <Input
                      value={data.header?.fullName ?? ''}
                      onChange={(e) =>
                        setData((d) => ({
                          ...d,
                          header: { ...(d.header ?? { fullName: '', links: [] }), fullName: e.target.value },
                        }))
                      }
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm text-muted-foreground">Links</div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setData((d) => ({
                            ...d,
                            header: {
                              ...(d.header ?? { fullName: '', links: [] }),
                              links: [...(d.header?.links ?? []), { id: uuid(), label: '', url: '' }],
                            },
                          }))
                        }
                      >
                        Add link
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {(data.header?.links ?? []).map((l) => (
                        <div key={l.id} className="flex items-start gap-2">
                          <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                            <Input
                              value={l.label ?? ''}
                              onChange={(ev) =>
                                setData((d) => ({
                                  ...d,
                                  header: {
                                    ...(d.header ?? { fullName: '', links: [] }),
                                    links: (d.header?.links ?? []).map((x) =>
                                      x.id === l.id ? { ...x, label: ev.target.value } : x,
                                    ),
                                  },
                                }))
                              }
                              placeholder="Text (e.g., Phone, Location, LinkedIn)"
                            />
                            <Input
                              value={l.url ?? ''}
                              onChange={(ev) =>
                                setData((d) => ({
                                  ...d,
                                  header: {
                                    ...(d.header ?? { fullName: '', links: [] }),
                                    links: (d.header?.links ?? []).map((x) =>
                                      x.id === l.id ? { ...x, url: ev.target.value } : x,
                                    ),
                                  },
                                }))
                              }
                              placeholder="URL (optional)"
                            />
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              setData((d) => ({
                                ...d,
                                header: {
                                  ...(d.header ?? { fullName: '', links: [] }),
                                  links: (d.header?.links ?? []).filter((x) => x.id !== l.id),
                                },
                              }))
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      ))}

                      {!(data.header?.links ?? []).length ? (
                        <div className="text-sm text-muted-foreground">No links yet.</div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="summary" className="rounded-md border bg-background">
              <AccordionTrigger className="px-4" rightSlot={sectionEye('summary')}>
                Summary
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <RichTextEditor value={data.summary} onChange={(doc) => setData((d) => ({ ...d, summary: doc }))} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="education" className="rounded-md border bg-background">
              <AccordionTrigger className="px-4" rightSlot={sectionEye('education')}>
                Education
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="flex items-center justify-between gap-3">
                  <LibraryInsert kind="education" onInsert={insertFromLibrary} />
                  <Button type="button" size="sm" variant="outline" onClick={() => addBlank('education')}>
                    Add
                  </Button>
                </div>
                <div className="mt-3 space-y-4">
                  {data.education.map((e) => (
                    <div key={e.id} className="rounded-md border p-3 space-y-2">
                      <div className="flex justify-between gap-2">
                        <div className="flex-1 space-y-2">
                          <Input
                            value={e.degree}
                            onChange={(ev) =>
                              setData((d) => ({
                                ...d,
                                education: d.education.map((x) => (x.id === e.id ? { ...x, degree: ev.target.value } : x)),
                              }))
                            }
                            placeholder="Degree (e.g., Masters in Data Science)"
                          />
                          <Input
                            value={e.school}
                            onChange={(ev) =>
                              setData((d) => ({
                                ...d,
                                education: d.education.map((x) => (x.id === e.id ? { ...x, school: ev.target.value } : x)),
                              }))
                            }
                            placeholder="School"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={e.dates.start ?? ''}
                              onChange={(ev) =>
                                setData((d) => ({
                                  ...d,
                                  education: d.education.map((x) =>
                                    x.id === e.id ? { ...x, dates: { ...x.dates, start: ev.target.value } } : x,
                                  ),
                                }))
                              }
                              placeholder="Start (MM/YYYY)"
                            />
                            <Input
                              value={e.dates.end ?? ''}
                              onChange={(ev) =>
                                setData((d) => ({
                                  ...d,
                                  education: d.education.map((x) =>
                                    x.id === e.id ? { ...x, dates: { ...x.dates, end: ev.target.value } } : x,
                                  ),
                                }))
                              }
                              placeholder="End (MM/YYYY or Present)"
                            />
                          </div>
                          <Input
                            value={e.location ?? ''}
                            onChange={(ev) =>
                              setData((d) => ({
                                ...d,
                                education: d.education.map((x) => (x.id === e.id ? { ...x, location: ev.target.value } : x)),
                              }))
                            }
                            placeholder="Location"
                          />
                          <Input
                            value={e.link ?? ''}
                            onChange={(ev) =>
                              setData((d) => ({
                                ...d,
                                education: d.education.map((x) => (x.id === e.id ? { ...x, link: ev.target.value } : x)),
                              }))
                            }
                            placeholder="Optional link"
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => setData((d) => ({ ...d, education: d.education.filter((x) => x.id !== e.id) }))}
                        >
                          Remove
                        </Button>
                      </div>
                      <RichTextEditor
                        value={e.description}
                        onChange={(doc) =>
                          setData((d) => ({
                            ...d,
                            education: d.education.map((x) => (x.id === e.id ? { ...x, description: doc } : x)),
                          }))
                        }
                      />
                    </div>
                  ))}
                  {!data.education.length ? <div className="text-sm text-muted-foreground">No education entries.</div> : null}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="work" className="rounded-md border bg-background">
              <AccordionTrigger className="px-4" rightSlot={sectionEye('workExperience')}>
                Work experience
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="flex items-center justify-between gap-3">
                  <LibraryInsert kind="workExperience" onInsert={insertFromLibrary} />
                  <Button type="button" size="sm" variant="outline" onClick={() => addBlank('workExperience')}>
                    Add
                  </Button>
                </div>
                <div className="mt-3 space-y-4">
                  {data.workExperience.map((w) => (
                    <div key={w.id} className="rounded-md border p-3 space-y-2">
                      <div className="flex justify-between gap-2">
                        <div className="flex-1 space-y-2">
                          <Input
                            value={w.jobTitle}
                            onChange={(ev) =>
                              setData((d) => ({
                                ...d,
                                workExperience: d.workExperience.map((x) => (x.id === w.id ? { ...x, jobTitle: ev.target.value } : x)),
                              }))
                            }
                            placeholder="Job title"
                          />
                          <Input
                            value={w.employer}
                            onChange={(ev) =>
                              setData((d) => ({
                                ...d,
                                workExperience: d.workExperience.map((x) => (x.id === w.id ? { ...x, employer: ev.target.value } : x)),
                              }))
                            }
                            placeholder="Employer"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={w.dates.start ?? ''}
                              onChange={(ev) =>
                                setData((d) => ({
                                  ...d,
                                  workExperience: d.workExperience.map((x) =>
                                    x.id === w.id ? { ...x, dates: { ...x.dates, start: ev.target.value } } : x,
                                  ),
                                }))
                              }
                              placeholder="Start (MM/YYYY)"
                            />
                            <Input
                              value={w.dates.end ?? ''}
                              onChange={(ev) =>
                                setData((d) => ({
                                  ...d,
                                  workExperience: d.workExperience.map((x) =>
                                    x.id === w.id ? { ...x, dates: { ...x.dates, end: ev.target.value } } : x,
                                  ),
                                }))
                              }
                              placeholder="End (MM/YYYY or Present)"
                            />
                          </div>
                          <Input
                            value={w.location ?? ''}
                            onChange={(ev) =>
                              setData((d) => ({
                                ...d,
                                workExperience: d.workExperience.map((x) => (x.id === w.id ? { ...x, location: ev.target.value } : x)),
                              }))
                            }
                            placeholder="Location"
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => setData((d) => ({ ...d, workExperience: d.workExperience.filter((x) => x.id !== w.id) }))}
                        >
                          Remove
                        </Button>
                      </div>
                      <RichTextEditor
                        value={w.description}
                        onChange={(doc) =>
                          setData((d) => ({
                            ...d,
                            workExperience: d.workExperience.map((x) => (x.id === w.id ? { ...x, description: doc } : x)),
                          }))
                        }
                      />
                    </div>
                  ))}
                  {!data.workExperience.length ? <div className="text-sm text-muted-foreground">No work experience entries.</div> : null}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="projects" className="rounded-md border bg-background">
              <AccordionTrigger className="px-4" rightSlot={sectionEye('projects')}>
                Projects
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="flex items-center justify-between gap-3">
                  <LibraryInsert kind="projects" onInsert={insertFromLibrary} />
                  <Button type="button" size="sm" variant="outline" onClick={() => addBlank('projects')}>
                    Add
                  </Button>
                </div>
                <div className="mt-3 space-y-4">
                  {data.projects.map((p) => (
                    <div key={p.id} className="rounded-md border p-3 space-y-2">
                      <div className="flex justify-between gap-2">
                        <div className="flex-1 space-y-2">
                          <Input
                            value={p.title}
                            onChange={(ev) =>
                              setData((d) => ({
                                ...d,
                                projects: d.projects.map((x) => (x.id === p.id ? { ...x, title: ev.target.value } : x)),
                              }))
                            }
                            placeholder="Project title (you can include tech inline)"
                          />
                          <Input
                            value={p.subtitle ?? ''}
                            onChange={(ev) =>
                              setData((d) => ({
                                ...d,
                                projects: d.projects.map((x) => (x.id === p.id ? { ...x, subtitle: ev.target.value } : x)),
                              }))
                            }
                            placeholder="Subtitle (optional)"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={p.dates.start ?? ''}
                              onChange={(ev) =>
                                setData((d) => ({
                                  ...d,
                                  projects: d.projects.map((x) =>
                                    x.id === p.id ? { ...x, dates: { ...x.dates, start: ev.target.value } } : x,
                                  ),
                                }))
                              }
                              placeholder="Start (MM/YYYY)"
                            />
                            <Input
                              value={p.dates.end ?? ''}
                              onChange={(ev) =>
                                setData((d) => ({
                                  ...d,
                                  projects: d.projects.map((x) =>
                                    x.id === p.id ? { ...x, dates: { ...x.dates, end: ev.target.value } } : x,
                                  ),
                                }))
                              }
                              placeholder="End (MM/YYYY or Present)"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => setData((d) => ({ ...d, projects: d.projects.filter((x) => x.id !== p.id) }))}
                        >
                          Remove
                        </Button>
                      </div>
                      <RichTextEditor
                        value={p.description}
                        onChange={(doc) =>
                          setData((d) => ({
                            ...d,
                            projects: d.projects.map((x) => (x.id === p.id ? { ...x, description: doc } : x)),
                          }))
                        }
                      />
                    </div>
                  ))}
                  {!data.projects.length ? <div className="text-sm text-muted-foreground">No projects yet.</div> : null}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="skills" className="rounded-md border bg-background">
              <AccordionTrigger className="px-4" rightSlot={sectionEye('skills')}>
                Skills
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="flex items-center justify-between gap-3">
                  <LibraryInsert kind="skills" onInsert={insertFromLibrary} />
                  <Button type="button" size="sm" variant="outline" onClick={() => addBlank('skills')}>
                    Add
                  </Button>
                </div>
                <div className="mt-3 space-y-4">
                  {data.skills.map((s) => (
                    <div key={s.id} className="rounded-md border p-3 space-y-2">
                      <div className="flex justify-between gap-2">
                        <div className="flex-1 space-y-2">
                          <Input
                            value={s.category}
                            onChange={(ev) =>
                              setData((d) => ({
                                ...d,
                                skills: d.skills.map((x) => (x.id === s.id ? { ...x, category: ev.target.value } : x)),
                              }))
                            }
                            placeholder="Skill category (e.g., Programming Languages)"
                          />
                          <Select
                            value={s.level ?? 'intermediate'}
                            onValueChange={(v) =>
                              setData((d) => ({
                                ...d,
                                skills: d.skills.map((x) => (x.id === s.id ? { ...x, level: v as never } : x)),
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => setData((d) => ({ ...d, skills: d.skills.filter((x) => x.id !== s.id) }))}
                        >
                          Remove
                        </Button>
                      </div>
                      <RichTextEditor
                        value={s.details}
                        onChange={(doc) =>
                          setData((d) => ({
                            ...d,
                            skills: d.skills.map((x) => (x.id === s.id ? { ...x, details: doc } : x)),
                          }))
                        }
                      />
                    </div>
                  ))}
                  {!data.skills.length ? <div className="text-sm text-muted-foreground">No skills yet.</div> : null}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="certs" className="rounded-md border  bg-background ">
              <AccordionTrigger className="px-4" rightSlot={sectionEye('certificates')}>
                Certificates
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="flex items-center justify-between gap-3">
                  <LibraryInsert kind="certificates" onInsert={insertFromLibrary} />
                  <Button type="button" size="sm" variant="outline" onClick={() => addBlank('certificates')}>
                    Add
                  </Button>
                </div>
                <div className="mt-3 space-y-4">
                  {data.certificates.map((c) => (
                    <div key={c.id} className="rounded-md border p-3 space-y-2">
                      <div className="flex justify-between gap-2">
                        <div className="flex-1 space-y-2">
                          <Input
                            value={c.title}
                            onChange={(ev) =>
                              setData((d) => ({
                                ...d,
                                certificates: d.certificates.map((x) => (x.id === c.id ? { ...x, title: ev.target.value } : x)),
                              }))
                            }
                            placeholder="Certificate title"
                          />
                          <Input
                            value={c.link ?? ''}
                            onChange={(ev) =>
                              setData((d) => ({
                                ...d,
                                certificates: d.certificates.map((x) => (x.id === c.id ? { ...x, link: ev.target.value } : x)),
                              }))
                            }
                            placeholder="Optional link"
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => setData((d) => ({ ...d, certificates: d.certificates.filter((x) => x.id !== c.id) }))}
                        >
                          Remove
                        </Button>
                      </div>
                      <RichTextEditor
                        value={c.details}
                        onChange={(doc) =>
                          setData((d) => ({
                            ...d,
                            certificates: d.certificates.map((x) => (x.id === c.id ? { ...x, details: doc } : x)),
                          }))
                        }
                      />
                    </div>
                  ))}
                  {!data.certificates.length ? <div className="text-sm text-muted-foreground">No certificates yet.</div> : null}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      <div className="m-6 p-2 bg-white rounded-md shadow-md h-[82vh] md:sticky md:top-6">
        <ResumePreview title={rightTitle} data={data} visibleSections={visibleSections} />
      </div>
    </main>
  )
}

function LibraryInsert({
  kind,
  onInsert,
}: {
  kind: ContentKind
  onInsert: (kind: ContentKind, item_data: unknown) => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<Array<{ id: string; kind: ContentKind; item_data: unknown }>>([])
  const [selectedId, setSelectedId] = useState<string>('')

  async function load() {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/content-items?kind=${encodeURIComponent(kind)}`, {
        credentials: 'include',
      })
      if (!res.ok) {
        setItems([])
        return
      }
      const body = (await res.json().catch(() => null)) as { items?: Array<{ id: string; kind: ContentKind; item_data: unknown }> } | null
      const nextItems = body?.items ?? []
      setItems(nextItems)
      if (nextItems.length && !selectedId) {
        setSelectedId(nextItems[0].id)
      }
    } finally {
      setLoading(false)
    }
  }

  function toggle() {
    setOpen((o) => {
      const next = !o
      if (next && !items.length) {
        void load()
      }
      return next
    })
  }

  const selected = items.find((x) => x.id === selectedId)

  return (
    <div className="flex items-center gap-2">
      <Button type="button" size="sm" variant="ghost" onClick={toggle}>
        Add from library
      </Button>
      {open ? (
        <div className="flex items-center gap-2">
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="h-8 w-[260px]">
              <SelectValue placeholder={loading ? 'Loading…' : `Select ${contentKindLabel(kind).toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {items.map((it) => (
                <SelectItem key={it.id} value={it.id}>
                  {contentDisplayTitle(it.kind, it.item_data)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!selected}
            onClick={() => {
              if (!selected) return
              onInsert(kind, selected.item_data)
            }}
          >
            Insert
          </Button>
        </div>
      ) : null}
    </div>
  )
}
