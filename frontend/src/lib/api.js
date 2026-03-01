import axios from 'axios'
import { useAuthStore, isTokenExpired } from '../store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token and check expiration
api.interceptors.request.use(
  (config) => {
    const { token, logout } = useAuthStore.getState()
    
    // Check if token is expired before making the request
    if (token && isTokenExpired(token)) {
      logout('Your session has expired. Please log in again.')
      return Promise.reject(new Error('Token expired'))
    }
    
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

// Response interceptor to handle errors and token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const { logout } = useAuthStore.getState()
    
    // Handle 401 Unauthorized responses
    if (error.response?.status === 401) {
      // If this is not a retry attempt and we have a token
      if (!originalRequest._retry) {
        originalRequest._retry = true
        
        // If the token is expired, log the user out
        const token = useAuthStore.getState().token
        if (token && isTokenExpired(token)) {
          logout('Your session has expired. Please log in again.')
          // Redirect to login page with a return URL
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
          return Promise.reject(error)
        }
        
        // Here you could implement token refresh logic if needed
        // For now, we'll just log out the user
        logout('Your session has expired. Please log in again.')
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
      }
    }
    
    // For other errors, just reject with the error
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  requestMagicLink: (data) => api.post('/auth/magic-link', data),
  verifyMagicLink: (token) => api.get(`/auth/verify?token=${token}`),
  authenticateWithGoogle: (data) => api.post('/auth/google', data), // Google OAuth
}

// Events API
export const eventsAPI = {
  getUpcomingEvents: (page = 0, size = 20) =>
    api.get(`/events/public?page=${page}&size=${size}`),
  
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
  
  joinEvent: (id) => api.post(`/events/${id}/join`),
  
  leaveEvent: (id) => api.post(`/events/${id}/leave`),
  
  deleteEvent: (id) => api.delete(`/events/${id}`),
  
  // Get events where user is a participant (joined events)
  getMyEvents: (page = 0, size = 20) =>
    api.get(`/events/my-joined-events?page=${page}&size=${size}`),
  
  // Get events created by the organiser
  getMyOrganisedEvents: (page = 0, size = 20) =>
    api.get(`/events/organiser/my-events?page=${page}&size=${size}`),
  
  getEventParticipants: (id) => api.get(`/events/public/${id}/participants`),
  
  getCalendarData: (id) => api.get(`/events/public/${id}/calendar`),
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
  
  getGroupMembers: (groupId) => api.get(`/groups/${groupId}/members`),
}

// Members API
export const membersAPI = {
  becomeOrganiser: () => api.post('/members/become-organiser'),
  
  getCurrentMember: () => api.get('/members/me'),
  
  getMemberById: (memberId) => api.get(`/members/${memberId}`),
  
  updateProfile: (data) => api.put('/members/me', data),
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

export default api
