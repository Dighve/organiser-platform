import React from 'react'

export default function WelcomeScreen({ onDiscoverClick }) {
  // HERO BACKGROUND - Optimized animated gradient with floating shapes
  const heroBackground = (
    <div className="absolute inset-0 -z-10 w-full h-full overflow-hidden">
      {/* Animated gradient background - GPU accelerated */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-500 via-purple-600 to-indigo-700" 
           style={{ willChange: 'transform' }} />
      {/* Overlay pattern */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />
      {/* Floating shapes - Reduced blur for better performance */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob motion-reduce:animate-none" 
           style={{ willChange: 'transform' }} />
      <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob motion-reduce:animate-none animation-delay-2000" 
           style={{ willChange: 'transform' }} />
      <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob motion-reduce:animate-none animation-delay-4000" 
           style={{ willChange: 'transform' }} />
    </div>
  )

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start text-center overflow-hidden">
      {heroBackground}
      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-4 sm:pt-10 md:pt-12 pb-3 md:pb-10 min-h-screen flex flex-col">
        {/* Mobile: Logo then Brand */}
        <div className="md:hidden flex justify-center mb-4">
          <div className="relative w-64 h-64">
            <img 
              src="/favicon1.svg" 
              alt="OutMeets" 
              className="w-full h-full object-contain drop-shadow-2xl"
            />
          </div>
        </div>
        <div className="md:hidden text-center mb-3">
          <h1 className="text-5xl font-extrabold text-white drop-shadow-2xl">
            OutMeets
          </h1>
          <div className="mt-3 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full text-white/95 font-semibold text-sm border border-white/25">
            <span>Find your people</span>
            <span className="h-1 w-1 rounded-full bg-white/70" />
            <span>Pick a trail</span>
            <span className="h-1 w-1 rounded-full bg-white/70" />
            <span>Go outside</span>
          </div>
          <h2 className="mt-4 text-4xl font-extrabold text-white drop-shadow-2xl leading-tight">
            Your next hike is
            <br />
            <span className="bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-400 bg-clip-text text-transparent">one tap away</span>
          </h2>
        </div>

        {/* Desktop Logo (unchanged layout) */}
        <div className="hidden md:flex justify-center mb-6">
          <div className="relative w-32 h-32 md:w-32 md:h-32">
            <img 
              src="/favicon1.svg" 
              alt="OutMeets" 
              className="w-full h-full object-contain drop-shadow-2xl"
            />
          </div>
        </div>

        {/* Desktop: Brand Name + Tagline */}
        <div className="hidden md:block text-center mb-5 sm:mb-6">
          <h1 className="text-5xl sm:text-5xl md:text-6xl font-extrabold text-white mb-3 drop-shadow-2xl">
            OutMeets
          </h1>
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full text-white/95 font-semibold text-sm sm:text-sm border border-white/25">
            <span>Find your people</span>
            <span className="h-1 w-1 rounded-full bg-white/70" />
            <span>Pick a trail</span>
            <span className="h-1 w-1 rounded-full bg-white/70" />
            <span>Go outside</span>
          </div>
        </div>

        {/* Desktop Main Heading */}
        <h2 className="hidden md:block text-4xl sm:text-4xl md:text-6xl font-extrabold text-white mb-3 sm:mb-4 drop-shadow-2xl leading-tight text-center">
          Your next hike is{' '}
          <br />
          <span className="bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-400 bg-clip-text text-transparent">one tap away</span>
        </h2>

        {/* Mobile Description */}
        <p className="md:hidden text-xl text-white/90 mb-4 max-w-3xl mx-auto font-light leading-relaxed text-center">
          Curated events near you, guided by real organisers. Go solo or bring friends.
        </p>

        {/* Desktop Description */}
        <p className="hidden md:block text-xl sm:text-xl md:text-2xl text-white/90 mb-5 sm:mb-8 md:mb-10 max-w-3xl mx-auto font-light leading-relaxed text-center">
          Curated events near you, guided by real organisers. Go solo or bring friends.
        </p>

        {/* Mobile Tags */}
        <div className="md:hidden flex flex-wrap items-center justify-center gap-2 mb-6">
          <div className="px-3 py-2 rounded-full bg-white/15 text-white/90 text-base font-semibold border border-white/20">Local groups</div>
          <div className="px-3 py-2 rounded-full bg-white/15 text-white/90 text-base font-semibold border border-white/20">Verified organisers</div>
          <div className="px-3 py-2 rounded-full bg-white/15 text-white/90 text-base font-semibold border border-white/20">All skill levels</div>
        </div>

        {/* Desktop Tags */}
        <div className="hidden md:flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
          <div className="px-3 sm:px-4 py-2 sm:py-2 rounded-full bg-white/15 text-white/90 text-base sm:text-sm font-semibold border border-white/20">Local groups</div>
          <div className="px-3 sm:px-4 py-2 sm:py-2 rounded-full bg-white/15 text-white/90 text-base sm:text-sm font-semibold border border-white/20">Verified organisers</div>
          <div className="px-3 sm:px-4 py-2 sm:py-2 rounded-full bg-white/15 text-white/90 text-base sm:text-sm font-semibold border border-white/20">All skill levels</div>
        </div>

        {/* Mobile Inline Button */}
        <div className="md:hidden flex justify-center mt-auto pb-2">
          <button
            onClick={onDiscoverClick}
            className="w-full max-w-md py-4 px-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-500 hover:via-pink-500 hover:to-orange-400 text-white font-extrabold rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Discover Events
          </button>
        </div>
        
        {/* Desktop Button */}
        <div className="hidden md:flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            className="w-full max-w-md py-4 px-6 bg-white text-purple-700 hover:bg-white/90 hover:text-purple-800 font-extrabold rounded-xl shadow-2xl shadow-black/20 active:scale-95 transition-all flex items-center justify-center gap-3 border border-white/60"
            onClick={onDiscoverClick}
          >
            Discover Events
            <span className="text-xl">→</span>
          </button>
        </div>
      </div>

      {/* Mobile Fixed Button removed */}
    </div>
  )
}
