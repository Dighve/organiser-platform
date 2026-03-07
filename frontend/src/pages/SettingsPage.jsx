import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Trash2, Shield, ArrowLeft, Users, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { membersAPI, groupsAPI, eventsAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'

export default function SettingsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { logout } = useAuthStore()
  const [deleting, setDeleting] = useState(false)

  const { data: memberData, isLoading: memberLoading } = useQuery({
    queryKey: ['currentMember'],
    queryFn: () => membersAPI.getCurrentMember().then(res => res.data),
  })

  const { data: organisedGroupsData } = useQuery({
    queryKey: ['myOrganisedGroups'],
    queryFn: () => groupsAPI.getMyOrganisedGroups(),
    enabled: !!memberData?.hasOrganiserRole,
  })

  const { data: myEventsData } = useQuery({
    queryKey: ['myEventsHosting'],
    queryFn: () => eventsAPI.getMyEvents(),
    enabled: !!memberData?.id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => membersAPI.deleteProfile(),
    onSuccess: () => {
      toast.success('Account deleted. You have been logged out.')
      queryClient.clear()
      logout()
      navigate('/')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Unable to delete account right now.')
    },
    onSettled: () => setDeleting(false),
  })

  const organisedGroups = Array.isArray(organisedGroupsData?.data)
    ? organisedGroupsData.data
    : Array.isArray(organisedGroupsData)
      ? organisedGroupsData
      : []

  const eventsCandidate = myEventsData?.data?.content ?? myEventsData?.data ?? myEventsData ?? []
  const rawEvents = Array.isArray(eventsCandidate) ? eventsCandidate : []

  const now = Date.now()
  const hostingEvents = rawEvents.filter((ev) => {
    if (!(ev.hostMemberId && memberData?.id && Number(ev.hostMemberId) === Number(memberData.id))) return false
    if (!ev.eventDate) return true
    const ts = Date.parse(ev.eventDate)
    if (Number.isNaN(ts)) return true
    return ts > now
  })

  const formatDate = (iso) => {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
      }).format(new Date(iso))
    } catch {
      return iso
    }
  }

  const handleDelete = () => {
    if ((memberData?.hasOrganiserRole && organisedGroups?.length) || hostingEvents.length) return
    setDeleting(true)
    deleteMutation.mutate()
  }

  const isBlocked = (memberData?.hasOrganiserRole && organisedGroups?.length) || hostingEvents.length

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-purple-50/20 to-pink-50/10">
      <div className="max-w-4xl mx-auto px-4 py-10 sm:py-14">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-purple-700 hover:text-pink-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="bg-white/90 backdrop-blur shadow-xl rounded-3xl border border-slate-100 p-6 sm:p-10 space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Delete your account</h1>
            <p className="text-slate-600 text-base sm:text-lg">
              If you delete your OutMeets account you’ll need to create a new one to come back. This removes you from all future events and groups, and your past activity will be shown as “Deleted user”.
            </p>
          </div>

          {isBlocked ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <Shield className="h-5 w-5 text-amber-700 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800">You must transfer ownership before deleting.</p>
                  <p className="text-sm text-amber-700">Transfer your organiser role for these groups, or email support@outmeets.com for help.</p>
                  <p className="text-sm text-amber-700 mt-1">If you are hosting any upcoming events, change the host to another member before deletion.</p>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900">Your groups</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {organisedGroups?.map((group) => (
                    <a
                      key={group.id}
                      href={`/groups/${group.id}`}
                      className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-3 shadow-sm hover:border-purple-200 hover:shadow-md transition"
                    >
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white grid place-items-center text-lg font-bold">
                        {group.name?.charAt(0)?.toUpperCase() || 'G'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 whitespace-normal break-words leading-snug line-clamp-2">
                          {group.name}
                        </p>
                        <p className="text-sm text-slate-500 truncate">Organiser</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {hostingEvents.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-slate-900">Events you are hosting</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {hostingEvents.map((ev) => (
                      <a
                        key={ev.id}
                        href={`/events/${ev.id}`}
                        className="w-full flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-3 shadow-sm hover:border-purple-200 hover:shadow-md transition"
                      >
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white grid place-items-center">
                          <Calendar className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 whitespace-normal break-words leading-snug line-clamp-2">
                            {ev.title}
                          </p>
                          <p className="text-sm text-slate-500 truncate">{formatDate(ev.eventDate)}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-slate-700">
                <AlertTriangle className="h-5 w-5 text-purple-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-base">This action is permanent. Your profile photo, name, and email will be removed. Past content will display as “Deleted user”.</p>
                  <p className="text-sm text-slate-600">If you currently host any upcoming events, change the host to another organiser before deleting.</p>
                </div>
              </div>
              <button
                onClick={handleDelete}
                disabled={deleting || memberLoading}
                className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 bg-[#EF4444] text-white font-semibold shadow-md hover:bg-[#DC2626] disabled:opacity-60"
              >
                <Trash2 className="h-5 w-5" />
                {deleting ? 'Deleting...' : 'Delete account'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
