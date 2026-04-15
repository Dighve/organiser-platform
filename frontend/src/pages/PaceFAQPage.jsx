import { Timer, TrendingUp, AlertTriangle, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const PACE_DETAILS = [
  {
    value: 'LEISURELY',
    label: 'Leisurely',
    icon: '🐢',
    color: 'purple',
    description: 'Relaxed pace with frequent breaks and a social atmosphere',
    characteristics: [
      'Approximately 2–3 km/h average moving speed',
      'Regular stops at viewpoints, nature points, and photo spots',
      'Long breaks for lunch and rest (30–60 min total)',
      'Conversation-friendly throughout the hike',
      'No pressure to keep up — everyone moves together',
      'Ideal for beginners or those prioritising enjoyment over distance'
    ],
    whoIsItFor: [
      'First-time hikers getting started',
      'Families with children or mixed fitness levels',
      'Those recovering from injury or returning to hiking',
      'Anyone who prefers a relaxed, sociable day out'
    ],
    whatToExpect: [
      'Plenty of time to take in the scenery',
      'Frequent group pauses to regroup',
      'A welcoming, no-rush environment',
      'Hikes typically stay shorter in distance'
    ]
  },
  {
    value: 'STEADY',
    label: 'Steady',
    icon: '🚶',
    color: 'blue',
    description: 'Comfortable walking pace with regular breaks at key points',
    characteristics: [
      'Approximately 3–4 km/h average moving speed',
      'Breaks at summits, viewpoints, and natural rest points',
      'Moderate conversation possible while moving',
      'Consistent rhythm — not rushed, not dawdling',
      'Suitable for most fitness levels with some regular walking',
      'Good balance between covering ground and enjoying the route'
    ],
    whoIsItFor: [
      'Hikers with some regular walking experience',
      'Those who want to cover a meaningful distance comfortably',
      'Groups of mixed-but-reasonable fitness levels',
      'Anyone looking for a satisfying hike without feeling pushed'
    ],
    whatToExpect: [
      'A comfortable, maintainable rhythm for most of the day',
      'Stops at the most worthwhile spots',
      'Time to enjoy the surroundings without dragging',
      'The most common pace for group hikes'
    ]
  },
  {
    value: 'BRISK',
    label: 'Brisk',
    icon: '🏃',
    color: 'green',
    description: 'Purposeful pace with stops kept to summits and key waypoints only',
    characteristics: [
      'Approximately 4–5 km/h average moving speed',
      'Stops at summits and key waypoints only — minimal lingering',
      'Good fitness level expected to keep up comfortably',
      'Conversation possible but requires some effort on climbs',
      'Covers more ground in the same time as slower paces',
      'Efficient movement — purpose-driven hikers'
    ],
    whoIsItFor: [
      'Fit hikers who prefer covering ground efficiently',
      'Those who enjoy the challenge of a faster pace',
      'People targeting longer routes within a day window',
      'Experienced hikers comfortable with sustained effort'
    ],
    whatToExpect: [
      'A noticeably faster group rhythm',
      'Fewer and shorter stops',
      "More distance covered by day's end",
      'You should be able to sustain a brisk walk for several hours'
    ]
  },
  {
    value: 'FAST',
    label: 'Fast',
    icon: '⚡',
    color: 'orange',
    description: 'Demanding pace for very fit hikers — very few stops, high output',
    characteristics: [
      'Approximately 5+ km/h average moving speed',
      'Minimal stops — only at essential rest or navigation points',
      'High fitness level required to keep up without holding the group',
      'Talking while moving may be difficult on climbs',
      'Often used for long-distance or challenging routes',
      'The organiser will set a demanding pace throughout'
    ],
    whoIsItFor: [
      'Very fit and experienced hikers',
      'Those training for endurance events',
      'Hikers who want a high-output day on the hills',
      'People comfortable sustaining a fast walk for 6–8+ hours'
    ],
    whatToExpect: [
      'A demanding but rewarding day',
      'Very limited rest time — come prepared',
      'High mileage or elevation for the day',
      'You should have solid hiking experience before joining a Fast-paced hike'
    ]
  }
]

export default function PaceFAQPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 py-6 sm:py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-5 sm:mb-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-3 sm:mb-4 flex items-center gap-2 text-purple-600 hover:text-purple-800 font-semibold transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            Back
          </button>
          <div>
            <h1 className="text-xl sm:text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1 sm:mb-3">
              Hiking Pace Levels
            </h1>
            <p className="text-gray-600 text-xs sm:text-lg">
              Understanding pace levels so you know what to expect before you join
            </p>
          </div>
        </div>

        {/* Quick Reference Guide */}
        <div className="hidden sm:block bg-white rounded-2xl p-4 sm:p-6 mb-5 sm:mb-8 shadow-lg border-2 border-purple-100">
          <h2 className="text-base sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
            Quick Reference
          </h2>
          <div className="grid grid-cols-4 gap-2 sm:gap-4">
            {PACE_DETAILS.map((level) => (
              <div
                key={level.value}
                className={`p-2.5 sm:p-4 rounded-xl border-2 bg-${level.color}-50 border-${level.color}-200 text-center`}
              >
                <div className="text-2xl sm:text-4xl mb-1 sm:mb-2">{level.icon}</div>
                <p className="font-bold text-gray-900 text-xs sm:text-base">{level.label}</p>
                <p className="text-xs text-gray-600 mt-0.5 sm:mt-1 hidden sm:block">{level.description.split(' ').slice(0, 3).join(' ')}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-4 sm:space-y-6">
          {PACE_DETAILS.map((level) => (
            <div
              key={level.value}
              className={`bg-white rounded-2xl shadow-lg border-2 border-${level.color}-200 sm:hover:shadow-xl transition-shadow overflow-hidden`}
            >
              {/* Mobile header strip */}
              <div className={`sm:hidden flex items-center gap-3 px-4 py-3 bg-${level.color}-50 border-b border-${level.color}-100`}>
                <span className="text-2xl">{level.icon}</span>
                <div>
                  <h2 className="text-base font-bold text-gray-900 leading-tight">{level.label}</h2>
                  <p className="text-xs text-gray-500">{level.description}</p>
                </div>
              </div>

              <div className="p-4 sm:p-8">
                {/* Desktop header */}
                <div className="hidden sm:flex items-start gap-4 mb-6">
                  <div className="text-6xl">{level.icon}</div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{level.label}</h2>
                    <p className="text-lg text-gray-600">{level.description}</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 sm:gap-6">
                  {/* Characteristics */}
                  <div className={`bg-${level.color}-50 rounded-xl p-3 sm:p-5`}>
                    <h3 className="font-bold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">
                      Pace Characteristics
                    </h3>
                    <ul className="space-y-1 sm:space-y-2">
                      {level.characteristics.map((char, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-gray-700">
                          <span className="text-green-600 mt-0.5 flex-shrink-0">✓</span>
                          <span>{char}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Who is it for */}
                  <div className={`bg-${level.color}-50 rounded-xl p-3 sm:p-5`}>
                    <h3 className="font-bold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">
                      Who Is It For?
                    </h3>
                    <ul className="space-y-1 sm:space-y-2">
                      {level.whoIsItFor.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-gray-700">
                          <span className="text-purple-600 mt-0.5 flex-shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* What to expect */}
                <div className="mt-3 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-bold text-gray-900 mb-2 text-xs sm:text-sm">What to Expect:</h3>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {level.whatToExpect.map((item, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-white rounded-full text-xs font-medium text-gray-700 border border-gray-200"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Note */}
        <div className="mt-5 sm:mt-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 sm:p-6 border-2 border-purple-200">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="bg-purple-500 rounded-full p-2 sm:p-3 flex-shrink-0">
              <Timer className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm sm:text-lg mb-1.5 sm:mb-2">A Note on Pace</h3>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-700">
                <li>• Pace and difficulty are separate — a Leisurely hike can still be Advanced terrain, and a Fast hike can be on an easy trail</li>
                <li>• Always check both difficulty and pace when deciding if an event is right for you</li>
                <li>• If unsure, message the organiser before joining — they're happy to help</li>
                <li>• Pace is set by the organiser and reflects the group's typical tempo, not a strict rule</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
