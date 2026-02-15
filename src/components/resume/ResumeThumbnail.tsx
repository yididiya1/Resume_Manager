'use client'

import { useEffect, useRef } from 'react'
import { PDFViewer } from '@react-pdf/renderer'
import type { ResumeData } from '@/lib/resume/types'
import { ResumePdfDocument } from './ResumePdfDocument'
import { cn } from '@/lib/utils'

export function ResumeThumbnail({
  title,
  data,
  className,
}: {
  title: string
  data: ResumeData
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const applyNoScrollbarStyles = (iframe: HTMLIFrameElement) => {
      iframe.setAttribute('scrolling', 'no')
      iframe.style.overflow = 'hidden'

      const inject = () => {
        try {
          const doc = iframe.contentDocument
          if (!doc) return

          doc.documentElement.style.overflow = 'hidden'
          doc.body.style.overflow = 'hidden'

          const style = doc.createElement('style')
          style.textContent = `
            html, body { overflow: hidden !important; }
            * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
            *::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; }
          `
          doc.head.appendChild(style)
        } catch {
          // If the iframe is cross-origin (blob/data), we can't access contentDocument.
        }
      }

      iframe.addEventListener('load', inject)
      inject()
    }

    const existing = container.querySelector('iframe') as HTMLIFrameElement | null
    if (existing) {
      applyNoScrollbarStyles(existing)
      return
    }

    const observer = new MutationObserver(() => {
      const iframe = container.querySelector('iframe') as HTMLIFrameElement | null
      if (!iframe) return
      applyNoScrollbarStyles(iframe)
      observer.disconnect()
    })

    observer.observe(container, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className={cn('pdf-thumbnail w-full h-full bg-background', className)}>
      <PDFViewer
        width="100%"
        height="100%"
        showToolbar={false}
        style={{ overflow: 'hidden' }}
      >
        <ResumePdfDocument title={title} data={data} />
      </PDFViewer>
    </div>
  )
}
