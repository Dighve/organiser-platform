import { useRef } from 'react'
import { Bold, Italic, List, ListOrdered, Link as LinkIcon } from 'lucide-react'

function insertAtSelection(textarea, before, after = before) {
  const start = textarea.selectionStart ?? 0
  const end = textarea.selectionEnd ?? 0
  const value = textarea.value
  const selected = value.slice(start, end) || ''
  const newValue = value.slice(0, start) + before + selected + after + value.slice(end)
  textarea.value = newValue
  const cursor = start + before.length + selected.length + after.length
  textarea.setSelectionRange(cursor, cursor)
  textarea.focus()
  return newValue
}

function applyList(textarea, ordered = false) {
  const start = textarea.selectionStart ?? 0
  const end = textarea.selectionEnd ?? 0
  const value = textarea.value
  const selected = value.slice(start, end)
  const lines = selected ? selected.split('\n') : ['List item']
  const formatted = lines
    .map((line, idx) => `${ordered ? `${idx + 1}.` : '-'} ${line.trim() || 'Item'}`)
    .join('\n')
  const newValue = value.slice(0, start) + formatted + value.slice(end)
  textarea.value = newValue
  const cursor = start + formatted.length
  textarea.setSelectionRange(cursor, cursor)
  textarea.focus()
  return newValue
}

function applyLink(textarea) {
  const start = textarea.selectionStart ?? 0
  const end = textarea.selectionEnd ?? 0
  const value = textarea.value
  const selected = value.slice(start, end) || 'link text'
  const link = `[${selected}](https://)`
  const newValue = value.slice(0, start) + link + value.slice(end)
  const cursor = start + link.length
  textarea.value = newValue
  textarea.setSelectionRange(cursor - 1, cursor - 1) // put cursor before closing paren for url
  textarea.focus()
  return newValue
}

export default function MarkdownEditor({ value, onChange, placeholder = 'Describe your event...', error }) {
  const textareaRef = useRef(null)

  const handleFormat = (type) => {
    const el = textareaRef.current
    if (!el) return
    let newVal = value || ''
    switch (type) {
      case 'bold':
        newVal = insertAtSelection(el, '**')
        break
      case 'italic':
        newVal = insertAtSelection(el, '*')
        break
      case 'bullets':
        newVal = applyList(el, false)
        break
      case 'numbers':
        newVal = applyList(el, true)
        break
      case 'link':
        newVal = applyLink(el)
        break
      default:
        break
    }
    onChange?.(newVal)
  }

  return (
    <div className="border-2 border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50 text-gray-700">
        <button type="button" className="p-2 rounded hover:bg-white" onClick={() => handleFormat('bold')} aria-label="Bold">
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" className="p-2 rounded hover:bg-white" onClick={() => handleFormat('italic')} aria-label="Italic">
          <Italic className="h-4 w-4" />
        </button>
        <span className="h-6 w-px bg-gray-200" aria-hidden="true"></span>
        <button type="button" className="p-2 rounded hover:bg-white" onClick={() => handleFormat('bullets')} aria-label="Bulleted list">
          <List className="h-4 w-4" />
        </button>
        <button type="button" className="p-2 rounded hover:bg-white" onClick={() => handleFormat('numbers')} aria-label="Numbered list">
          <ListOrdered className="h-4 w-4" />
        </button>
        <span className="h-6 w-px bg-gray-200" aria-hidden="true"></span>
        <button type="button" className="p-2 rounded hover:bg-white" onClick={() => handleFormat('link')} aria-label="Link">
          <LinkIcon className="h-4 w-4" />
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full p-4 min-h-[160px] text-sm sm:text-base focus:outline-none resize-vertical"
        placeholder={placeholder}
      />
      {error && <p className="text-red-500 text-sm px-4 pb-3">{error}</p>}
    </div>
  )
}
