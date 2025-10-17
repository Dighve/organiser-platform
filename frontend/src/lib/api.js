import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  requestMagicLink: (data) => api.post('/auth/magic-link', data),
  verifyMagicLink: (token) => api.get(`/auth/verify?token=${token}`),
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
  
  publishEvent: (id) => api.post(`/events/${id}/publish`),
  
  joinEvent: (id) => api.post(`/events/${id}/join`),
  
  leaveEvent: (id) => api.post(`/events/${id}/leave`),
  
  deleteEvent: (id) => api.delete(`/events/${id}`),
  
  getMyEvents: (page = 0, size = 20) =>
    api.get(`/events/organiser/my-events?page=${page}&size=${size}`),
  
  getEventParticipants: (id) => api.get(`/events/public/${id}/participants`),
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
  
  getGroupMembers: (groupId) => api.get(`/groups/${groupId}/members`),
}

// Members API
export const membersAPI = {
  becomeOrganiser: () => api.post('/members/become-organiser'),
  
  getCurrentMember: () => api.get('/members/me'),
}

export default api
