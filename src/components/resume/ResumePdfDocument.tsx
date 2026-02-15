import { Document, Font, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import type { ResumeData } from '@/lib/resume/types'
import { RichTextPdf } from '@/lib/resume/richTextToPdf'

export type ResumePdfSectionKey = 'header' | 'summary' | 'education' | 'workExperience' | 'projects' | 'skills' | 'certificates'
export type ResumePdfVisibleSections = Partial<Record<ResumePdfSectionKey, boolean>>

const DEFAULT_FONT_FAMILY = 'Helvetica'
const CUSTOM_FONT_FAMILY = 'SourceSansPro'

const requestedFontFamily = (process.env.NEXT_PUBLIC_PDF_FONT_FAMILY ?? '').trim()
const requestedFontFamilyLower = requestedFontFamily.toLowerCase()

const builtinFontFamily = (() => {
  if (!requestedFontFamilyLower) return DEFAULT_FONT_FAMILY
  if (requestedFontFamilyLower === 'helvetica') return 'Helvetica'
  if (requestedFontFamilyLower === 'times' || requestedFontFamilyLower === 'times-roman') return 'Times-Roman'
  if (requestedFontFamilyLower === 'courier') return 'Courier'
  return DEFAULT_FONT_FAMILY
})()

const useCustomFont = ['sourcesanspro', 'sourcesans3'].includes(requestedFontFamilyLower)

// Keep normal text slightly heavier to avoid the “too thin” look,
// but do NOT make it 700 — otherwise bold text becomes indistinguishable.
const NORMAL_WEIGHT = useCustomFont ? 400 : 400

let fontsRegistered = false
function registerFontsOnce() {
  if (!useCustomFont) return
  if (fontsRegistered) return
  fontsRegistered = true
  try {
    Font.register({
      family: CUSTOM_FONT_FAMILY,
      fonts: [
        // Static TTFs are much more reliable than variable fonts in React-PDF.
        { src: '/fonts/SourceSansPro-Regular.ttf', fontWeight:400 },
        { src: '/fonts/SourceSansPro-Italic.ttf', fontWeight: 400, fontStyle: 'italic' },

        { src: '/fonts/SourceSansPro-Semibold.ttf', fontWeight: 600 },
        { src: '/fonts/SourceSansPro-SemiboldItalic.ttf', fontWeight: 600, fontStyle: 'italic' },

        { src: '/fonts/SourceSansPro-Bold.ttf', fontWeight: 700 },
        { src: '/fonts/SourceSansPro-BoldItalic.ttf', fontWeight: 700, fontStyle: 'italic' },
      ],
    })
  } catch {
    // If font files are missing, React-PDF may fall back to default fonts.
    // We keep this non-fatal so dev/build doesn't break.
  }
}

registerFontsOnce()

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 11,
    fontFamily: useCustomFont ? CUSTOM_FONT_FAMILY : builtinFontFamily,
    fontWeight: NORMAL_WEIGHT,
  },
  section: { marginBottom: 2 },
  heading: { fontSize: 11, fontWeight: 700, marginBottom: 0.5, textTransform: 'uppercase' },
  itemTitle: { fontSize: 10, fontWeight: 700 },
  itemMeta: { fontSize: 10, color: '#444', fontWeight: NORMAL_WEIGHT },
  headingDivider: { borderBottomWidth: 1, borderBottomColor: '#E5E5E5', marginTop: 2, marginBottom: 3 },
  headerName: { fontSize: 16, fontWeight: 700, textAlign: 'center' },
  headerLinks: {
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  headerLinkText: { fontSize: 10, color: '#111', textDecoration: 'underline', fontWeight: NORMAL_WEIGHT, marginRight: 6 },
  headerPlainText: { fontSize: 10, color: '#111', fontWeight: NORMAL_WEIGHT, marginRight: 6 },
  rowBetween: { marginBottom:0,flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  leftCol: { flexGrow: 1, flexShrink: 1, paddingRight: 10 },
  rightCol: { flexShrink: 0, alignItems: 'flex-end', textAlign: 'right' },
})

function richTextOneLine(doc: unknown): string {
  const root = doc as { type?: string; content?: any[] } | null
  if (!root || root.type !== 'doc') return ''

  const parts: string[] = []
  const pushText = (node: any) => {
    if (!node) return
    if (typeof node.text === 'string') {
      parts.push(node.text)
      return
    }
    if (Array.isArray(node.content)) {
      for (const child of node.content) pushText(child)
    }
  }

  for (const node of root.content ?? []) {
    // Prefer first paragraph’s text.
    if (node?.type === 'paragraph') {
      pushText(node)
      break
    }
    // Otherwise flatten bullet list into a semicolon-separated one-liner.
    if (node?.type === 'bulletList') {
      const items: any[] = Array.isArray(node.content) ? node.content : []
      const itemTexts = items
        .map((li) => {
          const p = Array.isArray(li?.content) ? li.content.find((c: any) => c?.type === 'paragraph') : null
          const itemParts: string[] = []
          const collect = (n: any) => {
            if (!n) return
            if (typeof n.text === 'string') itemParts.push(n.text)
            else if (Array.isArray(n.content)) n.content.forEach(collect)
          }
          collect(p)
          return itemParts.join('')
        })
        .map((s) => s.replace(/\s+/g, ' ').trim())
        .filter(Boolean)

      if (itemTexts.length) {
        return itemTexts.join('; ')
      }
    }
  }

  return parts.join('').replace(/\s+/g, ' ').trim()
}

export function ResumePdfDocument({
  title,
  data,
  visibleSections,
}: {
  title: string
  data: ResumeData
  visibleSections?: ResumePdfVisibleSections
}) {
  const headerLinks = (data.header?.links ?? []).filter((l) => Boolean(l?.label?.trim() || String(l?.url ?? '').trim()))
  const headerName = (data.header?.fullName ?? '').trim()

  const isVisible = (key: ResumePdfSectionKey) => visibleSections?.[key] !== false

  const sections: Array<{ key: string; node: ReactNode }> = []

  if (isVisible('header') && (headerName || headerLinks.length)) {
    sections.push({
      key: 'header',
      node: (
        <View>
          {headerName ? <Text style={styles.headerName}>{headerName}</Text> : null}
          {headerLinks.length ? (
            <View style={styles.headerLinks}>
              {headerLinks.map((l) => {
                const raw = String(l.url ?? '').trim()
                const text = (l.label?.trim() ? l.label.trim() : raw).trim()
                if (!text) return null

                const href = (() => {
                  if (/^(https?:\/\/|mailto:|tel:)/i.test(raw)) return raw
                  if (raw.includes('.')) return `https://${raw}`
                  return ''
                })()

                return href ? (
                  <Link key={l.id} src={href} style={styles.headerLinkText}>
                    {text}
                  </Link>
                ) : (
                  <Text key={l.id} style={styles.headerPlainText}>
                    {text}
                  </Text>
                )
              })}
            </View>
          ) : null}
        </View>
      ),
    })
  }

  if (isVisible('summary') && data.summary) {
    sections.push({
      key: 'summary',
      node: (
        <View>
          <Text style={styles.heading}>Summary</Text>
          <View style={styles.headingDivider} />
          <RichTextPdf doc={data.summary} />
        </View>
      ),
    })
  }

  if (isVisible('education') && data.education.length) {
    sections.push({
      key: 'education',
      node: (
        <View>
          <Text style={styles.heading}>Education</Text>
          <View style={styles.headingDivider} />
          {data.education.map((e) => (
            <View key={e.id} style={{ marginBottom: 0.5 }}>
              <View style={styles.rowBetween}>
                <View style={styles.leftCol}>
                  <Text style={styles.itemTitle}>{e.degree}</Text>
                  <Text style={styles.itemMeta}>{e.school}</Text>
                </View>
                <View style={styles.rightCol}>
                  {e.dates.start || e.dates.end ? (
                    <Text style={styles.itemMeta}>
                      {e.dates.start ?? ''}{e.dates.start || e.dates.end ? ' - ' : ''}{e.dates.end ?? ''}
                    </Text>
                  ) : null}
                  {e.location ? <Text style={styles.itemMeta}>{e.location}</Text> : null}
                </View>
              </View>
              {e.description ? <RichTextPdf doc={e.description} /> : null}
            </View>
          ))}
        </View>
      ),
    })
  }

  if (isVisible('workExperience') && data.workExperience.length) {
    sections.push({
      key: 'work',
      node: (
        <View>
          <Text style={styles.heading}>Work Experience</Text>
          <View style={styles.headingDivider} />
          {data.workExperience.map((w) => (
            <View key={w.id} style={{ marginBottom: 0.5 }}>
              <View style={styles.rowBetween}>
                <View style={styles.leftCol}>
                  <Text style={styles.itemTitle}>{w.jobTitle}</Text>
                  <Text style={styles.itemMeta}>{w.employer}</Text>
                </View>
                <View style={styles.rightCol}>
                  {w.dates.start || w.dates.end ? (
                    <Text style={styles.itemMeta}>
                      {w.dates.start ?? ''}{w.dates.start || w.dates.end ? ' - ' : ''}{w.dates.end ?? ''}
                    </Text>
                  ) : null}
                  {w.location ? <Text style={styles.itemMeta}>{w.location}</Text> : null}
                </View>
              </View>
              {w.description ? <RichTextPdf doc={w.description} /> : null}
            </View>
          ))}
        </View>
      ),
    })
  }

  if (isVisible('projects') && data.projects.length) {
    sections.push({
      key: 'projects',
      node: (
        <View>
          <Text style={styles.heading}>Projects</Text>
          <View style={styles.headingDivider} />
          {data.projects.map((p) => (
            <View key={p.id} style={{ marginBottom: 0.5 }}>
              <View style={styles.rowBetween}>
                <View style={styles.leftCol}>
                  <Text style={styles.itemTitle}>{p.title}</Text>
                  {p.subtitle ? <Text style={styles.itemMeta}>{p.subtitle}</Text> : null}
                </View>
                <View style={styles.rightCol}>
                  {p.dates.start || p.dates.end ? (
                    <Text style={styles.itemMeta}>
                      {p.dates.start ?? ''}{p.dates.start || p.dates.end ? ' - ' : ''}{p.dates.end ?? ''}
                    </Text>
                  ) : null}
                </View>
              </View>
              {p.description ? <RichTextPdf doc={p.description} /> : null}
            </View>
          ))}
        </View>
      ),
    })
  }

  if (isVisible('skills') && data.skills.length) {
    sections.push({
      key: 'skills',
      node: (
        <View>
          <Text style={styles.heading}>Skills</Text>
          <View style={styles.headingDivider} />
          {data.skills.map((s) => (
            <View key={s.id} style={{ marginBottom: 0.5 }}>
              <Text style={{ fontSize: 10, lineHeight: 1.2 }}>
                <Text style={{ fontWeight: 700 }}>{s.category}</Text>
                {(() => {
                  const desc = richTextOneLine(s.details)
                  return desc ? `: ${desc}` : ''
                })()}
              </Text>
            </View>
          ))}
        </View>
      ),
    })
  }

  if (isVisible('certificates') && data.certificates.length) {
    sections.push({
      key: 'certs',
      node: (
        <View>
          <Text style={styles.heading}>Certificates</Text>
          <View style={styles.headingDivider} />
          {data.certificates.map((c) => (
            <View key={c.id} style={{ marginBottom: 6 }}>
              <Text style={styles.itemTitle}>{c.title}</Text>
              {c.details ? <RichTextPdf doc={c.details} /> : null}
            </View>
          ))}
        </View>
      ),
    })
  }

  return (
    <Document title={title}>
      <Page size="A4" style={styles.page}>
        {sections.map((s, idx) => (
          <View key={s.key} style={styles.section}>
            {s.node}
          </View>
        ))}
      </Page>
    </Document>
  )
}
