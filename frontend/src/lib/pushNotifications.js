import api from './api'

const PUSH_SUBSCRIPTION_KEY = 'outmeets-push-subscribed'

/**
 * Returns true when running as an installed PWA (standalone mode)
 */
export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

/**
 * Returns true on iOS/iPadOS devices
 */
export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
}

/**
 * Check if the browser supports push notifications
 */
export function isPushSupported() {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/**
 * Get the current notification permission state
 * @returns {'granted' | 'denied' | 'default' | 'unsupported'}
 */
export function getPermissionState() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

/**
 * Fetch the VAPID public key from the backend
 */
async function fetchVapidPublicKey() {
  const response = await api.get('/push/vapid-public-key')
  return response.data.publicKey
}

/**
 * Convert a base64-encoded VAPID key to a Uint8Array for the subscribe call
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Subscribe the current browser to push notifications.
 * 1. Request notification permission
 * 2. Get VAPID key from backend
 * 3. Subscribe via PushManager
 * 4. Send subscription to backend
 *
 * @returns {{ success: boolean, reason?: string }}
 */
export async function subscribeToPush() {
  if (!isPushSupported()) {
    return { success: false, reason: 'Push notifications are not supported in this browser.' }
  }

  // Request permission
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { success: false, reason: 'Notification permission was denied.' }
  }

  try {
    const registration = await navigator.serviceWorker.ready

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      // Get VAPID public key from backend
      const vapidPublicKey = await fetchVapidPublicKey()
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      })
    }

    // Send subscription to backend
    const subscriptionJSON = subscription.toJSON()
    await api.post('/push/subscribe', {
      endpoint: subscriptionJSON.endpoint,
      keys: {
        p256dh: subscriptionJSON.keys.p256dh,
        auth: subscriptionJSON.keys.auth,
      },
    })

    localStorage.setItem(PUSH_SUBSCRIPTION_KEY, 'true')
    return { success: true }
  } catch (error) {
    console.error('Push subscription failed:', error)
    return { success: false, reason: error.message || 'Failed to subscribe to push notifications.' }
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush() {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      const endpoint = subscription.endpoint
      await subscription.unsubscribe()
      await api.delete('/push/subscribe', { params: { endpoint } })
    }
    localStorage.removeItem(PUSH_SUBSCRIPTION_KEY)
    return { success: true }
  } catch (error) {
    console.error('Push unsubscribe failed:', error)
    return { success: false, reason: error.message }
  }
}

/**
 * Check if the user has already subscribed to push on this device
 */
export function isSubscribedLocally() {
  return localStorage.getItem(PUSH_SUBSCRIPTION_KEY) === 'true'
}

/**
 * Check the real PushManager subscription status
 */
export async function isSubscribedForReal() {
  if (!isPushSupported()) return false
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    return subscription !== null
  } catch {
    return false
  }
}
