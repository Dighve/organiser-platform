import { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { eventsAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import ProfileAvatar from '../components/ProfileAvatar'

export default function EventAttendeesPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, user } = useAuthStore()

  const initialTab = searchParams.get('tab') || 'attendees'
  const [activeTab, setActiveTab] = useState(initialTab)

  const { data: eventData } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsAPI.getEventById(id),
  })

  const { data: participantsData, isLoading } = useQuery({
    queryKey: ['eventParticipants', id],
    queryFn: () => eventsAPI.getEventParticipants(id),
  })

  const event = eventData?.data
  const participants = participantsData?.data || []

  const isHost = event && isAuthenticated && event.hostMemberId && Number(user?.id) === Number(event.hostMemberId)
  const isEventOrganiser = event && isAuthenticated && Number(user?.id) === Number(event?.organiserId)
  const isHostOrOrganiser = isHost || isEventOrganiser

  const allParticipants = participants.filter(p => p.id !== event?.hostMemberId)
  const attending = allParticipants.filter(p => !['NO_SHOW', 'WAITLISTED', 'CANCELLED'].includes(p.participationStatus))
  const waitlisted = allParticipants
    .filter(p => p.participationStatus === 'WAITLISTED')
    .sort((a, b) => new Date(a.waitlistJoinedAt) - new Date(b.waitlistJoinedAt))
  const noShows = allParticipants.filter(p => p.participationStatus === 'NO_SHOW')
  const cancelled = allParticipants.filter(p => p.participationStatus === 'CANCELLED')

  const tabs = [
    { key: 'attendees', label: 'Attending', count: attending.length },
    ...(waitlisted.length > 0 ? [{ key: 'waitlist', label: 'Waitlist', count: waitlisted.length }] : []),
    ...(isHostOrOrganiser ? [
      { key: 'noshow', label: 'No shows', count: noShows.length },
      { key: 'cancelled', label: 'Cancelled', count: cancelled.length },
    ] : []),
  ]

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 truncate">{event?.title || 'Event'}</h1>
            <p className="text-xs text-gray-500">Members</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {tabs.length > 1 && (
        <div className="border-b border-gray-100">
        <div className="max-w-2xl mx-auto flex">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.key
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 space-y-2">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
        ) : (
          <>
            {activeTab === 'attendees' && (
              attending.length > 0
                ? attending.map(p => <MemberRow key={p.id} participant={p} onClick={() => navigate(`/members/${p.id}`)} />)
                : <Empty message="No attendees yet" />
            )}

            {activeTab === 'waitlist' && (
              waitlisted.length > 0
                ? waitlisted.map((p, idx) => (
                    <div key={p.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-200 text-orange-700 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <ProfileAvatar member={p} size="md" className="flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{p.displayName || 'Anonymous'}</p>
                        <p className="text-xs text-gray-500">Joined {new Date(p.joinedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                : <Empty message="No one on the waitlist" />
            )}

            {isHostOrOrganiser && activeTab === 'noshow' && (
              noShows.length > 0
                ? noShows.map(p => <MemberRow key={p.id} participant={p} badge="No show" badgeColor="red" onClick={() => navigate(`/members/${p.id}`)} />)
                : <Empty message="No no-shows" />
            )}

            {isHostOrOrganiser && activeTab === 'cancelled' && (
              cancelled.length > 0
                ? cancelled.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl opacity-60">
                      <ProfileAvatar member={p} size="md" className="flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{p.displayName || 'Anonymous'}</p>
                        <p className="text-xs text-gray-500">
                          Left {p.cancelledAt ? new Date(p.cancelledAt).toLocaleDateString() : '—'}
                        </p>
                      </div>
                    </div>
                  ))
                : <Empty message="No cancellations" />
            )}
          </>
        )}
        </div>
      </div>
    </div>
  )
}

function MemberRow({ participant, badge, badgeColor, onClick }) {
  return (
    <div
      className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl cursor-pointer active:opacity-70"
      onClick={onClick}
    >
      <ProfileAvatar member={participant} size="md" className="flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900 text-sm truncate">{participant.displayName || 'Anonymous'}</p>
          {badge && (
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium bg-${badgeColor}-100 text-${badgeColor}-600`}>
              {badge}
            </span>
          )}
        </div>
        {participant.guestCount > 0 && (
          <p className="text-xs text-gray-500">+{participant.guestCount} guest{participant.guestCount === 1 ? '' : 's'}</p>
        )}
      </div>
    </div>
  )
}

function Empty({ message }) {
  return <p className="text-sm text-gray-500 text-center py-10">{message}</p>
}
