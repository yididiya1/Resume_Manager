import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { emptyResumeData } from '@/lib/resume/types'

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as { title?: string; resume_data?: unknown } | null
  const title = body?.title?.trim() || 'Untitled Resume'
  const resume_data = (body?.resume_data as object | undefined) ?? emptyResumeData()

  const { data, error } = await supabase
    .from('resumes')
    .insert({ user_id: user.id, title, resume_data })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ id: data.id })
}
