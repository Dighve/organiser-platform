import { useNavigate } from 'react-router-dom'
import { Mountain, Users, MapPin, ArrowRight, ChevronRight } from 'lucide-react'

const HIKING_AREAS = [
  {
    name: 'Surrey Hills',
    description: 'An Area of Outstanding Natural Beauty just 30–50 minutes from London. Box Hill, Leith Hill, and Holmbury Hill offer sweeping views across the Weald with well-marked trails for all abilities.',
    travelTime: '~35 min from London Bridge',
    grade: 'Beginner to Advanced',
  },
  {
    name: 'Chilterns',
    description: 'Rolling chalk hills with ancient beech woodland stretching from the Thames Valley to Luton. Classic routes include the Ridgeway, Ivinghoe Beacon, and the Hambleden Valley.',
    travelTime: '~45 min from Marylebone',
    grade: 'Beginner to Intermediate',
  },
  {
    name: 'South Downs',
    description: 'England\'s newest National Park, with open downland, dramatic coastal cliffs, and the iconic Seven Sisters. Excellent long-distance routes from Eastbourne to Winchester.',
    travelTime: '~1 hr from Victoria',
    grade: 'Intermediate to Advanced',
  },
  {
    name: 'North Downs Way',
    description: 'A 246-km National Trail running through Kent and Surrey. Day sections from Farnham to Guildford or along the Pilgrim\'s Way offer varied terrain close to London.',
    travelTime: '~40 min from Waterloo',
    grade: 'Beginner to Intermediate',
  },
]

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Browse upcoming hikes',
    description: 'Find day hikes organised by local hiking groups, filtered by date, difficulty, and location.',
  },
  {
    step: '2',
    title: 'Join the event',
    description: 'Sign up with one tap. The organiser confirms your spot and shares meeting point details.',
  },
  {
    step: '3',
    title: 'Meet and hike',
    description: 'Meet at the trailhead, hike with the group, and discover great trails near London.',
  },
]

const DIFFICULTY_SUMMARY = [
  { label: 'Beginner', icon: '🟢', desc: 'Under 8km, flat to gentle. Perfect for first-timers.' },
  { label: 'Intermediate', icon: '🟡', desc: '8–15km, moderate ascents. Some hiking experience helpful.' },
  { label: 'Advanced', icon: '🟠', desc: '15–25km, significant climbs. Good fitness required.' },
]

export default function LondonDayHikesPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30">

      {/* Hero */}
      <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <nav className="text-sm mb-6 text-white/70">
            <button onClick={() => navigate('/')} className="hover:text-white transition-colors">Home</button>
            <ChevronRight className="inline h-3 w-3 mx-1" />
            <span className="text-white">Day Hikes from London</span>
          </nav>
          <div className="flex items-start gap-4 mb-6">
            <Mountain className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 mt-1" />
            <div>
              <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-4">
                Day Hikes from London
              </h1>
              <p className="text-lg sm:text-xl text-white/90 max-w-2xl">
                Join organised hiking groups exploring the best trails within two hours of London.
                Surrey Hills, Chilterns, South Downs, and more — all abilities welcome.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/events')}
            className="inline-flex items-center gap-2 bg-white text-purple-700 font-bold px-6 py-3 rounded-xl hover:bg-purple-50 transition-colors text-sm sm:text-base"
          >
            Browse upcoming hikes
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-14 sm:space-y-20">

        {/* What is OutMeets */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-4">
            Hiking groups for day hikes from London
          </h2>
          <div className="prose prose-gray max-w-none text-gray-600 space-y-4 text-base sm:text-lg">
            <p>
              OutMeets is a platform for finding and joining organised day hikes from London.
              Local hiking groups post upcoming events — you browse by date, difficulty, and destination,
              then join the ones that suit you.
            </p>
            <p>
              Whether you&apos;re new to hiking and looking for a welcoming beginner group, or an
              experienced hiker wanting to tackle a long-distance challenge, there&apos;s a hike for you.
              All events are led by experienced group organisers who know the routes and keep the group together.
            </p>
            <p>
              Groups typically depart from a London train station or directly from a trailhead car park,
              making it easy to reach great hiking countryside without a car.
            </p>
          </div>
        </section>

        {/* Hiking Areas */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
            Popular hiking areas from London
          </h2>
          <p className="text-gray-500 mb-8 text-base sm:text-lg">
            The best walking countryside is within an hour by train from central London.
          </p>
          <div className="grid sm:grid-cols-2 gap-5">
            {HIKING_AREAS.map((area) => (
              <div key={area.name} className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-purple-100 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <MapPin className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{area.name}</h3>
                    <p className="text-xs text-purple-600 font-medium">{area.travelTime}</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-3">{area.description}</p>
                <span className="inline-block text-xs font-semibold bg-purple-50 text-purple-700 px-3 py-1 rounded-full">
                  {area.grade}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Difficulty levels */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
            Hikes for every ability level
          </h2>
          <p className="text-gray-500 mb-7 text-base sm:text-lg">
            Every event is graded so you know exactly what to expect before you sign up.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mb-5">
            {DIFFICULTY_SUMMARY.map((level) => (
              <div key={level.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                <div className="text-3xl mb-2">{level.icon}</div>
                <p className="font-bold text-gray-900 mb-1">{level.label}</p>
                <p className="text-xs text-gray-500">{level.desc}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/hiking-grade-faq')}
            className="text-sm text-purple-600 font-semibold hover:text-purple-800 transition-colors flex items-center gap-1"
          >
            Full difficulty grade guide
            <ArrowRight className="h-4 w-4" />
          </button>
        </section>

        {/* How it works */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-8">
            How to join a hiking group from London
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-extrabold flex items-center justify-center text-lg">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Why join a group */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-purple-100">
          <div className="flex items-start gap-4">
            <Users className="h-8 w-8 text-purple-500 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-3">
                Why hike with a group?
              </h2>
              <ul className="space-y-2 text-gray-600 text-sm sm:text-base">
                <li className="flex items-start gap-2"><span className="text-purple-500 font-bold mt-0.5">•</span> Safer and more enjoyable than hiking alone on unfamiliar trails</li>
                <li className="flex items-start gap-2"><span className="text-purple-500 font-bold mt-0.5">•</span> Routes are planned and led by experienced organisers who know the terrain</li>
                <li className="flex items-start gap-2"><span className="text-purple-500 font-bold mt-0.5">•</span> Meet other hikers in London and make friends who share the same interests</li>
                <li className="flex items-start gap-2"><span className="text-purple-500 font-bold mt-0.5">•</span> No need to plan anything yourself — just show up and hike</li>
                <li className="flex items-start gap-2"><span className="text-purple-500 font-bold mt-0.5">•</span> Consistent pace kept so the group stays together throughout</li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">
            Ready to find your next day hike from London?
          </h2>
          <p className="text-gray-500 mb-7 text-base sm:text-lg max-w-xl mx-auto">
            Browse upcoming hikes, pick one that suits you, and join in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/events')}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold px-8 py-3.5 rounded-xl hover:opacity-90 transition-opacity text-base"
            >
              Browse upcoming hikes
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate('/groups')}
              className="inline-flex items-center justify-center gap-2 bg-white border-2 border-purple-200 text-purple-700 font-bold px-8 py-3.5 rounded-xl hover:bg-purple-50 transition-colors text-base"
            >
              Explore hiking groups
            </button>
          </div>
        </section>

      </div>
    </div>
  )
}
