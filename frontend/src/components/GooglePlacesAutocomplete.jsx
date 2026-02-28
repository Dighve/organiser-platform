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
  const autocompleteRef = useRef(null)
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
    if (!isLoaded || !autocompleteRef.current) return

    // Create input element that the autocomplete will attach to
    const inputElement = document.createElement('input')
    inputElement.type = 'text'
    inputElement.placeholder = placeholder
    inputElement.value = inputValue || ''
    inputElement.className = `w-full pl-12 pr-4 py-3 border-2 ${
      error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
    } rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium transition-all`

    // Clear container and add input
    autocompleteRef.current.innerHTML = ''
    autocompleteRef.current.appendChild(inputElement)

    // Try new API first, fallback to old if needed
    let autocompleteInstance
    
    try {
      // Try the new PlaceAutocompleteElement API
      if (window.google?.maps?.places?.PlaceAutocompleteElement) {
        console.log('Using new PlaceAutocompleteElement API')
        
        const autocompleteElement = new window.google.maps.places.PlaceAutocompleteElement()
        autocompleteElement.placeholder = placeholder
        autocompleteElement.className = inputElement.className
        
        autocompleteElement.addEventListener('gmp-placeselect', (event) => {
          console.log('New API - Place selected:', event.place)
          handlePlaceSelect(event.place)
        })
        
        // Replace input with autocomplete element
        autocompleteRef.current.innerHTML = ''
        autocompleteRef.current.appendChild(autocompleteElement)
        
        if (inputValue) {
          autocompleteElement.value = inputValue
        }
        
        autocompleteInstance = autocompleteElement
      } else {
        throw new Error('PlaceAutocompleteElement not available')
      }
    } catch (error) {
      console.log('Falling back to old Autocomplete API:', error.message)
      
      // Fallback to the old API
      autocompleteInstance = new window.google.maps.places.Autocomplete(
        inputElement,
        {
          types: ['geocode', 'establishment'],
          fields: ['formatted_address', 'geometry', 'name', 'address_components'],
        }
      )

      autocompleteInstance.addListener('place_changed', () => {
        const place = autocompleteInstance.getPlace()
        console.log('Old API - Place selected:', place)
        handlePlaceSelect(place)
      })
      
      // Handle input changes
      inputElement.addEventListener('input', (event) => {
        const newValue = event.target.value
        setInputValue(newValue)
      })
    }

    // Common place selection handler
    function handlePlaceSelect(place) {
      if (place && place.geometry) {
        let displayValue = place.formatted_address || place.name
        if (place.name && place.formatted_address && 
            !place.formatted_address.toLowerCase().startsWith(place.name.toLowerCase())) {
          displayValue = `${place.name}, ${place.formatted_address}`
        } else if (place.name && !place.formatted_address) {
          displayValue = place.name
        }

        const locationData = {
          address: displayValue,
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
          name: place.name || '',
        }

        console.log('Location data captured:', locationData)

        setInputValue(displayValue)
        
        if (onPlaceSelect) {
          onPlaceSelect(locationData)
        }
      }
    }

    return () => {
      if (autocompleteInstance) {
        if (typeof autocompleteInstance.unbindAll === 'function') {
          autocompleteInstance.unbindAll()
        }
        if (window.google?.maps?.event?.clearInstanceListeners) {
          window.google.maps.event.clearInstanceListeners(autocompleteInstance)
        }
      }
      if (autocompleteRef.current) {
        autocompleteRef.current.innerHTML = ''
      }
    }
  }, [isLoaded, onPlaceSelect, placeholder, error])

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
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-20">
          <MapPin className="h-5 w-5 text-purple-500" />
        </div>
        <div ref={autocompleteRef} className="relative z-10" />
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
