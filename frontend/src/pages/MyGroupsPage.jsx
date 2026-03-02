// ============================================================
// IMPORTS
// ============================================================
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groupsAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Users, Plus, Calendar, Compass } from 'lucide-react'

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function MyGroupsPage() {
  // ============================================================
  // HOOKS & ROUTING
  // ============================================================
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()  // Global auth state
  const queryClient = useQueryClient()  // React Query cache
  
  // ============================================================
  // LOCAL STATE
  // ============================================================
  // Default to 'organiser' tab if user is organiser, otherwise 'subscribed'
  const [activeTab, setActiveTab] = useState(user?.hasOrganiserRole ? 'organiser' : 'subscribed')
  
  // ============================================================
  // DATA FETCHING - Queries
  // ============================================================
  
  // Fetch user's subscribed groups
  const { data, isLoading, error } = useQuery({
    queryKey: ['myGroups'],
    queryFn: () => groupsAPI.getMyGroups(),
    enabled: isAuthenticated,
  })
  
  // Fetch user's organised groups (only if organiser)
  const { data: organisedData, isLoading: organisedLoading, error: organisedError } = useQuery({
    queryKey: ['myOrganisedGroups'],
    queryFn: () => groupsAPI.getMyOrganisedGroups(),
    enabled: isAuthenticated && Boolean(user?.hasOrganiserRole),
  })
  
  // ============================================================
  // DATA FETCHING - Mutations
  // ============================================================
  
  // Unsubscribe from a group
  const unsubscribeMutation = useMutation({
    mutationFn: (groupId) => groupsAPI.unsubscribeFromGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries(['myGroups'])
    },
  })
  
  // ============================================================
  // DERIVED STATE
  // ============================================================
  const groups = data?.data || []  // Subscribed groups
  const organisedGroups = organisedData?.data || []  // Organised groups
  
  // ============================================================
  // UNAUTHENTICATED STATE
  // ============================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 flex items-center justify-center px-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-10 text-center max-w-md">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-6">Please login to view your groups.</p>
          <button
            onClick={() => navigate('/login')}
            className="py-3 px-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }
  
  // ============================================================
  // LOADING STATE
  // ============================================================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-8">👥 Your Groups</h1>
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-100 shadow-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Loading your groups...</p>
          </div>
        </div>
      </div>
    )
  }
  
  // ============================================================
  // ERROR STATE
  // ============================================================
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-8">👥 Your Groups</h1>
          <div className="bg-red-50 backdrop-blur-sm rounded-3xl p-8 border-2 border-red-200 shadow-lg">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-red-600 font-semibold">Error loading groups: {error.message}</p>
          </div>
        </div>
      </div>
    )
  }
  
  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 pt-12 pb-20 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* ========== PAGE HEADER ========== */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">👥 Your Groups</h1>
          <div className="flex gap-2 items-center">
            {user?.hasOrganiserRole && (
              <button
                onClick={() => navigate('/groups/create')}
                className="hidden md:inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg shadow-purple-400/40 hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                <Plus className="h-5 w-5" />
                <span className="hidden sm:inline">Create group</span>
              </button>
            )}
            <button
              onClick={() => navigate('/browse-groups')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 text-white font-semibold shadow-lg shadow-orange-400/40 hover:shadow-xl hover:-translate-y-0.5 transition-all"
              aria-label="Explore groups"
            >
              <Compass className="h-5 w-5" />
              <span className="hidden sm:inline text-sm font-semibold">Explore</span>
            </button>
          </div>
        </div>
        
        {/* ========== TAB NAVIGATION ========== */}
        <div className="mb-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-2 inline-flex gap-2 border border-gray-100 shadow-lg">
            {user?.hasOrganiserRole && (
              <button
                onClick={() => setActiveTab('organiser')}
                className={`px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'organiser'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                aria-label="Organiser groups"
              >
                <span className="text-lg">💼</span>
                <span className="hidden sm:inline">Organiser</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('subscribed')}
              className={`px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'subscribed'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label="Member groups"
            >
              <span className="text-lg">🌟</span>
              <span className="hidden sm:inline">Member</span>
            </button>
          </div>
        </div>
      
      {/* ========== TAB CONTENT ========== */}
      
      {/* SUBSCRIBED GROUPS TAB - Groups user is a member of */}
      {activeTab === 'subscribed' && (
        <>
          {isLoading ? (
            <div className="card">
              <p className="text-gray-600">Loading your groups...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-16 text-center border border-gray-100 shadow-lg">
              <Users className="h-20 w-20 mx-auto text-purple-400 mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Groups Yet</h3>
              <p className="text-gray-600 mb-2">You haven't joined any groups yet.</p>
              <p className="text-sm text-gray-500">Browse groups on the home page to get started.</p>
            </div>
          ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {groups.map(group => (
            <div onClick={() => navigate(`/groups/${group.id}`)}
              key={group.id}
              className="bg-white/60 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-2xl transition-all overflow-hidden cursor-pointer hover:scale-[1.02] border border-gray-100"
            >
              {/* Group Banner */}
              <div className="relative h-28 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 overflow-hidden">
                <img 
                  src={group.bannerImage || [
                    'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=300&fit=crop',
                    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=300&fit=crop',
                    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=300&fit=crop',
                    'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600&h=300&fit=crop',
                    'https://images.unsplash.com/photo-1445308394109-4ec2920981b1?w=600&h=300&fit=crop',
                    'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=600&h=300&fit=crop'
                  ][Number.parseInt(group.id) % 6]}
                  alt={`${group.name} banner`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3 sm:p-4">
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg text-gray-900 leading-tight line-clamp-2">{group.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{group.activityName}</p>
                  </div>
                  <span className={`ml-3 px-2 py-1 text-[11px] rounded-full whitespace-nowrap ${
                    group.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {group.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {group.description || 'No description'}
                </p>
                <div className="flex items-center justify-between mb-2 text-xs text-gray-700 gap-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{group.currentMembers || 0} members</span>
                    {group.maxMembers && (
                      <span className="text-gray-500">/ {group.maxMembers}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/groups/${group.id}?tab=events`)
                      }}
                      className="h-10 w-10 rounded-lg bg-gradient-to-r from-orange-500 to-pink-600 text-white flex items-center justify-center shadow-md shadow-orange-400/40 hover:shadow-lg hover:shadow-orange-400/60 transition-all active:scale-95"
                      aria-label="View events"
                    >
                      <Calendar className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/groups/${group.id}`)
                      }}
                      className="h-10 w-10 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-md shadow-purple-400/40 hover:shadow-lg hover:shadow-purple-400/60 transition-all active:scale-95"
                      aria-label="Open group"
                    >
                      <Users className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (window.confirm('Are you sure you want to leave this group?')) {
                          unsubscribeMutation.mutate(group.id)
                        }
                      }}
                      disabled={unsubscribeMutation.isLoading}
                      className="h-10 w-10 rounded-lg bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shadow hover:bg-red-100 transition-all disabled:opacity-50 active:scale-95"
                      aria-label="Leave group"
                    >
                      <span className="text-sm font-bold">×</span>
                    </button>
                  </div>
                </div>
                {group.location && (
                  <div className="text-xs text-gray-600 flex items-center gap-1.5">
                    <span>📍</span>
                    <span className="line-clamp-1">{group.location}</span>
                  </div>
                )}
                {group.primaryOrganiserName && (
                  <div className="text-xs text-gray-600 flex items-center gap-1.5 mt-1">
                    <span>👤</span>
                    <span className="line-clamp-1">Organiser: {group.primaryOrganiserName}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
          )}
        </>
      )}
      
      {/* ORGANISER TAB - Groups user created and manages */}
      {activeTab === 'organiser' && user?.hasOrganiserRole && (
          <>
            {organisedLoading ? (
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-100 shadow-lg text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-700 font-medium">Loading your organised groups...</p>
              </div>
            ) : organisedGroups.length === 0 ? (
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-16 text-center border border-gray-100 shadow-lg">
                <Users className="h-20 w-20 mx-auto text-purple-400 mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No Groups Created</h3>
                <p className="text-gray-600 mb-6">You haven't created any groups yet.</p>
                <button
                  onClick={() => navigate('/groups/create')}
                  className="py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 inline-flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Create Group
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {organisedGroups.map(group => (
                  <div
                    key={group.id}
                    onClick={() => navigate(`/groups/${group.id}`)}
                  className="bg-white/60 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-2xl transition-all overflow-hidden cursor-pointer hover:scale-[1.02] border border-gray-100"
                >
                  {/* Group Banner */}
                  <div className="relative h-28 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 overflow-hidden">
                  <img 
                    src={group.bannerImage || [
                      'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=300&fit=crop',
                        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=300&fit=crop',
                        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=300&fit=crop',
                        'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600&h=300&fit=crop',
                        'https://images.unsplash.com/photo-1445308394109-4ec2920981b1?w=600&h=300&fit=crop',
                        'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=600&h=300&fit=crop'
                      ][Number.parseInt(group.id) % 6]}
                      alt={`${group.name} banner`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 sm:p-4">
                    <div className="flex items-start justify-between mb-2.5">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base sm:text-lg text-gray-900 leading-tight line-clamp-2">{group.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{group.activityName}</p>
                      </div>
                      <span className={`ml-3 px-2 py-1 text-[11px] rounded-full whitespace-nowrap ${
                        group.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {group.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {group.description || 'No description'}
                    </p>
                    <div className="flex items-center justify-between mb-2 text-xs text-gray-700 gap-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{group.currentMembers || 0} members</span>
                        {group.maxMembers && (
                          <span className="text-gray-500">/ {group.maxMembers}</span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/create-event?groupId=${group.id}`)
                        }}
                        className="h-10 w-10 rounded-lg bg-gradient-to-r from-orange-500 to-pink-600 text-white flex items-center justify-center shadow-md shadow-orange-400/40 hover:shadow-lg hover:shadow-orange-400/60 transition-all active:scale-95"
                        aria-label="Create event"
                      >
                        <Calendar className="h-4 w-4" />
                      </button>
                    </div>
                    {group.location && (
                      <div className="text-xs text-gray-600 flex items-center gap-1.5">
                        <span>📍</span>
                        <span className="line-clamp-1">{group.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            )}
          </>
        )}
      </div>

      {/* Fixed Create button for organisers (mobile) */}
      {user?.hasOrganiserRole && (
        <div className="md:hidden fixed inset-x-0 bottom-0 z-40 px-4 sm:px-6 pb-4">
          <div className="max-w-4xl mx-auto rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-xl px-4 sm:px-6 py-3">
            <button
              onClick={() => navigate('/groups/create')}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg shadow-purple-400/50 hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              Create group
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
