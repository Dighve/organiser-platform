import { useState, useEffect, useCallback } from 'react'
import { saveOfflineBundle, loadOfflineBundle } from '../lib/offlineCache'
import { eventsAPI } from '../lib/api'
import toast from 'react-hot-toast'

export function useOfflineCache(eventId) {
  const [isSaved, setIsSaved] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [cachedBundle, setCachedBundle] = useState(null)

  useEffect(() => {
    if (!eventId) return
    loadOfflineBundle(eventId)
      .then((record) => {
        if (record) {
          setIsSaved(true)
          setSavedAt(new Date(record.savedAt))
          setCachedBundle(record.bundle)
        }
      })
      .catch(() => {})
  }, [eventId])

  const save = useCallback(async () => {
    if (isSaving) return
    setIsSaving(true)
    try {
      const response = await eventsAPI.getOfflineBundle(eventId)
      const bundle = response.data
      await saveOfflineBundle(eventId, bundle)
      setIsSaved(true)
      setSavedAt(new Date())
      setCachedBundle(bundle)
      toast.success('Event saved for offline access')
    } catch {
      toast.error('Failed to save offline')
    } finally {
      setIsSaving(false)
    }
  }, [eventId, isSaving])

  return { isSaved, savedAt, isSaving, cachedBundle, save }
}
