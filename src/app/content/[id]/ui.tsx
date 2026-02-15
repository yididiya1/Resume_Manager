'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import type { ContentItemData, ContentKind } from '@/lib/content/types'
import {
  certificateContentSchema as certificateSchema,
  customContentSchema as customSchema,
  educationContentSchema as educationSchema,
  projectContentSchema as projectSchema,
  skillContentSchema as skillSchema,
  workExperienceContentSchema as workSchema,
} from '@/lib/content/types'

function asData<T>(schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false } }, value: unknown): T | null {
  const parsed = schema.safeParse(value)
  return parsed.success ? parsed.data : null
}

export function ContentItemEditorClient({
  itemId,
  kind,
  kindLabel,
  initialData,
  updatedAt,
}: {
  itemId: string
  kind: ContentKind
  kindLabel: string
  initialData: ContentItemData
  updatedAt?: string
}) {
  const router = useRouter()
  const [data, setData] = useState<ContentItemData>(initialData)
  const [status, setStatus] = useState<string | null>(null)

  const headerTitle = useMemo(() => {
    if (kind === 'education') {
      const v = asData(educationSchema, data)
      if (!v) return 'Education item'
      return [v.degree, v.school].filter(Boolean).join(' — ') || 'Education item'
    }
    if (kind === 'workExperience') {
      const v = asData(workSchema, data)
      if (!v) return 'Work experience item'
      return [v.jobTitle, v.employer].filter(Boolean).join(' — ') || 'Work experience item'
    }
    if (kind === 'projects') {
      const v = asData(projectSchema, data)
      return v?.title || 'Project'
    }
    if (kind === 'skills') {
      const v = asData(skillSchema, data)
      return v?.category || 'Skill'
    }
    if (kind === 'certificates') {
      const v = asData(certificateSchema, data)
      return v?.title || 'Certification'
    }
    const v = asData(customSchema, data)
    return v?.title || 'Custom item'
  }, [data, kind])

  async function save() {
    setStatus('Saving…')
    const res = await fetch(`/api/content-items/${itemId}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ item_data: data }),
    })

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null
      setStatus(body?.error ?? 'Save failed')
      return
    }

    setStatus('Saved')
    setTimeout(() => setStatus(null), 1200)
    router.refresh()
  }

  async function deleteItem() {
    if (!confirm('Delete this content item?')) return
    setStatus('Deleting…')
    const res = await fetch(`/api/content-items/${itemId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null
      setStatus(body?.error ?? 'Delete failed')
      return
    }
    router.push('/content')
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-8 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-muted-foreground">{kindLabel}</div>
          <h1 className="text-2xl font-semibold tracking-tight">{headerTitle}</h1>
          <div className="mt-1 text-xs text-muted-foreground">
            Last updated: {updatedAt ? new Date(updatedAt).toLocaleString() : '—'}
          </div>
          {status ? <div className="mt-2 text-sm text-muted-foreground">{status}</div> : null}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="destructive" onClick={deleteItem}>
            Delete
          </Button>
          <Button onClick={save}>Save</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {kind === 'education' ? <EducationEditor value={data} onChange={setData} /> : null}
          {kind === 'workExperience' ? <WorkEditor value={data} onChange={setData} /> : null}
          {kind === 'projects' ? <ProjectEditor value={data} onChange={setData} /> : null}
          {kind === 'skills' ? <SkillEditor value={data} onChange={setData} /> : null}
          {kind === 'certificates' ? <CertificateEditor value={data} onChange={setData} /> : null}
          {kind === 'custom' ? <CustomEditor value={data} onChange={setData} /> : null}
        </CardContent>
      </Card>
    </main>
  )
}

function EducationEditor({
  value,
  onChange,
}: {
  value: ContentItemData
  onChange: (v: ContentItemData) => void
}) {
  const v = asData(educationSchema, value) ?? educationSchema.parse({})
  return (
    <div className="space-y-3">
      <Input value={v.degree} onChange={(e) => onChange({ ...v, degree: e.target.value })} placeholder="Degree" />
      <Input value={v.school} onChange={(e) => onChange({ ...v, school: e.target.value })} placeholder="School" />
      <div className="grid grid-cols-2 gap-2">
        <Input
          value={v.dates?.start ?? ''}
          onChange={(e) => onChange({ ...v, dates: { ...(v.dates ?? {}), start: e.target.value } })}
          placeholder="Start (MM/YYYY)"
        />
        <Input
          value={v.dates?.end ?? ''}
          onChange={(e) => onChange({ ...v, dates: { ...(v.dates ?? {}), end: e.target.value } })}
          placeholder="End (MM/YYYY or Present)"
        />
      </div>
      <Input value={v.location ?? ''} onChange={(e) => onChange({ ...v, location: e.target.value })} placeholder="Location" />
      <Input value={(v.link as string | undefined) ?? ''} onChange={(e) => onChange({ ...v, link: e.target.value })} placeholder="Optional link" />
      <RichTextEditor value={v.description} onChange={(doc) => onChange({ ...v, description: doc })} />
    </div>
  )
}

function WorkEditor({ value, onChange }: { value: ContentItemData; onChange: (v: ContentItemData) => void }) {
  const v = asData(workSchema, value) ?? workSchema.parse({})
  return (
    <div className="space-y-3">
      <Input value={v.jobTitle} onChange={(e) => onChange({ ...v, jobTitle: e.target.value })} placeholder="Job title" />
      <Input value={v.employer} onChange={(e) => onChange({ ...v, employer: e.target.value })} placeholder="Employer" />
      <div className="grid grid-cols-2 gap-2">
        <Input
          value={v.dates?.start ?? ''}
          onChange={(e) => onChange({ ...v, dates: { ...(v.dates ?? {}), start: e.target.value } })}
          placeholder="Start (MM/YYYY)"
        />
        <Input
          value={v.dates?.end ?? ''}
          onChange={(e) => onChange({ ...v, dates: { ...(v.dates ?? {}), end: e.target.value } })}
          placeholder="End (MM/YYYY or Present)"
        />
      </div>
      <Input value={v.location ?? ''} onChange={(e) => onChange({ ...v, location: e.target.value })} placeholder="Location" />
      <RichTextEditor value={v.description} onChange={(doc) => onChange({ ...v, description: doc })} />
    </div>
  )
}

function ProjectEditor({ value, onChange }: { value: ContentItemData; onChange: (v: ContentItemData) => void }) {
  const v = asData(projectSchema, value) ?? projectSchema.parse({})
  return (
    <div className="space-y-3">
      <Input value={v.title} onChange={(e) => onChange({ ...v, title: e.target.value })} placeholder="Project title" />
      <Input value={v.subtitle ?? ''} onChange={(e) => onChange({ ...v, subtitle: e.target.value })} placeholder="Optional subtitle" />
      <div className="grid grid-cols-2 gap-2">
        <Input
          value={v.dates?.start ?? ''}
          onChange={(e) => onChange({ ...v, dates: { ...(v.dates ?? {}), start: e.target.value } })}
          placeholder="Start (MM/YYYY)"
        />
        <Input
          value={v.dates?.end ?? ''}
          onChange={(e) => onChange({ ...v, dates: { ...(v.dates ?? {}), end: e.target.value } })}
          placeholder="End (MM/YYYY or Present)"
        />
      </div>
      <RichTextEditor value={v.description} onChange={(doc) => onChange({ ...v, description: doc })} />
    </div>
  )
}

function SkillEditor({ value, onChange }: { value: ContentItemData; onChange: (v: ContentItemData) => void }) {
  const v = asData(skillSchema, value) ?? skillSchema.parse({})
  return (
    <div className="space-y-3">
      <Input value={v.category} onChange={(e) => onChange({ ...v, category: e.target.value })} placeholder="Skill category" />
      <div className="max-w-xs">
        <Select
          value={v.level ?? 'none'}
          onValueChange={(val) => onChange({ ...v, level: val === 'none' ? undefined : (val as any) })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Level (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <RichTextEditor value={v.details} onChange={(doc) => onChange({ ...v, details: doc })} />
    </div>
  )
}

function CertificateEditor({ value, onChange }: { value: ContentItemData; onChange: (v: ContentItemData) => void }) {
  const v = asData(certificateSchema, value) ?? certificateSchema.parse({})
  return (
    <div className="space-y-3">
      <Input value={v.title} onChange={(e) => onChange({ ...v, title: e.target.value })} placeholder="Certification title" />
      <Input value={(v.link as string | undefined) ?? ''} onChange={(e) => onChange({ ...v, link: e.target.value })} placeholder="Optional link" />
      <RichTextEditor value={v.details} onChange={(doc) => onChange({ ...v, details: doc })} />
    </div>
  )
}

function CustomEditor({ value, onChange }: { value: ContentItemData; onChange: (v: ContentItemData) => void }) {
  const v = asData(customSchema, value) ?? customSchema.parse({})
  return (
    <div className="space-y-3">
      <Input value={v.title} onChange={(e) => onChange({ ...v, title: e.target.value })} placeholder="Title" />
      <RichTextEditor value={v.body} onChange={(doc) => onChange({ ...v, body: doc })} />
    </div>
  )
}
