'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { contentKindSchema, emptyContentData } from '@/lib/content/types'

export async function createContentItemAction(formData: FormData) {
  const kindRaw = formData.get('kind')
  const parsedKind = contentKindSchema.safeParse(kindRaw)
  if (!parsedKind.success) {
    throw new Error('Invalid content kind')
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const kind = parsedKind.data
  const { data, error } = await supabase
    .from('content_items')
    .insert({
      user_id: user.id,
      kind,
      item_data: emptyContentData(kind),
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  redirect(`/content/${data.id}`)
}

export async function deleteContentItemAction(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data, error } = await supabase.from('content_items').delete().eq('id', id).eq('user_id', user.id).select('id')
  if (error) throw new Error(error.message)
  if (!data?.length) throw new Error('Delete failed: content item not found')

  revalidatePath('/content')
}
