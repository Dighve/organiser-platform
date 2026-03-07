import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Bug, Lightbulb, LayoutTemplate, Type, Upload, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { feedbackAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'

const TYPES = [
  { value: 'BUG', label: 'Bug', icon: Bug },
  { value: 'FEATURE', label: 'Feature', icon: Lightbulb },
  { value: 'UI', label: 'UI/Design', icon: LayoutTemplate },
  { value: 'CONTENT', label: 'Content/typo', icon: Type },
  { value: 'OTHER', label: 'Other', icon: Bug },
]

export default function FeedbackWidget() {
  const location = useLocation()
  const { user } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('BUG')
  const [summary, setSummary] = useState('')
  const [details, setDetails] = useState('')
  const [email, setEmail] = useState(user?.email || '')
  const [screenshotUrl, setScreenshotUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [allowFollowUp, setAllowFollowUp] = useState(true)

  useEffect(() => {
    setEmail(user?.email || '')
  }, [user])

  const reset = () => {
    setType('BUG')
    setSummary('')
    setDetails('')
    setAllowFollowUp(true)
    setScreenshotUrl('')
  }

  const handleSubmit = async () => {
    if (!summary.trim() || !details.trim()) {
      toast.error('Summary and details are required')
      return
    }
    setSubmitting(true)
    try {
      await feedbackAPI.submit({
        type,
        summary,
        details,
        pageUrl: window.location.href,
        email: email || undefined,
        allowFollowUp,
        screenshotUrl: screenshotUrl || undefined,
      })
      toast.success('Feedback sent. Thank you!')
      reset()
      setOpen(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send feedback')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpload = async (file) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Max size 5 MB')
      return
    }
    setUploading(true)
    try {
      const res = await feedbackAPI.uploadScreenshot(file)
      setScreenshotUrl(res.data.imageUrl)
      toast.success('Screenshot attached')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed right-5 bottom-20 sm:bottom-5 z-[900] rounded-full bg-white/90 backdrop-blur shadow-lg border border-white/60 text-gray-700 hover:-translate-y-0.5 hover:shadow-xl transition flex items-center gap-2 px-4 py-2"
      >
        <Bug className="h-5 w-5 text-gray-600" />
        <span className="font-semibold hidden sm:inline text-gray-700">Feedback</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full sm:max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 sm:p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setOpen(false)}
              aria-label="Close feedback"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="space-y-4 mt-2">
              <div>
                <p className="text-sm font-semibold text-gray-700">Send feedback</p>
                <p className="text-xs text-gray-500">We read everything. Include steps if reporting a bug.</p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {TYPES.map((t) => {
                  const Icon = t.icon
                  const active = type === t.value
                  return (
                    <button
                      key={t.value}
                      onClick={() => setType(t.value)}
                      className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-sm font-semibold transition ${
                        active ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-700 hover:border-purple-300'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {t.label}
                    </button>
                  )
                })}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600">Summary</label>
                <input
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  maxLength={200}
                  placeholder="Short title (6-10 words)"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600">Details</label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={4}
                  maxLength={4000}
                  placeholder="What happened? What did you expect?"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600">Email (for follow-up)</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <input
                    id="follow-up"
                    type="checkbox"
                    checked={allowFollowUp}
                    onChange={(e) => setAllowFollowUp(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="follow-up">Allow us to contact you about this</label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600">Screenshot (optional)</label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-gray-300 text-sm font-semibold text-gray-700 cursor-pointer hover:border-purple-300">
                    <Upload className="h-4 w-4" />
                    {uploading ? 'Uploading...' : 'Upload file'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUpload(e.target.files?.[0])}
                      disabled={uploading}
                    />
                  </label>
                  {screenshotUrl && (
                    <span className="text-xs text-green-700 font-semibold truncate max-w-[180px]">Attached ✓</span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500">Max 5 MB. We don’t auto-capture your screen.</p>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Page: {location.pathname}</span>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:shadow-lg disabled:opacity-60"
                >
                  {submitting ? 'Sending...' : 'Send feedback'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
