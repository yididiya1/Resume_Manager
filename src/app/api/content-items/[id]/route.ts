import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { contentKindSchema } from '@/lib/content/types'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('content_items')
    .select('id,kind,item_data,updated_at,created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

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

  const body = (await request.json().catch(() => null)) as { kind?: unknown; item_data?: unknown } | null
  const kind = body?.kind
  const item_data = body?.item_data

  if (kind != null) {
    const kindParsed = contentKindSchema.safeParse(kind)
    if (!kindParsed.success) {
      return NextResponse.json({ error: 'Invalid kind' }, { status: 400 })
    }
  }

  const { data, error } = await supabase
    .from('content_items')
    .update({
      ...(kind != null ? { kind } : {}),
      ...(item_data != null ? { item_data } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (!data?.length) {
    return NextResponse.json({ error: 'Content item not found (or not owned by user)' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase.from('content_items').delete().eq('id', id).eq('user_id', user.id).select('id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (!data?.length) {
    return NextResponse.json({ error: 'Content item not found (or not owned by user)' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
