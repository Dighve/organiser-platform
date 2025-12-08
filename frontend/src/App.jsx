import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import VerifyMagicLinkPage from './pages/VerifyMagicLinkPage'
import EventsPage from './pages/EventsPage'
import EventDetailPage from './pages/EventDetailPage'
import CreateEventPage from './pages/CreateEventPage'
import EditEventPage from './pages/EditEventPage'
import MyGroupsPage from './pages/MyGroupsPage'
import BrowseGroupsPage from './pages/BrowseGroupsPage'
import CreateGroupPage from './pages/CreateGroupPage'
import GroupDetailPage from './pages/GroupDetailPage'
import ProfilePage from './pages/ProfilePage'
import HikingGradeFAQPage from './pages/HikingGradeFAQPage'
import MemberDetailPage from './pages/MemberDetailPage'

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/" />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />  
        <Route path="auth/verify" element={<VerifyMagicLinkPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/:id" element={<EventDetailPage />} />
        <Route
          path="events/:id/edit"
          element={
            <PrivateRoute>
              <EditEventPage />
            </PrivateRoute>
          }
        />
        <Route
          path="create-event"
          element={
            <PrivateRoute>
              <CreateEventPage />
            </PrivateRoute>
          }
        />
        <Route
          path="my-groups"
          element={
            <PrivateRoute>
              <MyGroupsPage />
            </PrivateRoute>
          }
        />
        <Route path="browse-groups" element={<BrowseGroupsPage />} />
        <Route path="groups" element={<BrowseGroupsPage />} />
        <Route path="hiking-grade-faq" element={<HikingGradeFAQPage />} />
        <Route path="groups/:id" element={<GroupDetailPage />} />
        <Route path="members/:id" element={<MemberDetailPage />} />
        <Route
          path="groups/create"
          element={
            <PrivateRoute>
              <CreateGroupPage />
            </PrivateRoute>
          }
        />
        <Route
          path="profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
      </Route>
    </Routes>
  )
}

export default App
