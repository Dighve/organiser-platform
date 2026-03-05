import MDEditor, { commands } from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'
import { useMemo } from 'react'

export default function MarkdownEditor({ value, onChange, placeholder = 'Describe your event...', error }) {
  // Ensure a string value for controlled component
  const safeValue = useMemo(() => value || '', [value])

  return (
    <div className="border-2 border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      <div data-color-mode="light" className="bg-white">
        <MDEditor
          value={safeValue}
          onChange={(val) => onChange?.(val || '')}
          preview="edit"
          height={240}
          placeholder={placeholder}
          commands={[
            commands.bold,
            commands.italic,
            commands.link,
            commands.unorderedListCommand,
            commands.orderedListCommand,
          ]}
          extraCommands={[]}
          className="border-none"
          textareaProps={{
            'aria-label': 'Event description markdown editor',
          }}
          style={{ backgroundColor: 'white' }}
        />
      </div>
      {error && <p className="text-red-500 text-sm px-4 pb-3">{error}</p>}
    </div>
  )
}
