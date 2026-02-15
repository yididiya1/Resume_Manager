import Link from 'next/link'
import { AppHeader } from '@/components/AppHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ResumeThumbnail } from '@/components/resume/ResumeThumbnail'
import { isSupabaseConfigured } from '@/lib/supabase/isConfigured'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { resumeSchema } from '@/lib/resume/types'
import { createResumeAction, deleteResumeAction } from './actions'
import { TemplatePicker } from './TemplatePicker'
import { RESUME_TEMPLATES } from '@/lib/resume/templates'
import { FileText, MoreVertical, Pencil, Trash2 } from 'lucide-react'

function daysAgoLabel(dateValue: string | null): string {
  if (!dateValue) return '—'
  const timestamp = new Date(dateValue).getTime()
  if (Number.isNaN(timestamp)) return '—'

  const diffMs = Date.now() - timestamp
  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
  if (days === 0) return 'Today'
  return `${days} days ago`
}

export default async function DashboardPage() {
  const configured = isSupabaseConfigured()
  let resumes: Array<{ id: string; title: string; updated_at: string; resume_data: unknown }> = []

  if (configured) {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data } = await supabase
        .from('resumes')
        .select('id,title,updated_at,resume_data')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      resumes = data ?? []
    }
  }

  return (
    <div className="min-h-dvh bg-[var(--app-chrome)]">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Resume Manager</h1>
            <p className='text-gray-500'>Manage, create, and edit your resumes.</p>
          </div>
          <div className="flex items-center gap-2">
            <TemplatePicker templates={RESUME_TEMPLATES} />
            <form action={createResumeAction}>
              <Button type="submit">Create new resume</Button>
            </form>
          </div>
        </div>

        {!configured ? (
          <div className="mt-6 rounded-md border p-4 text-sm">
            <div className="font-medium">Supabase not configured</div>
            <div className="text-muted-foreground">
              Add env vars from <span className="font-mono">.env.example</span> into <span className="font-mono">.env.local</span> and run
              the SQL in <span className="font-mono">supabase/schema.sql</span>.
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 items-start gap-4 sm:grid-cols-2 md:grid-cols-4">
          {resumes.map((r) => (
            <Card key={r.id} className="w-full gap-0 py-0 overflow-hidden">
              <Link href={`/builder/${r.id}`} className="block">
                <div className="h-72 w-full bg-muted/10">
                  <ResumeThumbnail
                    className="h-full w-full"
                    title={r.title}
                    data={(() => {
                      const parsed = resumeSchema.safeParse(r.resume_data)
                      return parsed.success ? parsed.data : resumeSchema.parse({})
                    })()}
                  />
                </div>
              </Link>

              <div className="shadow-top flex items-start gap-2 border-t border-t-1 px-4 py-3">
                <Link
                  href={`/builder/${r.id}`}
                  className="flex min-w-0 flex-1 items-start gap-2"
                  aria-label={`Edit ${r.title}`}
                >
                  <FileText className="mt-0.5 size-4 shrink-0 text-primary" />

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{r.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {daysAgoLabel(r.updated_at)}
                    </div>
                  </div>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon-sm" variant="ghost" aria-label="Resume actions">
                      <MoreVertical />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/builder/${r.id}`} className="cursor-pointer">
                        <Pencil className="mr-2 size-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <form action={deleteResumeAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <DropdownMenuItem asChild>
                        <button
                          type="submit"
                          className="w-full cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 size-4" />
                          Delete
                        </button>
                      </DropdownMenuItem>
                    </form>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
          {!resumes.length ? (
            <div className="rounded-lg border p-6 text-sm text-muted-foreground md:col-span-2">No resumes yet.</div>
          ) : null}
        </div>
      </main>
    </div>
  )
}
