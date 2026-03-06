'use client'

import { useRef, useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createResumeFromParsedAction } from './actions'

export function UploadResume() {
  const inputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [status, setStatus] = useState<'idle' | 'parsing' | 'creating' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [parsed, setParsed] = useState<{ resume_data: string; title: string } | null>(null)

  async function handleFile(file: File) {
    setError(null)
    setStatus('parsing')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/ai/parse-resume', { method: 'POST', body: formData, credentials: 'include' })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        setError(body?.error ?? 'Failed to parse resume')
        setStatus('error')
        return
      }
      setParsed({ resume_data: JSON.stringify(body.resume_data), title: body.title })
      setStatus('creating')
      // Submit the hidden form to trigger the server action + redirect
      formRef.current?.requestSubmit()
    } catch {
      setError('Network error — please try again')
      setStatus('error')
    }
  }

  const busy = status === 'parsing' || status === 'creating'

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />

      {/* Hidden form — submitted programmatically after parsing succeeds */}
      <form ref={formRef} action={createResumeFromParsedAction} className="hidden">
        <input type="hidden" name="resume_data" value={parsed?.resume_data ?? ''} />
        <input type="hidden" name="title" value={parsed?.title ?? ''} />
      </form>

      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={() => { setError(null); inputRef.current?.click() }}
      >
        {busy ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            {status === 'parsing' ? 'Parsing resume…' : 'Creating…'}
          </>
        ) : (
          <>
            <Upload className="mr-2 size-4" />
            Upload Resume
          </>
        )}
      </Button>

      {status === 'error' && error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
