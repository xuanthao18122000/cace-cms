import { useEffect, useMemo } from 'react'
import clsx from 'clsx'
import { EditorContent, useEditor } from '@tiptap/react'
import { EditorToolbar } from './EditorToolbar'
import { createExtensions } from './extensions'
import './editor.css'

interface Props {
  /** HTML ban đầu; đổi sau khi mount không nạp lại (gắn key để làm mới) */
  value: string
  /** HTML mới, '' khi trình soạn thảo trống */
  onChange(html: string): void
  placeholder?: string
  invalid?: boolean
  disabled?: boolean
  id?: string
}

/** Trình soạn thảo nội dung dạng bài viết (Tiptap), xuất HTML */
export function RichTextEditor({ value, onChange, placeholder = 'Viết nội dung…', invalid, disabled, id }: Props) {
  const extensions = useMemo(() => createExtensions(placeholder), [placeholder])
  const editor = useEditor({
    extensions,
    content: value,
    editable: !disabled,
    shouldRerenderOnTransaction: false,
    editorProps: { attributes: { class: 'rte-content', ...(id ? { id } : {}), 'aria-label': 'Nội dung', 'aria-multiline': 'true' } },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? '' : e.getHTML()),
  })

  useEffect(() => {
    editor.setEditable(!disabled, false)
  }, [editor, disabled])

  return (
    <div className={clsx('rte', invalid && 'invalid', disabled && 'disabled')}>
      <EditorToolbar editor={editor} disabled={disabled} />
      <EditorContent editor={editor} />
    </div>
  )
}
