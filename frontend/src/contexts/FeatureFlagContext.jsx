import React, { createContext, useContext, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { featureFlagsAPI } from '../lib/api'

const FeatureFlagContext = createContext()

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagContext)
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider')
  }
  return context
}

export const FeatureFlagProvider = ({ children }) => {
  const [featureFlags, setFeatureFlags] = useState({
    GOOGLE_MAPS_ENABLED: true, // Default to enabled for graceful degradation
    EVENT_LOCATION_ENABLED: true,
    GROUP_LOCATION_ENABLED: true,
    STATIC_MAPS_ENABLED: true,
    DISABLE_BECOME_ORGANISER_BUTTON: false,
    PASSCODE_AUTH_ENABLED: false,
    USER_AGREEMENT_ENABLED: true, // When false, skip user agreement modal and auto-join
  })

  const { data: flagsData, isLoading, error } = useQuery({
    queryKey: ['featureFlags'],
    queryFn: featureFlagsAPI.getFeatureFlagsMap,
    staleTime: 30 * 1000, // 30 seconds - faster updates when flags change
    refetchOnWindowFocus: true, // Refetch when user returns to tab (catches backend changes)
    retry: 2,
  })

  useEffect(() => {
    if (flagsData) {
      setFeatureFlags(flagsData)
    }
  }, [flagsData])

  // Convenience methods for checking specific features
  const isGoogleMapsEnabled = () => featureFlags.GOOGLE_MAPS_ENABLED
  const isEventLocationEnabled = () => featureFlags.EVENT_LOCATION_ENABLED
  const isGroupLocationEnabled = () => featureFlags.GROUP_LOCATION_ENABLED
  const isStaticMapsEnabled = () => featureFlags.STATIC_MAPS_ENABLED

  const isPasscodeAuthEnabled = () => featureFlags.PASSCODE_AUTH_ENABLED

  // Check if any location features are enabled
  const isAnyLocationFeatureEnabled = () => {
    return isGoogleMapsEnabled() || isEventLocationEnabled() || 
           isGroupLocationEnabled() || isStaticMapsEnabled()
  }

  const value = {
    featureFlags,
    isLoading,
    error,
    // Convenience methods
    isGoogleMapsEnabled,
    isEventLocationEnabled,
    isGroupLocationEnabled,
    isStaticMapsEnabled,
    isAnyLocationFeatureEnabled,
    isPasscodeAuthEnabled,
  }

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  )
}
