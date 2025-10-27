// CHUNK 5: Details Step Part 1 (Difficulty & Trail Stats)
// Copy this after the renderLocationStep function

  const renderDetailsStep = () => (
    <form onSubmit={handleSubmit(onStepSubmit)} className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl mb-4 shadow-lg">
          <Compass className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Add hike details</h2>
        <p className="text-gray-600">Help hikers prepare for your adventure</p>
      </div>

      {/* Difficulty Level */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-6 border-2 border-orange-200">
        <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-orange-600" />
          Difficulty level
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {DIFFICULTY_OPTIONS.map(opt => (
            <label key={opt.value} className="relative cursor-pointer">
              <input
                type="radio"
                {...register('difficultyLevel')}
                value={opt.value}
                className="peer sr-only"
              />
              <div className="bg-white border-2 border-gray-300 rounded-xl p-4 hover:border-orange-500 peer-checked:border-orange-500 peer-checked:bg-orange-50 transition-all">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{opt.icon}</span>
                  <span className="font-bold text-gray-900">{opt.label}</span>
                </div>
                <p className="text-sm text-gray-600">{opt.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Hike Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
        <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Trail statistics
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Distance (km)</label>
            <input 
              {...register('distanceKm')} 
              type="number" 
              step="0.1" 
              min="0" 
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all bg-white" 
              placeholder="12.5" 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Elevation gain (m)</label>
            <input 
              {...register('elevationGainM')} 
              type="number" 
              min="0" 
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all bg-white" 
              placeholder="500" 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (hours)</label>
            <input 
              {...register('estimatedDurationHours')} 
              type="number" 
              step="0.5" 
              min="0" 
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all bg-white" 
              placeholder="5" 
            />
          </div>
        </div>
      </div>
