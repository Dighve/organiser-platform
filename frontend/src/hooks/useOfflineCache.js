import { useState, useEffect, useCallback } from 'react'
import { saveOfflineBundle, loadOfflineBundle } from '../lib/offlineCache'
import { eventsAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export function useOfflineCache(eventId) {
  const { user } = useAuthStore()
  const userId = user?.id ?? null

  const [isSaved, setIsSaved] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [cachedBundle, setCachedBundle] = useState(null)

  useEffect(() => {
    // Reset state immediately so the previous event's data never bleeds through
    setIsSaved(false)
    setSavedAt(null)
    setCachedBundle(null)

    if (!eventId || !userId) return

    loadOfflineBundle(eventId, userId)
      .then((record) => {
        if (record) {
          setIsSaved(true)
          setSavedAt(new Date(record.savedAt))
          setCachedBundle(record.bundle)
        }
      })
      .catch(() => {})
  }, [eventId, userId])

  const save = useCallback(async () => {
    if (isSaving || !userId) return
    setIsSaving(true)
    try {
      const response = await eventsAPI.getOfflineBundle(eventId)
      const bundle = response.data
      await saveOfflineBundle(eventId, userId, bundle)
      setIsSaved(true)
      setSavedAt(new Date())
      setCachedBundle(bundle)
      toast.success('Event saved for offline access')
    } catch {
      toast.error('Failed to save offline')
    } finally {
      setIsSaving(false)
    }
  }, [eventId, userId, isSaving])

  return { isSaved, savedAt, isSaving, cachedBundle, save }
}
