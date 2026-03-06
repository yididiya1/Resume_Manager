'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { isSupabaseConfigured } from '@/lib/supabase/isConfigured'

export function LoginForm() {
  const searchParams = useSearchParams()
  const nextPath = useMemo(() => searchParams.get('next') ?? '/app', [searchParams])
  const [isLoading, setIsLoading] = useState(false)

  const configured = isSupabaseConfigured()

  async function onGoogle() {
    setIsLoading(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? window.location.origin
      const redirectTo = new URL('/auth/callback', origin)
      redirectTo.searchParams.set('next', nextPath)
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo.toString(),
        },
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">Use Google to continue.</p>
      </div>

      {!configured ? (
        <div className="rounded-md border p-3 text-sm">
          <div className="font-medium">Supabase not configured</div>
          <div className="text-muted-foreground">
            Add <span className="font-mono">NEXT_PUBLIC_SUPABASE_URL</span> and{' '}
            <span className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</span> in <span className="font-mono">.env.local</span>.
          </div>
        </div>
      ) : null}

      <Button className="w-full" onClick={onGoogle} disabled={!configured || isLoading}>
        Continue with Google
      </Button>
    </div>
  )
}
