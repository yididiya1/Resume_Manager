import Link from 'next/link'
import { AppHeader } from '@/components/AppHeader'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { isSupabaseConfigured } from '@/lib/supabase/isConfigured'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { contentDisplayTitle, contentKindLabel, type ContentKind } from '@/lib/content/types'
import { createContentItemAction, deleteContentItemAction } from './actions'
import { Pencil, Trash2 } from 'lucide-react'

export default function ContentPage() {
  // NOTE: This page is server-rendered; keeping it sync keeps it consistent with other app pages.
  // Next will still treat it as a Server Component.
  return (
    <div className="min-h-dvh bg-[var(--app-chrome)]">
      <AppHeader />
      <ContentPageBody />
    </div>
  )
}

async function ContentPageBody() {
  const configured = isSupabaseConfigured()
  let items: Array<{ id: string; kind: ContentKind; item_data: unknown; updated_at: string; created_at: string }> = []

  if (configured) {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data } = await supabase
        .from('content_items')
        .select('id,kind,item_data,updated_at,created_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      items = (data ?? []) as typeof items
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Content library</h1>

        <form action={createContentItemAction} className="flex items-center gap-2">
          <KindSelect name="kind" />
          <Button type="submit">New item</Button>
        </form>
      </div>

      {!configured ? (
        <div className="mt-6 rounded-md border p-4 text-sm">
          <div className="font-medium">Supabase not configured</div>
          <div className="text-muted-foreground">Add env vars and run supabase/schema.sql to use the content library.</div>
        </div>
      ) : null}

      <div className="mt-6 grid items-start gap-4 md:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} className="w-full">
            <CardHeader className="gap-0">
              <CardTitle className="text-base truncate">{contentDisplayTitle(item.kind, item.item_data)}</CardTitle>
              <CardAction className="flex items-center gap-2">
                <Button size="icon-sm" variant="outline" asChild className="rounded-full" aria-label="Edit content item">
                  <Link href={`/content/${item.id}`}>
                    <Pencil />
                  </Link>
                </Button>
                <form action={deleteContentItemAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <Button
                    size="icon-sm"
                    variant="destructive"
                    type="submit"
                    className="rounded-full"
                    aria-label="Delete content item"
                  >
                    <Trash2 />
                  </Button>
                </form>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs text-muted-foreground">{contentKindLabel(item.kind)}</div>
              <div className="text-xs text-muted-foreground">
                Updated: {item.updated_at ? new Date(item.updated_at).toLocaleString() : '—'}
              </div>
            </CardContent>
          </Card>
        ))}

        {!items.length ? <div className="rounded-lg border p-6 text-sm text-muted-foreground">No items yet.</div> : null}
      </div>
    </main>
  )
}

function KindSelect({ name }: { name: string }) {
  // Using shadcn Select client-side would require a client component.
  // Keep this simple: native select is fine for MVP and posts cleanly to server actions.
  return (
    <select
      name={name}
      defaultValue="education"
      className="h-9 rounded-md border bg-background px-3 text-sm"
      aria-label="Content type"
    >
      <option value="education">Education</option>
      <option value="workExperience">Work experience</option>
      <option value="projects">Projects</option>
      <option value="skills">Skills</option>
      <option value="certificates">Certifications</option>
      <option value="custom">Custom</option>
    </select>
  )
}

