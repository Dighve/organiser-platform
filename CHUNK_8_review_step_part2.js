// CHUNK 8: Review Step Part 2 (Hike Details & Buttons)
// Copy this immediately after CHUNK 7 (continues the renderReviewStep function)

          {/* Hike Details */}
          <div className="bg-white rounded-2xl p-6 border-2 border-green-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <Compass className="h-6 w-6 text-green-600" />
                Hike details
              </h3>
              <button
                type="button"
                onClick={() => goToStep(STEPS.DETAILS)}
                className="py-2 px-4 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg font-semibold flex items-center gap-1 text-sm transition-all"
              >
                <Edit2 className="h-4 w-4" /> Edit
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {difficultyOption && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="font-semibold">Difficulty:</span> {difficultyOption.icon} {difficultyOption.label}
                </div>
              )}
              {formData.distanceKm && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="font-semibold">Distance:</span> {formData.distanceKm} km
                </div>
              )}
              {formData.elevationGainM && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="font-semibold">Elevation:</span> {formData.elevationGainM} m
                </div>
              )}
              {formData.estimatedDurationHours && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="font-semibold">Duration:</span> {formData.estimatedDurationHours} hrs
                </div>
              )}
              {formData.maxParticipants && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="font-semibold">Max hikers:</span> {formData.maxParticipants}
                </div>
              )}
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="font-semibold">Cost:</span> £{formData.price || 0}
              </div>
            </div>
            {selectedRequirements.length > 0 && (
              <div className="mt-4 bg-purple-50 p-3 rounded-lg">
                <p className="font-semibold text-sm mb-2">Required gear:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedRequirements.map(req => (
                    <span key={req} className="px-2 py-1 bg-white rounded-md text-xs font-medium text-gray-700 border border-purple-200">
                      {req}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between mt-8 pt-4">
          <button 
            type="button" 
            onClick={prevStep} 
            className="py-4 px-8 bg-gray-100 text-gray-700 font-bold text-lg rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" /> Back
          </button>
          <button 
            type="button" 
            className="py-4 px-10 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-lg rounded-xl hover:shadow-2xl hover:shadow-green-500/50 transition-all transform hover:scale-105 flex items-center gap-2" 
            onClick={() => handleSubmit(onFinalSubmit)()}
          >
            <Check className="h-6 w-6" /> Publish Hike Event
          </button>
        </div>
      </div>
    )
  }
