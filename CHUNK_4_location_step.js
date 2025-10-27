// CHUNK 4: Location Step (with Google Maps)
// Copy this after the renderBasicsStep function

  const renderLocationStep = () => (
    <form onSubmit={handleSubmit(onStepSubmit)} className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-orange-500 rounded-2xl mb-4 shadow-lg">
          <MapPin className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Where will you hike?</h2>
        <p className="text-gray-600">Search for your hiking location using Google Maps</p>
      </div>

      <div>
        <label htmlFor="location" className="block text-base font-bold text-gray-900 mb-3">
          Hiking location *
        </label>
        <GooglePlacesAutocomplete
          value={watchedValues.location}
          onChange={(value) => setValue('location', value)}
          onPlaceSelect={(locationData) => {
            setValue('location', locationData.address)
            setValue('latitude', locationData.latitude)
            setValue('longitude', locationData.longitude)
            updateFormData({
              location: locationData.address,
              latitude: locationData.latitude,
              longitude: locationData.longitude
            })
          }}
          error={errors.location?.message}
        />
        <input type="hidden" {...register('location', { required: 'Location is required' })} />
      </div>

      {watchedValues.latitude && watchedValues.longitude && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="bg-green-500 rounded-full p-2">
              <Check className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-green-800 font-bold text-lg">Location selected</p>
              <p className="text-green-700 mt-1">{watchedValues.location}</p>
              <p className="text-sm text-green-600 mt-2">
                📍 {watchedValues.latitude?.toFixed(6)}, {watchedValues.longitude?.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button 
          type="button" 
          onClick={prevStep} 
          className="py-4 px-8 bg-gray-100 text-gray-700 font-bold text-lg rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2"
        >
          <ArrowLeft className="h-5 w-5" /> Back
        </button>
        <button
          type="submit"
          className="py-4 px-10 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center gap-2"
          disabled={!watchedValues.location}
        >
          Continue <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </form>
  )
