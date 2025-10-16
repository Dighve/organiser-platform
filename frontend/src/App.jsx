import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import VerifyMagicLinkPage from './pages/VerifyMagicLinkPage'
import EventDetailPage from './pages/EventDetailPage'
import CreateEventPage from './pages/CreateEventPage'
import MyGroupsPage from './pages/MyGroupsPage'
import BrowseGroupsPage from './pages/BrowseGroupsPage'
import CreateGroupPage from './pages/CreateGroupPage'
import GroupDetailPage from './pages/GroupDetailPage'
import ProfilePage from './pages/ProfilePage'

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />  
        <Route path="login" element={<LoginPage />} />
        <Route path="auth/verify" element={<VerifyMagicLinkPage />} />
        <Route path="events/:id" element={<EventDetailPage />} />
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
        <Route path="groups/:id" element={<GroupDetailPage />} />
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
