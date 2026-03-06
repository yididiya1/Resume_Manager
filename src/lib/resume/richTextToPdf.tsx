import { Fragment } from 'react'
import { Link, Text } from '@react-pdf/renderer'

type NodeMark = { type: string; attrs?: Record<string, unknown> }
type Node = { type: string; text?: string; content?: Node[]; marks?: NodeMark[] }

function isLinkMark(mark: NodeMark) {
  return mark.type === 'link' && typeof mark.attrs?.href === 'string'
}

function applyMarks(text: string, marks: NodeMark[] | undefined) {
  const isBold = Boolean(marks?.some((m) => m.type === 'bold'))
  const isItalic = Boolean(marks?.some((m) => m.type === 'italic'))
  const link = marks?.find(isLinkMark)
  const style: { fontWeight?: number; fontStyle?: 'italic' | 'normal' } = {
    fontWeight: isBold ? 700 : 400,
    fontStyle: isItalic ? 'italic' : 'normal',
  }

  if (link) {
    return (
      <Link
        src={String(link.attrs?.href)}
        style={{ ...style, textDecoration: 'underline' } as { fontWeight?: number; fontStyle?: 'italic' | 'normal'; textDecoration?: 'underline' }}
      >
        {text}
      </Link>
    )
  }

  return <Text style={style}>{text}</Text>
}

function renderInline(nodes: Node[] | undefined): React.ReactNode {
  if (!nodes?.length) return null

  return nodes.map((node, idx) => {
    if (node.type === 'text') {
      return <Fragment key={idx}>{applyMarks(node.text ?? '', node.marks)}</Fragment>
    }
    return <Fragment key={idx}>{renderInline(node.content)}</Fragment>
  })
}

export function RichTextPdf({ doc }: { doc: unknown }) {
  const root = doc as { type?: string; content?: Node[] } | null
  if (!root || root.type !== 'doc') return null

  return (
    <Fragment>
      {(root.content ?? []).map((node, idx) => {
        if (node.type === 'paragraph') {
          return (
            <Text key={idx} style={{ fontSize: 9.5, lineHeight: 1.2, marginBottom: 4 }}>
              {renderInline(node.content)}
            </Text>
          )
        }

        if (node.type === 'bulletList') {
          const items = node.content ?? []
          return (
            <Fragment key={idx}>
              {items.map((li, liIdx) => {
                const firstParagraph = li.content?.find((c) => c.type === 'paragraph')
                return (
                  <Text key={liIdx} style={{ fontSize: 9.5, lineHeight: 1.2, marginBottom: 2, marginHorizontal:10 }}>
                    • {renderInline(firstParagraph?.content)}
                  </Text>
                )
              })}
            </Fragment>
          )
        }

        return <Fragment key={idx} />
      })}
    </Fragment>
  )
}
