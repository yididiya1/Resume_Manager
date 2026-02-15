'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { isSupabaseConfigured } from '@/lib/supabase/isConfigured'
import { FileText, SlidersHorizontal, Library } from 'lucide-react'

export function AppHeader() {
  const pathname = usePathname()
  const configured = isSupabaseConfigured()

  async function signOut() {
    if (!configured) {
      window.location.href = '/'
      return
    }

    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const items = [
    { href: '/app', label: 'Resumes', icon: FileText },
    { href: '/adjuster', label: 'Adjuster', icon: SlidersHorizontal },
    { href: '/content', label: 'Content', icon: Library },
  ]

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/app" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Resume Manager" width={72} height={72} priority />
          <span className="sr-only">Resume Manager</span>
        </Link>
        <nav className="flex items-center gap-2">
          {items.map((item) => {
            const active = pathname === item.href
            const Icon = item.icon

            return (
              <Button
                key={item.href}
                variant="ghost"
                size="sm"
                className={active ? 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary' : 'text-muted-foreground'}
                asChild
              >
                <Link href={item.href} className="flex items-center gap-2">
                  <Icon className={active ? 'text-primary' : 'text-muted-foreground'} />
                  <span>{item.label}</span>
                </Link>
              </Button>
            )
          })}
        </nav>
        <Button variant="outline" size="sm" onClick={signOut}>
          Sign out
        </Button>
      </div>
    </header>
  )
}
