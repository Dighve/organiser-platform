// CHUNK 3: Basics Step
// Copy this after the renderProgressBar function

  const renderBasicsStep = () => (
    <form onSubmit={handleSubmit(onStepSubmit)} className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4 shadow-lg">
          <Mountain className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">What's your hike about?</h2>
        <p className="text-gray-600">Give your hiking event a clear, descriptive name and date</p>
      </div>

      <div>
        <label htmlFor="title" className="block text-base font-bold text-gray-900 mb-3">
          Event title *
        </label>
        <input
          {...register('title', { required: 'Event title is required' })}
          type="text"
          className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium transition-all"
          placeholder="e.g., Sunday Morning Hike in Peak District"
        />
        {errors.title && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><span>⚠️</span>{errors.title.message}</p>}
        <p className="text-sm text-gray-500 mt-2">Choose a name that clearly describes your hike</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label htmlFor="eventDate" className="block text-base font-bold text-gray-900 mb-3">Date *</label>
          <input 
            {...register('eventDate', { required: 'Event date is required' })} 
            type="date" 
            className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium transition-all" 
          />
          {errors.eventDate && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><span>⚠️</span>{errors.eventDate.message}</p>}
        </div>
        <div>
          <label htmlFor="startTime" className="block text-base font-bold text-gray-900 mb-3">Start time *</label>
          <input 
            {...register('startTime', { required: 'Start time is required' })} 
            type="time" 
            className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium transition-all" 
          />
          {errors.startTime && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><span>⚠️</span>{errors.startTime.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-base font-bold text-gray-900 mb-3">
          Description
        </label>
        <textarea 
          {...register('description')} 
          className="w-full px-4 py-4 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium transition-all min-h-[120px] resize-none" 
          placeholder="Describe your hike, meeting point, what to expect..."
        />
        <p className="text-sm text-gray-500 mt-2">Help hikers know what to expect on this adventure</p>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="py-4 px-10 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center gap-2"
          disabled={!watchedValues.title || !watchedValues.eventDate || !watchedValues.startTime}
        >
          Continue <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </form>
  )
