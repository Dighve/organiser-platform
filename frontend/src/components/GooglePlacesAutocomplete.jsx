import { useEffect, useRef, useState, useCallback } from 'react'
import { useLoadScript } from '@react-google-maps/api'
import { MapPin, Loader, X } from 'lucide-react'

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
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  // Service refs — initialised once when Maps loads, never recreated on re-render
  const autocompleteServiceRef = useRef(null)
  const placesServiceRef = useRef(null)

  // Session token ref — one token covers all getPlacePredictions calls for a single
  // search session.  Passing the same token to getDetails "closes" the session so the
  // entire interaction is billed as a single session charge instead of per-request.
  const sessionTokenRef = useRef(null)

  // Debounce timer ref — cleared and reset on every keystroke
  const debounceTimerRef = useRef(null)

  // Stable callback ref — keeps onPlaceSelect out of effect dependency arrays so that
  // an inline function in the parent never triggers service re-initialisation.
  const onPlaceSelectRef = useRef(onPlaceSelect)

  const [inputValue, setInputValue] = useState(value || '')
  const [predictions, setPredictions] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: MAPS_LIBRARIES,
  })

  // Keep callback ref current on every render without triggering any effects
  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect
  })

  // Initialise AutocompleteService and PlacesService ONCE when the Maps API loads.
  // Depends only on `isLoaded` — never on any callback or state that changes on re-render.
  useEffect(() => {
    if (!isLoaded) return

    autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService()

    // PlacesService requires a DOM element (not a Map instance)
    const serviceDiv = document.createElement('div')
    placesServiceRef.current = new window.google.maps.places.PlacesService(serviceDiv)

    // Generate the first session token for the initial search
    sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken()

    return () => {
      autocompleteServiceRef.current = null
      placesServiceRef.current = null
      sessionTokenRef.current = null
    }
  }, [isLoaded])

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

  // Fetch predictions — reads only from stable refs, no state/props in deps
  const fetchPredictions = useCallback((query) => {
    if (!autocompleteServiceRef.current || !sessionTokenRef.current || query.trim().length < 2) {
      setPredictions([])
      setShowDropdown(false)
      return
    }

    autocompleteServiceRef.current.getPlacePredictions(
      {
        input: query,
        sessionToken: sessionTokenRef.current,
        types: ['geocode', 'establishment'],
      },
      (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results?.length) {
          setPredictions(results)
          setShowDropdown(true)
        } else {
          setPredictions([])
          setShowDropdown(false)
        }
      }
    )
  }, [])

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
  // getDetails is intentionally NOT called anywhere else — this is the fix for the
  // "preview while typing" quota leak.  The same session token passed here closes the
  // billing session so the whole type-and-select flow costs one session charge.
  const handlePredictionSelect = (prediction) => {
    setShowDropdown(false)
    setPredictions([])

    // Optimistic update so the input shows the selection immediately
    setInputValue(prediction.description)
    if (onChange) onChange(prediction.description)

    if (!placesServiceRef.current || !sessionTokenRef.current) return

    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['formatted_address', 'geometry', 'name'],
        sessionToken: sessionTokenRef.current,
      },
      (place, status) => {
        // Rotate to a fresh session token immediately so the next search starts clean
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken()

        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place?.geometry) return

        let displayValue = place.formatted_address || place.name || ''
        if (
          place.name &&
          place.formatted_address &&
          !place.formatted_address.toLowerCase().startsWith(place.name.toLowerCase())
        ) {
          displayValue = `${place.name}, ${place.formatted_address}`
        }

        setInputValue(displayValue)
        if (onChange) onChange(displayValue)

        onPlaceSelectRef.current?.({
          address: displayValue,
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
          name: place.name || '',
        })
      }
    )
  }

  const handleClear = () => {
    setInputValue('')
    setPredictions([])
    setShowDropdown(false)
    if (onChange) onChange('')
    // Rotate session token so the next search starts a clean session
    if (isLoaded && window.google?.maps?.places) {
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken()
    }
    inputRef.current?.focus()
  }

  if (loadError) {
    return (
      <div className="w-full px-4 py-3 border-2 border-red-300 rounded-xl bg-red-50">
        <p className="text-red-600 text-sm">⚠️ Error loading Google Maps. Please check your API key and billing.</p>
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
            {predictions.map((prediction) => (
              <li
                key={prediction.place_id}
                role="option"
                onMouseDown={(e) => {
                  // Use mousedown (fires before onBlur) so the click is never swallowed
                  e.preventDefault()
                  handlePredictionSelect(prediction)
                }}
                className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-purple-50 transition-colors border-b border-gray-50 last:border-0"
              >
                <MapPin className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-gray-800 truncate">
                    {prediction.structured_formatting?.main_text || prediction.description}
                  </span>
                  {prediction.structured_formatting?.secondary_text && (
                    <span className="block text-xs text-gray-500 truncate">
                      {prediction.structured_formatting.secondary_text}
                    </span>
                  )}
                </div>
              </li>
            ))}
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
      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
        💡 Start typing to search for hiking locations on Google Maps
      </p>
    </div>
  )
}
