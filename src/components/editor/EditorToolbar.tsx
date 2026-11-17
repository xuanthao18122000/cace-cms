import { useRef, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import type { Editor } from '@tiptap/react'
import { useEditorState } from '@tiptap/react'
import { useMutation } from '@tanstack/react-query'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Table,
  TextQuote,
  Underline,
  Undo2,
} from 'lucide-react'
import { errorMessage, IMAGE_TYPES, MAX_IMAGE_BYTES, uploadApi } from '@/api'
import { DropdownMenu, Icon, MenuDivider, MenuItem, Spinner, type IconType } from '@/components/ui'
import { useToast } from '@/contexts/toast'
import { LinkDialog } from './LinkDialog'

function ToolButton({
  icon,
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  icon: IconType
  label: string
  active?: boolean
  disabled?: boolean
  onClick(): void
  children?: ReactNode
}) {
  return (
    <button
      type="button"
      className={clsx('rte-btn', active && 'active')}
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      // Giữ vùng chọn trong trình soạn thảo khi bấm nút
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      <Icon icon={icon} />
      {children}
    </button>
  )
}

const Sep = () => <span className="rte-sep" aria-hidden="true" />

export function EditorToolbar({ editor, disabled }: { editor: Editor; disabled?: boolean }) {
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [linkOpen, setLinkOpen] = useState(false)

  // Chỉ vẽ lại thanh công cụ khi trạng thái các nút đổi
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      paragraph: e.isActive('paragraph'),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      link: e.isActive('link'),
      linkHref: (e.getAttributes('link').href as string | undefined) ?? '',
      table: e.isActive('table'),
      alignLeft: e.isActive({ textAlign: 'left' }),
      alignCenter: e.isActive({ textAlign: 'center' }),
      alignRight: e.isActive({ textAlign: 'right' }),
      alignJustify: e.isActive({ textAlign: 'justify' }),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  })

  const upload = useMutation({
    mutationFn: (file: File) => uploadApi.image(file),
    onSuccess: (res, file) => {
      editor.chain().focus().setImage({ src: res.url, alt: file.name.replace(/\.[^.]+$/, '') }).run()
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const pickImage = (file: File | undefined) => {
    if (!file) return
    if (!IMAGE_TYPES.includes(file.type)) return toast.error('Chỉ nhận ảnh JPG, PNG, WEBP hoặc GIF')
    if (file.size > MAX_IMAGE_BYTES) return toast.error('Ảnh tối đa 5 MB')
    upload.mutate(file)
  }

  const applyLink = (href: string) => {
    setLinkOpen(false)
    const chain = editor.chain().focus().extendMarkRange('link')
    if (!href) return chain.unsetLink().run()
    // Chưa chọn chữ nào: chèn chính địa chỉ làm chữ của link
    if (editor.state.selection.empty && !s.link) {
      return chain.insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] }).run()
    }
    chain.setLink({ href }).run()
  }

  const run = (fn: (c: ReturnType<Editor['chain']>) => ReturnType<Editor['chain']>) => fn(editor.chain().focus()).run()
  const off = disabled

  return (
    <div className="rte-toolbar" role="toolbar" aria-label="Định dạng nội dung">
      <div className="rte-group">
        <ToolButton icon={Pilcrow} label="Đoạn văn" active={s.paragraph} disabled={off} onClick={() => run((c) => c.setParagraph())} />
        <ToolButton icon={Heading2} label="Tiêu đề lớn (H2)" active={s.h2} disabled={off} onClick={() => run((c) => c.toggleHeading({ level: 2 }))} />
        <ToolButton icon={Heading3} label="Tiêu đề nhỏ (H3)" active={s.h3} disabled={off} onClick={() => run((c) => c.toggleHeading({ level: 3 }))} />
      </div>
      <Sep />
      <div className="rte-group">
        <ToolButton icon={Bold} label="In đậm (Ctrl+B)" active={s.bold} disabled={off} onClick={() => run((c) => c.toggleBold())} />
        <ToolButton icon={Italic} label="In nghiêng (Ctrl+I)" active={s.italic} disabled={off} onClick={() => run((c) => c.toggleItalic())} />
        <ToolButton icon={Underline} label="Gạch chân (Ctrl+U)" active={s.underline} disabled={off} onClick={() => run((c) => c.toggleUnderline())} />
        <ToolButton icon={Strikethrough} label="Gạch ngang" active={s.strike} disabled={off} onClick={() => run((c) => c.toggleStrike())} />
      </div>
      <Sep />
      <div className="rte-group">
        <ToolButton icon={List} label="Danh sách dấu chấm" active={s.bullet} disabled={off} onClick={() => run((c) => c.toggleBulletList())} />
        <ToolButton icon={ListOrdered} label="Danh sách đánh số" active={s.ordered} disabled={off} onClick={() => run((c) => c.toggleOrderedList())} />
        <ToolButton icon={TextQuote} label="Trích dẫn" active={s.quote} disabled={off} onClick={() => run((c) => c.toggleBlockquote())} />
        <ToolButton icon={Minus} label="Đường kẻ ngang" disabled={off} onClick={() => run((c) => c.setHorizontalRule())} />
      </div>
      <Sep />
      <div className="rte-group">
        <ToolButton icon={Link} label={s.link ? 'Sửa liên kết' : 'Chèn liên kết'} active={s.link} disabled={off} onClick={() => setLinkOpen(true)} />
        <button
          type="button"
          className="rte-btn"
          aria-label="Chèn ảnh"
          title="Chèn ảnh"
          disabled={off || upload.isPending}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
        >
          {upload.isPending ? <Spinner small /> : <Icon icon={ImagePlus} />}
        </button>
        {s.table ? (
          <DropdownMenu
            label="Thao tác bảng"
            align="start"
            trigger={({ open, toggle }) => (
              <button
                type="button"
                className="rte-btn wide active"
                aria-haspopup="menu"
                aria-expanded={open}
                title="Thao tác bảng"
                disabled={off}
                onMouseDown={(e) => e.preventDefault()}
                onClick={toggle}
              >
                <Icon icon={Table} />
                <Icon icon={ChevronDown} className="rte-caret" />
              </button>
            )}
          >
            <MenuItem onSelect={() => run((c) => c.addRowBefore())}>Thêm hàng phía trên</MenuItem>
            <MenuItem onSelect={() => run((c) => c.addRowAfter())}>Thêm hàng phía dưới</MenuItem>
            <MenuItem danger onSelect={() => run((c) => c.deleteRow())}>Xoá hàng</MenuItem>
            <MenuDivider />
            <MenuItem onSelect={() => run((c) => c.addColumnBefore())}>Thêm cột bên trái</MenuItem>
            <MenuItem onSelect={() => run((c) => c.addColumnAfter())}>Thêm cột bên phải</MenuItem>
            <MenuItem danger onSelect={() => run((c) => c.deleteColumn())}>Xoá cột</MenuItem>
            <MenuDivider />
            <MenuItem onSelect={() => run((c) => c.toggleHeaderRow())}>Bật/tắt hàng tiêu đề</MenuItem>
            <MenuItem onSelect={() => run((c) => c.mergeOrSplit())}>Gộp / tách ô</MenuItem>
            <MenuDivider />
            <MenuItem danger onSelect={() => run((c) => c.deleteTable())}>
              Xoá bảng
            </MenuItem>
          </DropdownMenu>
        ) : (
          <ToolButton icon={Table} label="Chèn bảng 3×3" disabled={off} onClick={() => run((c) => c.insertTable({ rows: 3, cols: 3, withHeaderRow: true }))} />
        )}
      </div>
      <Sep />
      <div className="rte-group">
        <ToolButton icon={AlignLeft} label="Canh trái" active={s.alignLeft} disabled={off} onClick={() => run((c) => c.setTextAlign('left'))} />
        <ToolButton icon={AlignCenter} label="Canh giữa" active={s.alignCenter} disabled={off} onClick={() => run((c) => c.setTextAlign('center'))} />
        <ToolButton icon={AlignRight} label="Canh phải" active={s.alignRight} disabled={off} onClick={() => run((c) => c.setTextAlign('right'))} />
        <ToolButton icon={AlignJustify} label="Canh đều hai bên" active={s.alignJustify} disabled={off} onClick={() => run((c) => c.setTextAlign('justify'))} />
      </div>
      <Sep />
      <div className="rte-group">
        <ToolButton icon={RemoveFormatting} label="Xoá định dạng" disabled={off} onClick={() => run((c) => c.unsetAllMarks().clearNodes())} />
        <ToolButton icon={Undo2} label="Hoàn tác (Ctrl+Z)" disabled={off || !s.canUndo} onClick={() => run((c) => c.undo())} />
        <ToolButton icon={Redo2} label="Làm lại (Ctrl+Shift+Z)" disabled={off || !s.canRedo} onClick={() => run((c) => c.redo())} />
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={IMAGE_TYPES.join(',')}
        hidden
        onChange={(e) => {
          pickImage(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      {linkOpen && <LinkDialog initial={s.linkHref} onClose={() => setLinkOpen(false)} onSubmit={applyLink} />}
    </div>
  )
}
