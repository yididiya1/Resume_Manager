import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { contentKindSchema, emptyContentData } from '@/lib/content/types'

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const kindParam = url.searchParams.get('kind')
  const parsedKind = kindParam ? contentKindSchema.safeParse(kindParam) : null
  if (parsedKind && !parsedKind.success) {
    return NextResponse.json({ error: 'Invalid kind' }, { status: 400 })
  }

  let query = supabase
    .from('content_items')
    .select('id,kind,item_data,updated_at,created_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (parsedKind?.success) {
    query = query.eq('kind', parsedKind.data)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ items: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as { kind?: unknown; item_data?: unknown } | null

  const kindParsed = contentKindSchema.safeParse(body?.kind)
  if (!kindParsed.success) {
    return NextResponse.json({ error: 'Invalid kind' }, { status: 400 })
  }

  const kind = kindParsed.data
  const item_data = body?.item_data ?? emptyContentData(kind)

  const { data, error } = await supabase
    .from('content_items')
    .insert({ user_id: user.id, kind, item_data })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ id: data.id })
}
