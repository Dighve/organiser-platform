import { useState, useRef, useEffect } from 'react'
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export default function ImageUpload({ value, onChange, folder = 'event-photo' }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(value || null)
  const fileInputRef = useRef(null)

  // Sync preview with value prop changes (for edit mode)
  useEffect(() => {
    setPreview(value || null)
  }, [value])

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error('Image size must be less than 10MB')
      return
    }

    // Show preview immediately
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result)
    }
    reader.readAsDataURL(file)

    // Upload to backend
    await uploadImage(file)
  }

  const uploadImage = async (file) => {
    const formData = new FormData()
    formData.append('file', file)

    setUploading(true)
    
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        `${API_URL}/files/upload/${folder}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': token ? `Bearer ${token}` : ''
          }
        }
      )

      if (response.data.success && response.data.imageUrl) {
        onChange(response.data.imageUrl)
        toast.success('🎉 Image uploaded successfully!')
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setPreview(null)
      toast.error(error.response?.data?.error || 'Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        // Preview with uploaded image
        <div className="relative group">
          <div className="relative rounded-xl overflow-hidden border-2 border-purple-200 shadow-lg">
            <img
              src={preview}
              alt="Feature photo preview"
              className="w-full h-64 object-cover"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center text-white">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm font-semibold">Uploading...</p>
                </div>
              </div>
            )}
            {!uploading && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-sm font-semibold">Image uploaded</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1"
                  >
                    <X className="h-4 w-4" /> Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Upload area
        <button
          type="button"
          onClick={handleClick}
          disabled={uploading}
          className="w-full border-3 border-dashed border-purple-300 rounded-xl p-8 hover:border-purple-500 hover:bg-purple-50/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              {uploading ? (
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              ) : (
                <Upload className="h-8 w-8 text-white" />
              )}
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900 mb-1">
                {uploading ? 'Uploading...' : 'Upload Feature Photo'}
              </p>
              <p className="text-sm text-gray-600">
                Click to select a beautiful photo of your hike location
              </p>
              <p className="text-xs text-gray-500 mt-2">
                JPG, PNG, GIF or WebP • Max 10MB
              </p>
            </div>
          </div>
        </button>
      )}
    </div>
  )
}
