const DB_NAME = 'outmeets-offline'
const STORE_NAME = 'events'
const DB_VERSION = 1

function buildKey(eventId, userId) {
  return `${String(userId)}::${String(eventId)}`
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'cacheKey' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveOfflineBundle(eventId, userId, bundle) {
  const db = await openDB()
  const cacheKey = buildKey(eventId, userId)
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.put({ cacheKey, bundle, savedAt: new Date().toISOString() })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function loadOfflineBundle(eventId, userId) {
  const db = await openDB()
  const cacheKey = buildKey(eventId, userId)
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(cacheKey)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

export async function clearOfflineBundle(eventId, userId) {
  const db = await openDB()
  const cacheKey = buildKey(eventId, userId)
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.delete(cacheKey)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
