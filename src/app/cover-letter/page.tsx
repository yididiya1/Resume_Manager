import { AppHeader } from '@/components/AppHeader'
import { isSupabaseConfigured } from '@/lib/supabase/isConfigured'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { CoverLetterClient } from './ui'

export default async function CoverLetterPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-dvh">
        <AppHeader />
        <main className="mx-auto max-w-3xl px-6 py-10">
          <div className="rounded-md border p-4 text-sm">
            <div className="font-medium">Supabase not configured</div>
            <div className="text-muted-foreground">Configure env vars to use the Cover Letter Studio.</div>
          </div>
        </main>
      </div>
    )
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('resumes')
    .select('id,title,resume_data')
    .eq('user_id', user?.id ?? '')
    .order('updated_at', { ascending: false })

  return (
    <div className="min-h-dvh bg-[var(--app-chrome)]">
      <AppHeader />
      <CoverLetterClient resumes={(data ?? []) as never} />
    </div>
  )
}
