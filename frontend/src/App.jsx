import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'

// Critical pages - loaded immediately
import HomePage from './pages/HomePage'
import VerifyMagicLinkPage from './pages/VerifyMagicLinkPage'

// Lazy-loaded pages - loaded on demand for better initial load time
const EventsPage = lazy(() => import('./pages/EventsPage'))
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'))
const CreateEventPage = lazy(() => import('./pages/CreateEventPage'))
const EditEventPage = lazy(() => import('./pages/EditEventPage'))
const MyGroupsPage = lazy(() => import('./pages/MyGroupsPage'))
const BrowseGroupsPage = lazy(() => import('./pages/BrowseGroupsPage'))
const CreateGroupPage = lazy(() => import('./pages/CreateGroupPage'))
const GroupDetailPage = lazy(() => import('./pages/GroupDetailPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const HikingGradeFAQPage = lazy(() => import('./pages/HikingGradeFAQPage'))
const MemberDetailPage = lazy(() => import('./pages/MemberDetailPage'))
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'))

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  )
}

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
        <Route path="events" element={
          <Suspense fallback={<PageLoader />}>
            <EventsPage />
          </Suspense>
        } />
        <Route path="events/:id" element={
          <Suspense fallback={<PageLoader />}>
            <EventDetailPage />
          </Suspense>
        } />
        <Route
          path="events/:id/edit"
          element={
            <PrivateRoute>
              <Suspense fallback={<PageLoader />}>
                <EditEventPage />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="create-event"
          element={
            <PrivateRoute>
              <Suspense fallback={<PageLoader />}>
                <CreateEventPage />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="my-groups"
          element={
            <PrivateRoute>
              <Suspense fallback={<PageLoader />}>
                <MyGroupsPage />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route path="browse-groups" element={
          <Suspense fallback={<PageLoader />}>
            <BrowseGroupsPage />
          </Suspense>
        } />
        <Route path="groups" element={
          <Suspense fallback={<PageLoader />}>
            <BrowseGroupsPage />
          </Suspense>
        } />
        <Route path="hiking-grade-faq" element={
          <Suspense fallback={<PageLoader />}>
            <HikingGradeFAQPage />
          </Suspense>
        } />
        <Route path="groups/:id" element={
          <Suspense fallback={<PageLoader />}>
            <GroupDetailPage />
          </Suspense>
        } />
        <Route path="members/:id" element={
          <Suspense fallback={<PageLoader />}>
            <MemberDetailPage />
          </Suspense>
        } />
        <Route
          path="groups/create"
          element={
            <PrivateRoute>
              <Suspense fallback={<PageLoader />}>
                <CreateGroupPage />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="profile"
          element={
            <PrivateRoute>
              <Suspense fallback={<PageLoader />}>
                <ProfilePage />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="admin"
          element={
            <PrivateRoute>
              <Suspense fallback={<PageLoader />}>
                <AdminDashboardPage />
              </Suspense>
            </PrivateRoute>
          }
        />
      </Route>
    </Routes>
  )
}

export default App
