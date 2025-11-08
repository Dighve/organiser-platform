import { useState } from 'react'
import { X, Plus } from 'lucide-react'

export default function TagInput({ tags = [], onChange, placeholder = "Add a tag..." }) {
  const [inputValue, setInputValue] = useState('')

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      addTag()
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1)
    }
  }

  const addTag = () => {
    const trimmedValue = inputValue.trim()
    if (trimmedValue && !tags.includes(trimmedValue)) {
      onChange([...tags, trimmedValue])
      setInputValue('')
    }
  }

  const removeTag = (indexToRemove) => {
    onChange(tags.filter((_, index) => index !== indexToRemove))
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 p-3 border-2 border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500 transition-all bg-white min-h-[56px]">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-lg text-sm font-medium border border-purple-200 hover:border-purple-400 transition-all"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <div className="flex-1 flex items-center gap-2 min-w-[200px]">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? placeholder : "Add more..."}
            className="flex-1 outline-none bg-transparent text-gray-900 placeholder-gray-400 font-medium"
          />
          {inputValue && (
            <button
              type="button"
              onClick={addTag}
              className="p-1 hover:bg-purple-100 rounded-full transition-colors text-purple-600"
              title="Add tag"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-500 mt-2">
        Type and press Enter to add, or click the + button. Press Backspace to remove.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
          <p className="text-xs text-gray-500 w-full mb-1">Quick suggestions:</p>
          {['Hiking boots', 'Water proof jacket', 'Head torch', 'Downloaded route', 'Snacks', 'Lunch'].map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                if (!tags.includes(suggestion)) {
                  onChange([...tags, suggestion])
                }
              }}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-purple-100 text-gray-600 hover:text-purple-700 rounded-md transition-colors"
            >
              + {suggestion}
            </button>
          ))}
        </div>
    </div>
  )
}
