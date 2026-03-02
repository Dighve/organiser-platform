import { useEffect, useRef, useState } from 'react'
import { useLoadScript } from '@react-google-maps/api'
import { MapPin, Loader } from 'lucide-react'

const libraries = ['places']

export default function GooglePlacesAutocomplete({ 
  onPlaceSelect, 
  value, 
  onChange,
  placeholder = "Search for hiking trails, mountains, national parks...",
  error 
}) {
  const inputRef = useRef(null)
  const autocompleteRef = useRef(null)
  const [inputValue, setInputValue] = useState(value || '')

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  })

  // Sync external value changes (e.g. pre-filling on edit)
  useEffect(() => {
    if (value !== undefined && value !== inputValue && inputRef.current) {
      setInputValue(value)
      inputRef.current.value = value
    }
  }, [value])

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return

    // Always use the classic Autocomplete API - it synchronously provides geometry
    // The new PlaceAutocompleteElement API requires async fetchFields() for geometry
    // and injects its own inner input element causing the "blue box" visual bug.
    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ['geocode', 'establishment'],
        fields: ['formatted_address', 'geometry', 'name'],
      }
    )

    autocompleteRef.current = autocomplete

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()

      if (!place || !place.geometry) {
        return
      }

      let displayValue = place.formatted_address || place.name || ''
      if (
        place.name &&
        place.formatted_address &&
        !place.formatted_address.toLowerCase().startsWith(place.name.toLowerCase())
      ) {
        displayValue = `${place.name}, ${place.formatted_address}`
      }

      const locationData = {
        address: displayValue,
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
        name: place.name || '',
      }

      setInputValue(displayValue)

      if (onPlaceSelect) {
        onPlaceSelect(locationData)
      }
    })

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
        autocompleteRef.current = null
      }
    }
  }, [isLoaded, onPlaceSelect])

  const handleInputChange = (e) => {
    setInputValue(e.target.value)
    if (onChange) {
      onChange(e.target.value)
    }
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
    <div className="relative">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
          <MapPin className="h-5 w-5 text-purple-500" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`w-full pl-12 pr-4 py-3 border-2 ${
            error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
          } rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium transition-all`}
        />
      </div>
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
