import { useState, useRef } from 'react'
import { X, Save, Move } from 'lucide-react'

export default function ImagePositionModal({ imageUrl, onSave, onClose }) {
  const [position, setPosition] = useState({ x: 50, y: 50 }) // Center by default
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef(null)

  const handleMouseDown = (e) => {
    e.preventDefault()
    setIsDragging(true)
    updatePosition(e)
  }

  const handleMouseMove = (e) => {
    if (isDragging) {
      e.preventDefault()
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
    
    // Clamp and round to 1 decimal place
    const newX = Math.round(Math.max(0, Math.min(100, x)) * 10) / 10
    const newY = Math.round(Math.max(0, Math.min(100, y)) * 10) / 10
    
    console.log('Position updated:', { x: newX, y: newY }) // Debug log
    
    setPosition({
      x: newX,
      y: newY
    })
  }

  const handleSave = () => {
    onSave(position)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">Adjust Photo Position</h2>
            <p className="text-sm text-purple-100 mt-1">Click and drag to reposition the focal point</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Image Container */}
          <div className="p-6 bg-gray-50">
            <div className="flex gap-6 items-start flex-col sm:flex-row">
              {/* Main Image */}
              <div className="flex-1 w-full">
                <div 
                  ref={containerRef}
                  className="relative w-full aspect-square max-w-md mx-auto bg-gray-200 rounded-xl overflow-hidden cursor-move border-2 border-purple-200 shadow-lg"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <img
                    src={imageUrl}
                    alt="Position adjustment"
                    className="w-full h-full object-cover"
                    style={{
                      objectPosition: `${position.x}% ${position.y}%`
                    }}
                    draggable={false}
                  />
                  
                  {/* Crosshair */}
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

                  {/* Circular Guide */}
                  <div 
                    className="absolute border-4 border-dashed border-white/60 rounded-full pointer-events-none"
                    style={{
                      width: '60%',
                      height: '60%',
                      left: '20%',
                      top: '20%'
                    }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-3 text-center">
                  📍 Position: <span className="font-mono font-semibold text-purple-600">X: {position.x.toFixed(1)}% | Y: {position.y.toFixed(1)}%</span>
                </p>
              </div>

              {/* Preview */}
              <div className="flex-shrink-0 mx-auto sm:mx-0">
                <p className="text-sm font-semibold text-gray-700 mb-3 text-center sm:text-left">Preview:</p>
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
          </div>
        </div>

        {/* Actions - Always visible at bottom */}
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex gap-4 flex-shrink-0">
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-green-500/50 transition-all transform hover:scale-105"
          >
            <Save className="h-5 w-5" />
            Save Position
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
