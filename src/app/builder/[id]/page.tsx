import { notFound } from 'next/navigation'
import { AppHeader } from '@/components/AppHeader'
import { isSupabaseConfigured } from '@/lib/supabase/isConfigured'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { resumeSchema } from '@/lib/resume/types'
import { BuilderClient } from './ui'

export default async function BuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-dvh">
        <AppHeader />
        <main className="mx-auto max-w-3xl px-6 py-10">
          <div className="rounded-md border p-4 text-sm">
            <div className="font-medium">Supabase not configured</div>
            <div className="text-muted-foreground">Configure env vars and run supabase/schema.sql to use the builder.</div>
          </div>
        </main>
      </div>
    )
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  const { data, error } = await supabase
    .from('resumes')
    .select('id,title,resume_data')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    notFound()
  }

  console.log('Fetched resume data from Supabase:', data)

  const parsed = resumeSchema.safeParse(data.resume_data)

  console.log('Parsed resume data:', parsed)

  return (
    <div className="min-h-dvh bg-[var(--app-chrome)]">
      <AppHeader />
      <BuilderClient resumeId={data.id} initialTitle={data.title} initialData={parsed.success ? parsed.data : resumeSchema.parse({})} />
    </div>
  )
}
