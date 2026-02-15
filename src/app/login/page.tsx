import { Suspense } from 'react'
import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <main className="min-h-dvh px-6 py-16">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  )
}
