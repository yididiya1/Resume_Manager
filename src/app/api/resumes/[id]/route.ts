import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase.from('resumes').select('id,title,resume_data').eq('id', id).eq('user_id', user.id).single()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as { title?: string; resume_data?: unknown } | null
  const title = body?.title
  const resume_data = body?.resume_data

  const { data, error } = await supabase
    .from('resumes')
    .update({
      ...(title != null ? { title } : {}),
      ...(resume_data != null ? { resume_data } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (!data?.length) {
    return NextResponse.json({ error: 'Resume not found (or not owned by user)' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
