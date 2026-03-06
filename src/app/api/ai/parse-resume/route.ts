import { NextResponse } from 'next/server'
import mammoth from 'mammoth'
import { parseResumePrompt } from '@/lib/ai/prompts/parseResume'
import { resumeSchema } from '@/lib/resume/types'

export const runtime = 'nodejs'
export const maxDuration = 60

// pdfjs-dist (used by pdf-parse) requires browser globals that don't exist in Node.js.
// These stubs must be set before any pdf-parse code runs.
function polyfillBrowserGlobals() {
  const g = globalThis as any
  if (!g.DOMMatrix) {
    g.DOMMatrix = class DOMMatrix {
      a=1;b=0;c=0;d=1;e=0;f=0
      m11=1;m12=0;m13=0;m14=0
      m21=0;m22=1;m23=0;m24=0
      m31=0;m32=0;m33=1;m34=0
      m41=0;m42=0;m43=0;m44=1
      is2D=true;isIdentity=true
      multiply() { return this }
      inverse() { return this }
      translate() { return this }
      scale() { return this }
      rotate() { return this }
      transformPoint(p: any) { return p }
    }
  }
  if (!g.Path2D) {
    g.Path2D = class Path2D {
      moveTo() {}
      lineTo() {}
      bezierCurveTo() {}
      quadraticCurveTo() {}
      arc() {}
      rect() {}
      closePath() {}
      addPath() {}
    }
  }
  if (!g.ImageData) {
    g.ImageData = class ImageData {
      width: number; height: number; data: Uint8ClampedArray
      constructor(w: number, h: number) {
        this.width = w; this.height = h
        this.data = new Uint8ClampedArray(w * h * 4)
      }
    }
  }
  if (!g.CanvasRenderingContext2D) {
    g.CanvasRenderingContext2D = class {}
  }
  if (!g.document) {
    g.document = {
      createElement: () => ({
        getContext: () => null,
        style: {},
      }),
    }
  }
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  polyfillBrowserGlobals()
  // Import from the internal lib path to skip pdf-parse's test-file read on module init,
  // which throws in serverless environments. serverExternalPackages in next.config.ts
  // ensures this is never bundled (prevents the "r is not a function" mangling error).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (buf: Buffer) => Promise<{ text: string }>
  const result = await pdfParse(buffer)
  return result.text as string
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const type = file.type
    const name = file.name.toLowerCase()

    let text = ''
    if (type === 'application/pdf' || name.endsWith('.pdf')) {
      text = await extractTextFromPdf(buffer)
    } else if (
      type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      name.endsWith('.docx')
    ) {
      text = await extractTextFromDocx(buffer)
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Please upload a PDF or DOCX.' }, { status: 400 })
    }

    if (!text.trim()) {
      return NextResponse.json({ error: 'Could not extract text from file. Try a different file.' }, { status: 422 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI is not configured' }, { status: 500 })
    }

    // Use a fast model for parsing — structure extraction doesn't need the heavy model
    const model = 'gpt-4o-mini'

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: parseResumePrompt },
          { role: 'user', content: `RESUME TEXT:\n\n${text.slice(0, 12000)}` },
        ],
      }),
    })

    const raw = (await res.json().catch(() => null)) as any
    if (!res.ok) {
      return NextResponse.json({ error: raw?.error?.message ?? 'OpenAI request failed' }, { status: 502 })
    }

    const content = raw?.choices?.[0]?.message?.content
    let parsed: any
    try {
      parsed = JSON.parse(content)
    } catch {
      return NextResponse.json({ error: 'AI returned invalid JSON' }, { status: 502 })
    }

    const resumeValidation = resumeSchema.safeParse(parsed.resume_data)
    if (!resumeValidation.success) {
      return NextResponse.json({ error: 'AI returned invalid resume structure' }, { status: 502 })
    }

    return NextResponse.json({
      resume_data: resumeValidation.data,
      title: String(parsed.title ?? file.name.replace(/\.[^.]+$/, '')),
    })
  } catch (err: any) {
    console.error('[parse-resume]', err)
    return NextResponse.json({ error: err?.message ?? 'Unexpected error' }, { status: 500 })
  }
}
