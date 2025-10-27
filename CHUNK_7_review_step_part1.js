// CHUNK 7: Review Step Part 1
// Copy this after the renderDetailsStep function

  const renderReviewStep = () => {
    const difficultyOption = DIFFICULTY_OPTIONS.find(opt => opt.value === formData.difficultyLevel)
    
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl mb-4 shadow-lg">
            <Check className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Review your hike</h2>
          <p className="text-gray-600">Everything look good? You can edit any section before publishing</p>
        </div>

        <div className="space-y-4">
          {/* Basics */}
          <div className="bg-white rounded-2xl p-6 border-2 border-purple-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-gray-900 text-xl flex items-center gap-2">
                <Mountain className="h-6 w-6 text-purple-600" />
                {formData.title || 'Untitled Event'}
              </h3>
              <button
                type="button"
                onClick={() => goToStep(STEPS.BASICS)}
                className="py-2 px-4 bg-purple-100 text-purple-600 hover:bg-purple-200 rounded-lg font-semibold flex items-center gap-1 text-sm transition-all"
              >
                <Edit2 className="h-4 w-4" /> Edit
              </button>
            </div>
            <div className="space-y-2 text-gray-700">
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="font-semibold">Date:</span> {formData.eventDate} at {formData.startTime}
              </p>
              {formData.description && (
                <p className="text-gray-600 mt-3 bg-gray-50 p-3 rounded-lg">{formData.description}</p>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl p-6 border-2 border-pink-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <MapPin className="h-6 w-6 text-pink-600" />
                Location
              </h3>
              <button
                type="button"
                onClick={() => goToStep(STEPS.LOCATION)}
                className="py-2 px-4 bg-pink-100 text-pink-600 hover:bg-pink-200 rounded-lg font-semibold flex items-center gap-1 text-sm transition-all"
              >
                <Edit2 className="h-4 w-4" /> Edit
              </button>
            </div>
            <p className="text-gray-700 font-medium">{formData.location || 'Not set'}</p>
            {formData.latitude && formData.longitude && (
              <p className="text-sm text-gray-500 mt-2">
                📍 {formData.latitude?.toFixed(6)}, {formData.longitude?.toFixed(6)}
              </p>
            )}
          </div>
