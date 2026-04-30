import { Download, Check, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function OfflineSaveButton({ isSaved, savedAt, isSaving, onSave }) {
  if (isSaving) {
    return (
      <button
        disabled
        className="flex items-center gap-1.5 text-xs text-gray-500 py-2 px-3 border border-gray-200 rounded-lg bg-white"
      >
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        Saving...
      </button>
    )
  }

  if (isSaved && savedAt) {
    return (
      <button
        onClick={onSave}
        className="flex items-center gap-1.5 text-xs text-green-700 py-2 px-3 border border-green-200 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
        title="Tap to refresh offline copy"
      >
        <Check className="h-3.5 w-3.5" />
        Saved · {formatDistanceToNow(savedAt, { addSuffix: true })}
      </button>
    )
  }

  return (
    <button
      onClick={onSave}
      className="flex items-center gap-1.5 text-xs text-gray-700 py-2 px-3 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors"
    >
      <Download className="h-3.5 w-3.5" />
      Save offline
    </button>
  )
}
