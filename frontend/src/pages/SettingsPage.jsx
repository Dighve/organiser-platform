import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSmartBack } from '../hooks/useSmartBack'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Trash2, Shield, ArrowLeft, Users, Calendar, Bell } from 'lucide-react'
import toast from 'react-hot-toast'
import { membersAPI, groupsAPI, eventsAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 ${
        checked ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
          checked ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const goBack = useSmartBack('/profile')
  const queryClient = useQueryClient()
  const { logout } = useAuthStore()
  const [deleting, setDeleting] = useState(false)

  const { data: memberData, isLoading: memberLoading } = useQuery({
    queryKey: ['currentMember'],
    queryFn: () => membersAPI.getCurrentMember().then(res => res.data),
  })

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['memberSettings'],
    queryFn: () => membersAPI.getSettings().then(res => res.data),
  })

  const { data: organisedGroupsData } = useQuery({
    queryKey: ['myOrganisedGroups'],
    queryFn: () => groupsAPI.getMyOrganisedGroups(),
    enabled: !!memberData?.hasOrganiserRole,
  })

  const { data: hostingEventsData } = useQuery({
    queryKey: ['myEventsHosting'],
    queryFn: () => eventsAPI.searchAdvancedEvents({ q: ':hosting', page: 0, size: 100 }),
    enabled: !!memberData?.id,
  })

  const updateEmailNotificationsMutation = useMutation({
    mutationFn: (enabled) => membersAPI.updateEmailNotifications(enabled),
    onSuccess: () => {
      queryClient.invalidateQueries(['currentMember'])
      toast.success('Email notification preferences updated')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update preferences')
    },
  })

  const updateSettingMutation = useMutation({
    mutationFn: (updates) => membersAPI.updateSettings(updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['memberSettings'])
      toast.success('Email notification preferences updated')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update preferences')
    },
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

  const hostingEvents = Array.isArray(hostingEventsData?.data?.content)
    ? hostingEventsData.data.content
    : Array.isArray(hostingEventsData?.data)
      ? hostingEventsData.data
      : Array.isArray(hostingEventsData)
        ? hostingEventsData
        : []

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
          onClick={goBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-purple-700 hover:text-pink-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Email Notifications Section */}
        <div className="bg-white/90 backdrop-blur shadow-xl rounded-3xl border border-slate-100 p-6 sm:p-10 mb-6">
          <div className="flex items-start gap-3">
            <Bell className="h-6 w-6 text-purple-600 mt-1 shrink-0" />
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">Email Notifications</h2>
                <p className="text-slate-600 text-sm sm:text-base">
                  Control which emails OutMeets sends you.
                </p>
              </div>

              {/* Master toggle */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">All email notifications</p>
                  <p className="text-sm text-slate-600">Master switch — turns all emails on or off</p>
                </div>
                <Toggle
                  checked={!!memberData?.emailNotificationsEnabled}
                  disabled={updateEmailNotificationsMutation.isLoading || memberLoading}
                  onChange={() => updateEmailNotificationsMutation.mutate(!memberData?.emailNotificationsEnabled)}
                />
              </div>

              {/* Sub-settings — only shown when master is on */}
              {memberData?.emailNotificationsEnabled && (
                <div className="pl-2 space-y-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Individual emails</p>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">Invitations</p>
                      <p className="text-sm text-slate-600">When someone invites you to an event or group</p>
                    </div>
                    <Toggle
                      checked={settings?.['email.invitations'] ?? true}
                      disabled={updateSettingMutation.isLoading || settingsLoading}
                      onChange={() => updateSettingMutation.mutate({ 'email.invitations': !(settings?.['email.invitations'] ?? true) })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">Review prompts</p>
                      <p className="text-sm text-slate-600">Feedback requests after an event</p>
                    </div>
                    <Toggle
                      checked={settings?.['email.reviews'] ?? true}
                      disabled={updateSettingMutation.isLoading || settingsLoading}
                      onChange={() => updateSettingMutation.mutate({ 'email.reviews': !(settings?.['email.reviews'] ?? true) })}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Account Section */}
        <div className="bg-white/90 backdrop-blur shadow-xl rounded-3xl border border-slate-100 p-6 sm:p-10 space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Delete your account</h1>
            <p className="text-slate-600 text-base sm:text-lg">
              If you delete your OutMeets account you'll need to create a new one to come back. This removes you from all future events and groups, and your past activity will be shown as "Deleted user".
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
