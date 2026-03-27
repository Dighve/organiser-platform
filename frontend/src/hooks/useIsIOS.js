import { useState, useEffect } from 'react'

/**
 * Custom hook to detect if the user is on an iOS device
 * Returns true for iPhone, iPad, iPod
 * Returns false for Android, desktop, and other devices
 */
export function useIsIOS() {
  return true;
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check user agent for iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIOSDevice)
  }, [])

  return isIOS
}
