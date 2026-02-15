'use client'

import { useEffect } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TiptapLink from '@tiptap/extension-link'
import { Button } from '@/components/ui/button'

export type RichTextDoc = unknown

export function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: RichTextDoc | undefined
  onChange: (doc: RichTextDoc) => void
  placeholder?: string
}) {
  const editor = useEditor({
    // Required for Next.js App Router to avoid SSR/hydration mismatches.
    // Tiptap throws if SSR is detected and this isn't explicit.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: false,
      }),
      TiptapLink.configure({ openOnClick: false }),
    ],
    content: value ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    editorProps: {
      attributes: {
        class:
          // Tailwind preflight resets list styles, and some app-level styling can
          // make rich text marks hard to see. These selectors ensure WYSIWYG.
          'min-h-[90px] w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2' +
          ' [&_strong]:font-bold [&_b]:font-bold [&_em]:italic' +
          ' [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5' +
          ' [&_li]:my-1 [&_a]:underline [&_a]:text-primary',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getJSON())
    },
  })

  // Keep editor in sync if the value is replaced (e.g., load).
  useEffect(() => {
    if (!editor || value == null) return
    editor.commands.setContent(value as never, { emitUpdate: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  if (!editor) return null

  function setLink() {
    const currentEditor = editor
    if (!currentEditor) return

    const prev = currentEditor.getAttributes('link').href as string | undefined
    const href = window.prompt('Link URL', prev ?? 'https://')
    if (!href) {
      currentEditor.chain().focus().unsetLink().run()
      return
    }
    currentEditor.chain().focus().extendMarkRange('link').setLink({ href }).run()
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant={editor.isActive('bold') ? 'default' : 'outline'} onClick={() => editor.chain().focus().toggleBold().run()}>
          Bold
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('italic') ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          Italic
        </Button>
        <Button type="button" size="sm" variant={editor.isActive('bulletList') ? 'default' : 'outline'} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          Bullets
        </Button>
        <Button type="button" size="sm" variant={editor.isActive('link') ? 'default' : 'outline'} onClick={setLink}>
          Link
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
          Clear
        </Button>
        {placeholder ? <div className="text-xs text-muted-foreground self-center">{placeholder}</div> : null}
      </div>
      <EditorContent editor={editor} />
      <div className="text-xs text-muted-foreground">
        Tip: Use <span className="font-mono">•</span> bullets for experience/project descriptions.
      </div>
    </div>
  )
}
