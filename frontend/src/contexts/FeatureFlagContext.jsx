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
  })

  const { data: flagsData, isLoading, error } = useQuery({
    queryKey: ['featureFlags'],
    queryFn: featureFlagsAPI.getFeatureFlagsMap,
    staleTime: 5 * 60 * 1000, // 5 minutes - feature flags don't change often
    refetchOnWindowFocus: false,
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
  }

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  )
}
