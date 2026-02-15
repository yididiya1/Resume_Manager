'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { ResumeTemplate } from '@/lib/resume/templates'
import { ResumeThumbnail } from '@/components/resume/ResumeThumbnail'
import { createResumeFromTemplateAction } from './actions'

export function TemplatePicker({ templates }: { templates: ResumeTemplate[] }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  const templateList = useMemo(() => templates ?? [], [templates])

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Use a template
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          role="dialog"
          aria-modal="true"
          aria-label="Choose a resume template"
        >
          <button
            type="button"
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />

          <Card className="relative z-10 w-full max-w-5xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-base font-semibold">Choose a template</div>
                <div className="mt-1 text-sm text-muted-foreground">We’ll create a new resume pre-filled with placeholders.</div>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>

            <form
              action={createResumeFromTemplateAction}
              className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {templateList.map((t) => (
                <button
                  key={t.id}
                  type="submit"
                  name="templateId"
                  value={t.id}
                  className="text-left"
                >
                  <div className="overflow-hidden rounded-md border bg-background hover:bg-muted/30">
                    <div className="h-56 w-full bg-muted/10">
                      <ResumeThumbnail className="h-full w-full" title={t.title} data={t.data} />
                    </div>
                    <div className="p-4">
                      <div className="font-medium">{t.title}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{t.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </form>
          </Card>
        </div>
      ) : null}
    </>
  )
}
