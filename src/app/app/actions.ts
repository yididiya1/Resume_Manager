'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { emptyResumeData, resumeSchema } from '@/lib/resume/types'
import { getResumeTemplateById } from '@/lib/resume/templates'

export async function createResumeAction() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data, error } = await supabase
    .from('resumes')
    .insert({
      user_id: user.id,
      title: 'Untitled Resume',
      resume_data: emptyResumeData(),
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  redirect(`/builder/${data.id}`)
}

export async function createResumeFromTemplateAction(formData: FormData) {
  const templateId = String(formData.get('templateId') ?? '')
  if (!templateId) return

  const t = getResumeTemplateById(templateId)
  const title = t?.title ?? 'Untitled Resume'
  const data = t?.data ?? emptyResumeData()

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: created, error } = await supabase
    .from('resumes')
    .insert({
      user_id: user.id,
      title,
      resume_data: data,
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  redirect(`/builder/${created.id}`)
}

export async function createResumeFromParsedAction(formData: FormData) {
  const resumeDataRaw = String(formData.get('resume_data') ?? '')
  const title = String(formData.get('title') ?? 'Uploaded Resume')
  if (!resumeDataRaw) return

  let parsed: unknown
  try {
    parsed = JSON.parse(resumeDataRaw)
  } catch {
    return
  }

  const validated = resumeSchema.safeParse(parsed)
  if (!validated.success) return

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: created, error } = await supabase
    .from('resumes')
    .insert({ user_id: user.id, title, resume_data: validated.data })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  redirect(`/builder/${created.id}`)
}

export async function deleteResumeAction(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data, error } = await supabase.from('resumes').delete().eq('id', id).eq('user_id', user.id).select('id')
  if (error) throw new Error(error.message)
  if (!data?.length) throw new Error('Delete failed: resume not found')

  revalidatePath('/app')
}
