import { useEffect, useRef, useState, useCallback } from 'react'
import { useLoadScript } from '@react-google-maps/api'
import { MapPin, Loader, X } from 'lucide-react'
import { useFeatureFlags } from '../contexts/FeatureFlagContext'

// Must be outside the component so the array reference is stable across renders.
// A new array reference on every render causes useLoadScript to reload the Maps script.
const MAPS_LIBRARIES = ['places']

export default function GooglePlacesAutocomplete({ 
  onPlaceSelect, 
  value, 
  onChange,
  placeholder = "Search for hiking trails, mountains, national parks...",
  error 
}) {
  const { isGoogleMapsEnabled } = useFeatureFlags()
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  // Debounce timer ref — cleared and reset on every keystroke
  const debounceTimerRef = useRef(null)

  // Stable callback ref — keeps onPlaceSelect out of effect dependency arrays so that
  // an inline function in the parent never triggers service re-initialisation.
  const onPlaceSelectRef = useRef(onPlaceSelect)

  const [inputValue, setInputValue] = useState(value || '')
  const [predictions, setPredictions] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [manualCoords, setManualCoords] = useState({ lat: '', lng: '' })
  const [autocompleteWorking, setAutocompleteWorking] = useState(true)

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  const hasApiKey = apiKey.trim().length > 0

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries: MAPS_LIBRARIES,
    // Skip loading Google Maps if feature flag is disabled or no API key
    loadScriptExternally: !isGoogleMapsEnabled() || !hasApiKey,
  })

  // Keep callback ref current on every render without triggering any effects
  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect
  })

  // Sync externally-controlled value (e.g. pre-filling on Edit Event / Edit Group pages)
  useEffect(() => {
    if (value !== undefined && value !== inputValue) {
      setInputValue(value)
    }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cleanup debounce timer on unmount to prevent setState on an unmounted component
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [])

  // Fetch predictions using new AutocompleteSuggestion API
  const fetchPredictions = useCallback(async (query) => {
    if (!isLoaded || query.trim().length < 2) {
      setPredictions([])
      setShowDropdown(false)
      return
    }

    try {
      const { suggestions } = await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: query,
        includedPrimaryTypes: ['geocode', 'establishment'],
      })

      if (suggestions?.length) {
        setPredictions(suggestions)
        setShowDropdown(true)
        setAutocompleteWorking(true)
      } else {
        setPredictions([])
        setShowDropdown(false)
      }
    } catch (error) {
      console.error('Error fetching autocomplete suggestions:', error)
      setPredictions([])
      setShowDropdown(false)
      setAutocompleteWorking(false)
    }
  }, [isLoaded])

  const handleInputChange = (e) => {
    const newValue = e.target.value
    setInputValue(newValue)
    if (onChange) onChange(newValue)

    // Cancel the previous debounce timer
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

    if (!newValue.trim()) {
      setPredictions([])
      setShowDropdown(false)
      return
    }

    // Fire predictions request 300 ms after the user stops typing
    debounceTimerRef.current = setTimeout(() => {
      fetchPredictions(newValue)
    }, 300)
  }

  // Called only when the user explicitly clicks a prediction item.
  // Uses new Place API to fetch place details
  const handlePredictionSelect = async (suggestion) => {
    setShowDropdown(false)
    setPredictions([])

    // Optimistic update so the input shows the selection immediately
    const displayText = suggestion.placePrediction?.text?.text || ''
    setInputValue(displayText)
    if (onChange) onChange(displayText)

    if (!isLoaded) return

    try {
      // Fetch place details using new Place API
      const place = suggestion.placePrediction.toPlace()
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location'],
      })

      let displayValue = place.formattedAddress || place.displayName || ''
      if (
        place.displayName &&
        place.formattedAddress &&
        !place.formattedAddress.toLowerCase().startsWith(place.displayName.toLowerCase())
      ) {
        displayValue = `${place.displayName}, ${place.formattedAddress}`
      }

      setInputValue(displayValue)
      if (onChange) onChange(displayValue)

      onPlaceSelectRef.current?.({
        address: displayValue,
        latitude: place.location?.lat() || 0,
        longitude: place.location?.lng() || 0,
        name: place.displayName || '',
      })
    } catch (error) {
      console.error('Error fetching place details:', error)
    }
  }

  const handleClear = () => {
    setInputValue('')
    setPredictions([])
    setShowDropdown(false)
    setManualCoords({ lat: '', lng: '' })
    if (onChange) onChange('')
    inputRef.current?.focus()
  }

  // Fallback: Manual coordinate entry
  const handleManualSubmit = () => {
    const lat = parseFloat(manualCoords.lat)
    const lng = parseFloat(manualCoords.lng)

    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid coordinates or a location name')
      return
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert('Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180')
      return
    }

    const locationText = inputValue || `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
    
    onPlaceSelectRef.current?.({
      address: locationText,
      latitude: lat,
      longitude: lng,
      name: locationText,
    })
  }

  // Fallback UI when Google Maps is disabled (feature flag), no API key, fails to load, or user manually switches
  const shouldUseFallback = !isGoogleMapsEnabled() || !hasApiKey || loadError
  
  if (shouldUseFallback) {
    return (
      <div className="space-y-4">
        <div className="px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50">
          <p className="text-gray-600 text-sm font-medium">
            📍 Enter your location manually below
          </p>
        </div>

        {/* Manual location input */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
            <MapPin className="h-5 w-5 text-purple-500" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              const newValue = e.target.value
              setInputValue(newValue)
              if (onChange) onChange(newValue)
            }}
            onBlur={() => {
              // Trigger onPlaceSelect when user finishes typing (leaves the field)
              if (inputValue.trim()) {
                onPlaceSelectRef.current?.({
                  address: inputValue,
                  latitude: manualCoords.lat ? parseFloat(manualCoords.lat) : null,
                  longitude: manualCoords.lng ? parseFloat(manualCoords.lng) : null,
                  name: inputValue,
                })
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.preventDefault()
            }}
            placeholder="Enter location name (e.g., Peak District, UK)"
            className={`w-full pl-12 pr-4 py-3 border-2 ${
              error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
            } rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium transition-all`}
          />
        </div>

        {/* Coordinate inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Latitude <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="number"
              step="any"
              value={manualCoords.lat}
              onChange={(e) => setManualCoords(prev => ({ ...prev, lat: e.target.value }))}
              placeholder="e.g., 51.5074"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Longitude <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="number"
              step="any"
              value={manualCoords.lng}
              onChange={(e) => setManualCoords(prev => ({ ...prev, lng: e.target.value }))}
              placeholder="e.g., -0.1278"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Action button */}
        {(manualCoords.lat && manualCoords.lng) && (
          <button
            type="button"
            onClick={handleManualSubmit}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            ✓ Set Location with Coordinates
          </button>
        )}

        {/* Helper text */}
        <div className="space-y-2">
          <p className="text-xs text-gray-600">
            💡 <strong>Quick:</strong> Enter location name, then click Continue (coordinates optional)
          </p>
          <p className="text-xs text-gray-600">
            💡 <strong>With coordinates:</strong> Add lat/long, then click "Set Location with Coordinates"
          </p>
          <p className="text-xs text-gray-500 italic">
            Tip: Find coordinates by searching on Google Maps and right-clicking the location
          </p>
        </div>

        {error && (
          <p className="text-red-500 text-sm flex items-center gap-1">
            <span>⚠️</span> {error}
          </p>
        )}
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 flex items-center gap-3">
        <Loader className="h-5 w-5 text-purple-600 animate-spin" />
        <span className="text-gray-600 font-medium">Loading Google Maps...</span>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
          <MapPin className="h-5 w-5 text-purple-500" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => predictions.length > 0 && setShowDropdown(true)}
          onBlur={() => {
            // When user leaves the field without selecting from dropdown,
            // still capture the typed text as location (coordinates will be null)
            if (inputValue.trim()) {
              onPlaceSelectRef.current?.({
                address: inputValue,
                latitude: null,
                longitude: null,
                name: inputValue,
              })
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault()
          }}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full pl-12 pr-10 py-3 border-2 ${
            error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
          } rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium transition-all`}
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Clear location"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showDropdown && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <ul role="listbox">
            {predictions.map((suggestion, index) => {
              const mainText = suggestion.placePrediction?.mainText?.text || ''
              const secondaryText = suggestion.placePrediction?.secondaryText?.text || ''
              const fullText = suggestion.placePrediction?.text?.text || ''
              
              return (
                <li
                  key={`${suggestion.placePrediction?.placeId || index}`}
                  role="option"
                  onMouseDown={(e) => {
                    // Use mousedown (fires before onBlur) so the click is never swallowed
                    e.preventDefault()
                    handlePredictionSelect(suggestion)
                  }}
                  className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-purple-50 transition-colors border-b border-gray-50 last:border-0"
                >
                  <MapPin className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-gray-800 truncate">
                      {mainText || fullText}
                    </span>
                    {secondaryText && (
                      <span className="block text-xs text-gray-500 truncate">
                        {secondaryText}
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex justify-end">
            <img
              src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3.png"
              alt="Powered by Google"
              className="h-4"
              loading="lazy"
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}
      {!autocompleteWorking && inputValue.trim().length >= 2 ? (
        <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700 font-medium">
            ⚠️ Google autocomplete is not available. Please type your location name and click <strong>Continue</strong> to proceed.
          </p>
        </div>
      ) : (
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          💡 Start typing to search for hiking locations on Google Maps
        </p>
      )}
    </div>
  )
}
