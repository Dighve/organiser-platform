import { useState, useRef } from 'react'
import { X, Save, Move } from 'lucide-react'

export default function ImagePositionModal({ imageUrl, onSave, onClose }) {
  const [position, setPosition] = useState({ x: 50, y: 50 }) // Center by default
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef(null)

  const handleMouseDown = (e) => {
    setIsDragging(true)
    updatePosition(e)
  }

  const handleMouseMove = (e) => {
    if (isDragging) {
      updatePosition(e)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const updatePosition = (e) => {
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    setPosition({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y))
    })
  }

  const handleSave = () => {
    onSave(position)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Move className="h-6 w-6 text-white" />
            <h2 className="text-2xl font-bold text-white">Adjust Photo Position</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-gray-600 mb-2">Click and drag to reposition your photo</p>
            <p className="text-sm text-gray-500">The preview shows how it will appear in the circle</p>
          </div>

          {/* Image Container */}
          <div 
            ref={containerRef}
            className="relative w-full aspect-square bg-gray-100 rounded-2xl overflow-hidden cursor-move border-4 border-purple-200 shadow-lg"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              src={imageUrl}
              alt="Profile"
              className="absolute w-full h-full object-cover pointer-events-none select-none"
              style={{
                objectPosition: `${position.x}% ${position.y}%`
              }}
            />
            
            {/* Circular Overlay Guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative" style={{ width: '80%', paddingBottom: '80%' }}>
                <div className="absolute inset-0 rounded-full border-4 border-white shadow-2xl"></div>
                <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-dashed animate-pulse"></div>
              </div>
            </div>

            {/* Crosshair at position */}
            <div 
              className="absolute w-8 h-8 pointer-events-none"
              style={{
                left: `calc(${position.x}% - 16px)`,
                top: `calc(${position.y}% - 16px)`
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-0.5 bg-purple-600"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-0.5 h-full bg-purple-600"></div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="flex flex-col items-center">
            <p className="text-sm font-semibold text-gray-700 mb-3">Preview:</p>
            <div className="relative w-32 h-32">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full h-full object-cover rounded-full border-4 border-white shadow-xl"
                style={{
                  objectPosition: `${position.x}% ${position.y}%`
                }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-4">
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-green-500/50 transition-all transform hover:scale-105"
          >
            <Save className="h-5 w-5" />
            Save Position
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
