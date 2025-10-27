// CHUNK 2: Progress Bar
// Copy this after the goToStep function

  const renderProgressBar = () => {
    const progress = ((currentStep + 1) / Object.keys(STEPS).length) * 100
    
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {Object.keys(STEPS).map((_, index) => (
            <div key={index} className="flex items-center flex-1">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm
                ${index <= currentStep 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                  : 'bg-gray-200 text-gray-500'}
                transition-all duration-300
              `}>
                {index < currentStep ? <Check className="h-5 w-5" /> : index + 1}
              </div>
              {index < Object.keys(STEPS).length - 1 && (
                <div className={`
                  flex-1 h-1 mx-2
                  ${index < currentStep ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gray-200'}
                  transition-all duration-300
                `} />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-sm font-semibold text-gray-600">
          Step {currentStep + 1} of {Object.keys(STEPS).length}: {STEP_TITLES[currentStep]}
        </p>
      </div>
    )
  }
