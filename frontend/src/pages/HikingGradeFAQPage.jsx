import { Mountain, TrendingUp, AlertTriangle, Zap, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const DIFFICULTY_DETAILS = [
  {
    value: 'BEGINNER',
    label: 'Beginner',
    icon: '🟢',
    color: 'green',
    description: 'Perfect for first-time hikers and families',
    characteristics: [
      'Well-maintained, clearly marked trails',
      'Minimal elevation gain (under 300m)',
      'Distance typically under 8km',
      'Mostly flat or gentle slopes',
      'Wide, even paths suitable for most fitness levels',
      'Usually takes 2-3 hours'
    ],
    examples: [
      'Nature walks in local parks',
      'Coastal paths with minimal elevation',
      'Short forest trails'
    ],
    whatToBring: [
      'Comfortable walking shoes (trainers acceptable)',
      'Water (1L minimum)',
      'Light snacks',
      'Basic weather protection'
    ]
  },
  {
    value: 'INTERMEDIATE',
    label: 'Intermediate',
    icon: '🟡',
    color: 'yellow',
    description: 'For hikers with some experience',
    characteristics: [
      'Moderate elevation gain (300-600m)',
      'Distance typically 8-15km',
      'Some steep sections but well-defined paths',
      'May include uneven terrain',
      'Requires moderate fitness level',
      'Usually takes 3-5 hours'
    ],
    examples: [
      'Hill walks with steady ascents',
      'Mountain trails with moderate climbs',
      'Multi-peak circular routes'
    ],
    whatToBring: [
      'Proper hiking boots with ankle support',
      'Water (2L minimum)',
      'Packed lunch and energy snacks',
      'Weatherproof jacket and layers',
      'Basic first aid kit'
    ]
  },
  {
    value: 'ADVANCED',
    label: 'Advanced',
    icon: '🟠',
    color: 'orange',
    description: 'Challenging hikes for experienced hikers',
    characteristics: [
      'Significant elevation gain (600-1000m)',
      'Distance typically 15-25km',
      'Steep, sustained climbs',
      'Rocky, uneven terrain',
      'May include scrambling sections',
      'Requires good fitness and stamina',
      'Usually takes 5-8 hours'
    ],
    examples: [
      'Mountain summit attempts',
      'Ridge walks with exposure',
      'Multi-day hikes (single day sections)'
    ],
    whatToBring: [
      'High-quality hiking boots',
      'Water (2-3L minimum)',
      'Substantial food supplies',
      'Full weather protection system',
      'Navigation equipment (map, compass, GPS)',
      'Comprehensive first aid kit',
      'Emergency shelter',
      'Headtorch'
    ]
  },
  {
    value: 'EXPERT',
    label: 'Expert',
    icon: '🔴',
    color: 'red',
    description: 'Very challenging - for highly experienced hikers only',
    characteristics: [
      'Extreme elevation gain (over 1000m)',
      'Distance often over 25km',
      'Very steep, technical terrain',
      'Scrambling and potential rope use',
      'Exposed ridges and potentially dangerous sections',
      'Requires excellent fitness and technical skills',
      'Can take 8+ hours',
      'May involve navigation challenges'
    ],
    examples: [
      'Technical mountain ascents',
      'High-altitude challenging peaks',
      'Multi-peak traverses',
      'Winter mountain conditions'
    ],
    whatToBring: [
      'Technical hiking/mountaineering boots',
      'Hydration system (3L+)',
      'High-energy food and emergency rations',
      'Full mountain weather protection',
      'Advanced navigation tools',
      'Professional first aid and emergency kit',
      'Emergency bivvy/shelter',
      'Communication device (PLB/satellite phone)',
      'Possibly: helmet, rope, ice axe, crampons'
    ]
  }
]

export default function HikingGradeFAQPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center gap-2 text-purple-600 hover:text-purple-800 font-semibold transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4 shadow-lg">
            <Mountain className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            Hiking Difficulty Grades
          </h1>
          <p className="text-gray-600 text-lg">
            Understanding trail difficulty levels to help you choose the right hike
          </p>
        </div>

        {/* Quick Reference Guide */}
        <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg border-2 border-purple-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-purple-600" />
            Quick Reference
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {DIFFICULTY_DETAILS.map((level) => (
              <div
                key={level.value}
                className={`p-4 rounded-xl border-2 bg-${level.color}-50 border-${level.color}-200 text-center`}
              >
                <div className="text-4xl mb-2">{level.icon}</div>
                <p className="font-bold text-gray-900">{level.label}</p>
                <p className="text-xs text-gray-600 mt-1">{level.description.split(' ').slice(0, 3).join(' ')}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-6">
          {DIFFICULTY_DETAILS.map((level, index) => (
            <div
              key={level.value}
              className={`bg-white rounded-2xl p-8 shadow-lg border-2 border-${level.color}-200 hover:shadow-xl transition-shadow`}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className={`text-6xl`}>{level.icon}</div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{level.label}</h2>
                  <p className="text-lg text-gray-600">{level.description}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Characteristics */}
                <div className={`bg-${level.color}-50 rounded-xl p-5`}>
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Mountain className="h-5 w-5" />
                    Trail Characteristics
                  </h3>
                  <ul className="space-y-2">
                    {level.characteristics.map((char, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span>{char}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* What to Bring */}
                <div className={`bg-${level.color}-50 rounded-xl p-5`}>
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Essential Equipment
                  </h3>
                  <ul className="space-y-2">
                    {level.whatToBring.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-purple-600 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Examples */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2 text-sm">Typical Examples:</h3>
                <div className="flex flex-wrap gap-2">
                  {level.examples.map((example, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-700 border border-gray-200"
                    >
                      {example}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Safety Notice */}
        <div className="mt-8 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border-2 border-orange-200">
          <div className="flex items-start gap-4">
            <div className="bg-orange-500 rounded-full p-3">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Important Safety Information</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Always check weather conditions before setting out</li>
                <li>• Inform someone of your hiking plans and expected return time</li>
                <li>• Carry appropriate equipment for the difficulty level</li>
                <li>• Know your limits - it's okay to turn back if conditions deteriorate</li>
                <li>• Consider hiring a guide for Expert level hikes if you're inexperienced</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate(-1)}
            className="py-4 px-10 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Create Event
          </button>
        </div>
      </div>
    </div>
  )
}
