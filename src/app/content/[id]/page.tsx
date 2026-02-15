import { notFound } from 'next/navigation'
import { AppHeader } from '@/components/AppHeader'
import { isSupabaseConfigured } from '@/lib/supabase/isConfigured'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  certificateContentSchema,
  contentKindLabel,
  customContentSchema,
  educationContentSchema,
  emptyContentData,
  projectContentSchema,
  skillContentSchema,
  workExperienceContentSchema,
  type ContentKind,
} from '@/lib/content/types'
import { ContentItemEditorClient } from './ui'

function parseItemData(kind: ContentKind, item_data: unknown) {
  switch (kind) {
    case 'education': {
      const parsed = educationContentSchema.safeParse(item_data)
      return parsed.success ? parsed.data : emptyContentData(kind)
    }
    case 'workExperience': {
      const parsed = workExperienceContentSchema.safeParse(item_data)
      return parsed.success ? parsed.data : emptyContentData(kind)
    }
    case 'projects': {
      const parsed = projectContentSchema.safeParse(item_data)
      return parsed.success ? parsed.data : emptyContentData(kind)
    }
    case 'skills': {
      const parsed = skillContentSchema.safeParse(item_data)
      return parsed.success ? parsed.data : emptyContentData(kind)
    }
    case 'certificates': {
      const parsed = certificateContentSchema.safeParse(item_data)
      return parsed.success ? parsed.data : emptyContentData(kind)
    }
    case 'custom': {
      const parsed = customContentSchema.safeParse(item_data)
      return parsed.success ? parsed.data : emptyContentData(kind)
    }
  }
}

export default async function ContentItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-dvh">
        <AppHeader />
        <main className="mx-auto max-w-3xl px-6 py-10">
          <div className="rounded-md border p-4 text-sm">
            <div className="font-medium">Supabase not configured</div>
            <div className="text-muted-foreground">Configure env vars and run supabase/schema.sql to use content library.</div>
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
    .from('content_items')
    .select('id,kind,item_data,updated_at,created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    notFound()
  }

  const kind = data.kind as ContentKind
  const parsedData = parseItemData(kind, data.item_data)

  return (
    <div className="min-h-dvh bg-[var(--app-chrome)]">
      <AppHeader />
      <ContentItemEditorClient
        itemId={data.id}
        kind={kind}
        kindLabel={contentKindLabel(kind)}
        initialData={parsedData}
        updatedAt={data.updated_at}
      />
    </div>
  )
}
