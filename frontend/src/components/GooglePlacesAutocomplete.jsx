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
  const [autocomplete, setAutocomplete] = useState(null)
  const [inputValue, setInputValue] = useState(value || '')

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  })

  // Set initial value only once
  useEffect(() => {
    if (value !== undefined && inputValue === '') {
      setInputValue(value)
    }
  }, [value])

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return

    const autocompleteInstance = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ['geocode', 'establishment'],
        fields: ['formatted_address', 'geometry', 'name', 'address_components'],
      }
    )

    autocompleteInstance.addListener('place_changed', () => {
      const place = autocompleteInstance.getPlace()

      if (place.geometry) {
        const locationData = {
          address: place.formatted_address || place.name,
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
          name: place.name,
        }

        // Update internal input state to show selected address
        setInputValue(locationData.address)
        
        // Only call onPlaceSelect - this will update hidden fields with validated data
        if (onPlaceSelect) {
          onPlaceSelect(locationData)
        }
      }
    })

    setAutocomplete(autocompleteInstance)

    return () => {
      if (autocompleteInstance) {
        window.google.maps.event.clearInstanceListeners(autocompleteInstance)
      }
    }
  }, [isLoaded, onPlaceSelect, onChange])

  const handleInputChange = (e) => {
    const newValue = e.target.value
    setInputValue(newValue)
    // Don't call onChange while typing - only onPlaceSelect matters
  }

  if (loadError) {
    return (
      <div className="w-full px-4 py-3 border-2 border-red-300 rounded-xl bg-red-50">
        <p className="text-red-600 text-sm">⚠️ Error loading Google Maps. Please check your API key.</p>
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
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
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
