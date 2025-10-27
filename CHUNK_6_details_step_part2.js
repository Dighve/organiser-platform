// CHUNK 6: Details Step Part 2 (Activity Type, Gear, Additional Fields & Buttons)
// Copy this immediately after CHUNK 5 (continues the renderDetailsStep function)

      {/* Activity Type & Group Size */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-base font-bold text-gray-900 mb-3">Activity type *</label>
          {activitiesLoading ? (
            <div className="flex items-center gap-2 text-gray-500 py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
              <p>Loading...</p>
            </div>
          ) : (
            <select 
              {...register('activityTypeId', { required: 'Activity type is required' })} 
              className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium transition-all bg-white text-base"
            >
              <option value="">Select activity</option>
              {activities.map(activity => (
                <option key={activity.id} value={activity.id}>
                  {activity.name}
                </option>
              ))}
            </select>
          )}
          {errors.activityTypeId && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><span>⚠️</span>{errors.activityTypeId.message}</p>}
        </div>
        <div>
          <label className="block text-base font-bold text-gray-900 mb-3">Max participants</label>
          <input 
            {...register('maxParticipants')} 
            type="number" 
            min="1" 
            className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium transition-all" 
            placeholder="20" 
          />
        </div>
      </div>

      {/* Required Gear */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
        <h3 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
          <Mountain className="h-5 w-5 text-purple-600" />
          Required gear
        </h3>
        <p className="text-sm text-gray-600 mb-4">Select items hikers should bring</p>
        <div className="grid grid-cols-2 gap-2">
          {HIKING_REQUIREMENTS.map(req => (
            <label key={req} className="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-200 hover:border-purple-400 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={selectedRequirements.includes(req)}
                onChange={() => toggleRequirement(req)}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-700">{req}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Additional Info */}
      <div className="space-y-4">
        <div>
          <label className="block text-base font-bold text-gray-900 mb-3">
            <DollarSign className="inline h-5 w-5 text-green-600 mr-1" />
            Cost per person (£)
          </label>
          <input 
            {...register('price')} 
            type="number" 
            step="0.01" 
            min="0" 
            className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium transition-all" 
            placeholder="0.00" 
          />
          <p className="text-sm text-gray-500 mt-2">Leave as 0 if the hike is free</p>
        </div>

        <div>
          <label className="block text-base font-bold text-gray-900 mb-3">Event image URL</label>
          <input 
            {...register('imageUrl')} 
            type="url" 
            className="w-full px-4 py-4 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium transition-all" 
            placeholder="https://example.com/image.jpg" 
          />
        </div>

        <div>
          <label className="block text-base font-bold text-gray-900 mb-3">Registration deadline</label>
          <input 
            {...register('registrationDeadline')} 
            type="date" 
            className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium transition-all" 
          />
          <p className="text-sm text-gray-500 mt-2">Optional: Set a deadline for participants to register</p>
        </div>
      </div>

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
          disabled={!watchedValues.activityTypeId}
        >
          Continue <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </form>
  )
