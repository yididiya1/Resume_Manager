'use client'

import { useEffect, useRef } from 'react'
import { PDFViewer } from '@react-pdf/renderer'
import type { ResumeData } from '@/lib/resume/types'
import { ResumePdfDocument } from './ResumePdfDocument'
import type { ResumePdfVisibleSections } from './ResumePdfDocument'

export function ResumePreview({
  title,
  data,
  visibleSections,
}: {
  title: string
  data: ResumeData
  visibleSections?: ResumePdfVisibleSections
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const applyHiddenScrollbarStyles = (iframe: HTMLIFrameElement) => {
      const inject = () => {
        try {
          const doc = iframe.contentDocument
          if (!doc) return

          const style = doc.createElement('style')
          style.textContent = `
            * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
            *::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; }
          `
          doc.head.appendChild(style)
        } catch {
          // If iframe isn't accessible, rely on outer CSS.
        }
      }

      iframe.addEventListener('load', inject)
      inject()
    }

    const existing = container.querySelector('iframe') as HTMLIFrameElement | null
    if (existing) {
      applyHiddenScrollbarStyles(existing)
      return
    }

    const observer = new MutationObserver(() => {
      const iframe = container.querySelector('iframe') as HTMLIFrameElement | null
      if (!iframe) return
      applyHiddenScrollbarStyles(iframe)
      observer.disconnect()
    })

    observer.observe(container, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="pdf-embed no-scrollbar h-full  w-full">
      <PDFViewer width="100%" height="100%" showToolbar={false}>
        <ResumePdfDocument title={title} data={data} visibleSections={visibleSections} />
      </PDFViewer>
    </div>
  )
}
