import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { trackAPIError } from './analytics'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

// Retry configuration
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second
const RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504]

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState()
    
    // Add token to request if it exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Track if we're currently refreshing to prevent multiple refresh requests
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Helper function to wait before retry
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Response interceptor to handle errors and automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const { refreshToken, logout, login } = useAuthStore.getState()
    
    // Track API errors in analytics
    if (error.response) {
      trackAPIError(
        originalRequest.url,
        error.response.status,
        error.response.data?.message || error.message
      )
    } else if (error.code === 'ECONNABORTED') {
      trackAPIError(originalRequest.url, 0, 'Request timeout')
    } else if (error.code === 'ERR_NETWORK') {
      trackAPIError(originalRequest.url, 0, 'Network error')
    }
    
    // Handle 401 Unauthorized responses
    if (error.response?.status === 401 && refreshToken && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Attempt to refresh the token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken
        })

        const { token: newToken, refreshToken: newRefreshToken, userId, email, role, hasOrganiserRole } = response.data
        
        // Update store with new tokens (preserve hasOrganiserRole from refresh response)
        login(
          { id: userId, email, role, hasOrganiserRole },
          newToken,
          newRefreshToken
        )

        // Update the failed request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        
        // Process queued requests
        processQueue(null, newToken)
        isRefreshing = false
        
        // Retry the original request
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed, log out user
        processQueue(refreshError, null)
        isRefreshing = false
        logout('Your session has expired. Please log in again.')
        return Promise.reject(refreshError)
      }
    }
    
    // Retry logic for network errors and specific status codes
    const retryCount = originalRequest.__retryCount || 0
    const shouldRetry = 
      retryCount < MAX_RETRIES &&
      (
        !error.response || // Network error
        RETRY_STATUS_CODES.includes(error.response.status) ||
        error.code === 'ECONNABORTED' || // Timeout
        error.code === 'ERR_NETWORK' // Network error
      ) &&
      originalRequest.method?.toLowerCase() === 'get' // Only retry GET requests
    
    if (shouldRetry) {
      originalRequest.__retryCount = retryCount + 1
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = RETRY_DELAY * Math.pow(2, retryCount)
      
      if (import.meta.env.DEV) {
        console.debug(`[API] Retrying request (${retryCount + 1}/${MAX_RETRIES}) after ${delay}ms:`, originalRequest.url)
      }
      
      await wait(delay)
      return api(originalRequest)
    }
    
    // For other errors or if no refresh token, just reject
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  requestMagicLink: (data) => api.post('/auth/magic-link', data),
  verifyMagicLink: (token, inviteToken) => {
    const params = new URLSearchParams({ token })
    if (inviteToken) params.append('inviteToken', inviteToken)
    return api.get(`/auth/verify?${params.toString()}`)
  },
  authenticateWithGoogle: (data) => api.post('/auth/google', data), // Google OAuth
  requestPasscode: (data) => api.post('/auth/passcode', data),
  verifyPasscode: (email, code, inviteToken) => api.post('/auth/passcode/verify', { email, code, inviteToken }),
}

// Events API
export const eventsAPI = {
  getUpcomingEvents: (page = 0, size = 20) =>
    api.get(`/events/public?page=${page}&size=${size}`),
  searchAdvancedEvents: ({ q = '', page = 0, size = 20 }) =>
    api.get(`/events/search`, { params: { q, page, size } }),
  
  getEventById: (id) => api.get(`/events/public/${id}`),
  
  searchEvents: (keyword, page = 0, size = 20) =>
    api.get(`/events/public/search?keyword=${keyword}&page=${page}&size=${size}`),
  
  getEventsByActivity: (activityTypeId, page = 0, size = 20) =>
    api.get(`/events/public/activity/${activityTypeId}?page=${page}&size=${size}`),
  
  getEventsByGroup: (groupId, page = 0, size = 50) =>
    api.get(`/events/public/group/${groupId}?page=${page}&size=${size}`),
  
  createEvent: (data) => api.post('/events', data),
  
  updateEvent: (id, data) => api.put(`/events/${id}`, data),
  
  publishEvent: (id) => api.post(`/events/${id}/publish`),
  
  joinEvent: (id, payload = {}) => api.post(`/events/${id}/join`, payload),
  
  leaveEvent: (id) => api.post(`/events/${id}/leave`),
  
  deleteEvent: (id) => api.delete(`/events/${id}`),
  
  // Get events where user is a participant (joined events)
  getMyEvents: (page = 0, size = 20, past = false) =>
    api.get(`/events/my-joined-events?page=${page}&size=${size}&past=${past}`),
  
  // Get events created by the organiser
  getMyOrganisedEvents: (page = 0, size = 20) =>
    api.get(`/events/organiser/my-events?page=${page}&size=${size}`),
  
  getEventParticipants: (id) => api.get(`/events/public/${id}/participants`),

  markNoShow: (eventId, memberId) => api.post(`/events/${eventId}/participants/${memberId}/no-show`),
  unmarkNoShow: (eventId, memberId) => api.delete(`/events/${eventId}/participants/${memberId}/no-show`),

  getCalendarData: (id) => api.get(`/events/public/${id}/calendar`),

  getOfflineBundle: (id) => api.get(`/events/${id}/offline-bundle`),
}

// Comments API
export const commentsAPI = {
  // Get all comments for an event
  getEventComments: (eventId) => api.get(`/events/${eventId}/comments`),
  
  // Create a new comment
  createComment: (eventId, data) => api.post(`/events/${eventId}/comments`, data),
  
  // Update a comment
  updateComment: (commentId, data) => api.put(`/events/comments/${commentId}`, data),
  
  // Delete a comment
  deleteComment: (commentId) => api.delete(`/events/comments/${commentId}`),
  
  // Create a reply to a comment
  createReply: (commentId, data) => api.post(`/events/comments/${commentId}/replies`, data),
  
  // Update a reply
  updateReply: (replyId, data) => api.put(`/events/replies/${replyId}`, data),
  
  // Delete a reply
  deleteReply: (replyId) => api.delete(`/events/replies/${replyId}`),

  // Toggle pin on a comment (host only)
  pinComment: (commentId) => api.post(`/events/comments/${commentId}/pin`),
}

// Activity Types API
export const activityTypesAPI = {
  getAll: () => api.get('/activities/public'),
}

// Groups API
export const groupsAPI = {
  getMyGroups: () => api.get('/groups/my-groups'),
  
  getMyOrganisedGroups: () => api.get('/groups/my-organised-groups'),
  
  getAllPublicGroups: () => api.get('/groups/public'),
  
  getGroupById: (groupId) => api.get(`/groups/${groupId}`),
  
  subscribeToGroup: (groupId) => api.post(`/groups/${groupId}/subscribe`),
  
  unsubscribeFromGroup: (groupId) => api.post(`/groups/${groupId}/unsubscribe`),
  
  createGroup: (data) => api.post('/groups', data),
  
  updateGroup: (groupId, data) => api.put(`/groups/${groupId}`, data),
  
  permanentlyDeleteGroup: (groupId) => api.delete(`/groups/${groupId}/permanent`),
  
  getGroupMembers: (groupId) => api.get(`/groups/${groupId}/members`),
  
  removeMember: (groupId, memberId) => 
    api.post(`/groups/${groupId}/remove/${memberId}`),
  
  banMember: (groupId, memberId, reason) => 
    api.post(`/groups/${groupId}/ban/${memberId}`, null, { params: { reason } }),
  
  sendInvitations: (data) => api.post('/groups/invitations', data),
  
  unbanMember: (groupId, memberId) => 
    api.post(`/groups/${groupId}/unban/${memberId}`),
  
  getBannedMembers: (groupId) => api.get(`/groups/${groupId}/banned-members`),
  
  transferOwnership: (groupId, newOrganiserId) => 
    api.post(`/groups/${groupId}/transfer-ownership/${newOrganiserId}`),
}

// Members API
export const membersAPI = {
  becomeOrganiser: () => api.post('/members/become-organiser'),
  
  getCurrentMember: () => api.get('/members/me'),
  
  getMemberById: (memberId) => api.get(`/members/${memberId}`),
  
  getAllMembers: (params) => api.get('/members', { params }),
  
  updateProfile: (data) => api.put('/members/me', data),

  updateEmailNotifications: (enabled) => api.put('/members/me/email-notifications', { enabled }),

  getSettings: () => api.get('/members/me/settings'),

  updateSettings: (updates) => api.put('/members/me/settings', updates),

  deleteProfile: () => api.delete('/members/me'),

  // Contact info
  getMyContacts: () => api.get('/members/me/contacts'),
  updateMyContacts: (data) => api.put('/members/me/contacts', data),
  getMemberContacts: (memberId) => api.get(`/members/${memberId}/contacts`),
}

// Legal API
export const legalAPI = {
  acceptOrganiserAgreement: (data) => api.post('/legal/accept-organiser-agreement', data),
  
  hasAcceptedOrganiserAgreement: () => api.get('/legal/has-accepted-organiser-agreement'),
  
  acceptUserAgreement: (data) => api.post('/legal/accept-user-agreement', data),
  
  hasAcceptedUserAgreement: () => api.get('/legal/has-accepted-user-agreement'),
  
  // New agreement text endpoints for frontend validation
  getCurrentOrganiserAgreement: () => api.get('/agreements/organiser/current'),
  
  getCurrentUserAgreement: () => api.get('/agreements/user/current'),
  
  verifyAgreementHash: (data) => api.post('/agreements/verify-hash', data),
}

// Admin API
export const adminAPI = {
  getUserStats: () => api.get('/admin/stats/users'),
  
  getRecentUsers: (limit = 50) => api.get('/admin/users/recent', { params: { limit } }),
  
  checkAdminStatus: () => api.get('/admin/check'),
  
  // Agreement Management APIs
  getAllAgreements: () => api.get('/admin/agreements'),
  
  getCurrentAgreement: (agreementType) => api.get(`/admin/agreements/${agreementType}/current`),
  
  updateAgreement: (data) => api.put('/admin/agreements', data),
  
  getAgreementHistory: (agreementType, limit = 10) => 
    api.get(`/admin/agreements/${agreementType}/history?limit=${limit}`),

  // Feedback
  getFeedback: () => api.get('/feedback/admin'),
  updateFeedback: (id, params) => api.patch(`/feedback/admin/${id}`, null, { params }),
  
  // User Management
  inviteUserToOrganiser: (memberId) => api.post(`/admin/users/${memberId}/invite-organiser`),
  
  // Organiser Management
  getOrganiserStats: (memberId) => api.get(`/admin/users/${memberId}/organiser-stats`),
  revokeOrganiserRole: (memberId) => api.post(`/admin/users/${memberId}/revoke-organiser`),
  transferGroupsAndRevoke: (oldOrganiserId, newOrganiserId) => 
    api.post(`/admin/users/${oldOrganiserId}/transfer-groups`, { newOrganiserId }),
  
  // Member Management
  deleteMember: (memberId) => api.delete(`/admin/users/${memberId}`),
  
  // Organiser Invites
  generateInvite: (note, expiryHours) => api.post('/admin/invites', { note, expiryHours }),
  listInvites: () => api.get('/admin/invites'),
}

// Public Invite API (no auth required — used by InvitePage)
export const invitesAPI = {
  validateInvite: (token) => api.get(`/admin/invites/validate/${token}`),
}

// Feedback API (user)
export const feedbackAPI = {
  submit: (data) => api.post('/feedback', data),
  uploadScreenshot: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/files/upload/feedback', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

// Notifications API
export const notificationsAPI = {
  getNotifications: (page = 0, size = 20) => 
    api.get(`/notifications?page=${page}&size=${size}`),
  
  getUnreadCount: () => api.get('/notifications/unread-count'),
  
  markAsRead: (notificationId) => 
    api.put(`/notifications/${notificationId}/read`),
  
  markAllAsRead: () => api.put('/notifications/read-all'),
  
  deleteNotification: (notificationId) => 
    api.delete(`/notifications/${notificationId}`),
}

// Feature Flags API
export const featureFlagsAPI = {
  // Get feature flags as a map for frontend consumption (public endpoint)
  getFeatureFlagsMap: async () => {
    const response = await api.get('/admin/feature-flags/map')
    return response.data
  },
  
  // Admin endpoints for managing feature flags
  getAllFeatureFlags: async () => {
    const response = await api.get('/admin/feature-flags')
    return response.data
  },
  
  getFeatureFlagByKey: async (flagKey) => {
    const response = await api.get(`/admin/feature-flags/${flagKey}`)
    return response.data
  },
  
  updateFeatureFlag: async (flagKey, isEnabled) => {
    const response = await api.put(`/admin/feature-flags/${flagKey}`, { isEnabled })
    return response.data
  },
}

// Reviews API
export const reviewsAPI = {
  // Submit a review for an event
  submitReview: (eventId, data) => api.post(`/events/${eventId}/reviews`, data),
  
  // Get current user's review for an event
  getMyReviewForEvent: (eventId) => api.get(`/events/${eventId}/reviews/my-review`),
  
  // Get all reviews for an event
  getEventReviews: (eventId, page = 0, size = 20) => 
    api.get(`/events/${eventId}/reviews?page=${page}&size=${size}`),
  
  // Get all reviews for a group
  getGroupReviews: (groupId, page = 0, size = 20) => 
    api.get(`/groups/${groupId}/reviews?page=${page}&size=${size}`),
  
  // Get group rating summary
  getGroupRating: (groupId) => api.get(`/groups/${groupId}/rating`),
  
  // Update own review
  updateReview: (reviewId, data) => api.put(`/reviews/${reviewId}`, data),
  
  // Delete own review
  deleteReview: (reviewId) => api.delete(`/reviews/${reviewId}`),
  
  // Get pending reviews for current user
  getPendingReviews: () => api.get('/reviews/pending'),

  // Dismiss a review prompt so it never shows again
  dismissReviewPrompt: (eventId) => api.post(`/reviews/dismiss/${eventId}`),

  // Get all reviews submitted by the current user
  getMyReviews: (page = 0, size = 20) => api.get(`/reviews/my-reviews?page=${page}&size=${size}`),
  
  // Flag a review (report inappropriate content)
  flagReview: (reviewId, reason) => 
    api.post(`/reviews/${reviewId}/flag`, { reason }),
}

export default api
