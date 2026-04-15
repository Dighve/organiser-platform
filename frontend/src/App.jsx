import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import { FeatureFlagProvider } from './contexts/FeatureFlagContext'
import PushNotificationPrompt from './components/PushNotificationPrompt'
import { trackPageView, identifyUser, resetUser } from './lib/analytics'
import { incrementNavigationCount } from './hooks/useSmartBack'
import ErrorBoundary from './components/ErrorBoundary'

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
const EditGroupPage = lazy(() => import('./pages/EditGroupPage'))
const TransferOwnershipPage = lazy(() => import('./pages/TransferOwnershipPage'))
const GroupDetailPage = lazy(() => import('./pages/GroupDetailPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const HikingGradeFAQPage = lazy(() => import('./pages/HikingGradeFAQPage'))
const PaceFAQPage = lazy(() => import('./pages/PaceFAQPage'))
const MemberDetailPage = lazy(() => import('./pages/MemberDetailPage'))
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const InvitePage = lazy(() => import('./pages/InvitePage'))
const ReviewSubmissionPage = lazy(() => import('./pages/ReviewSubmissionPage'))
const GroupReviewsPage = lazy(() => import('./pages/GroupReviewsPage'))
const EventReviewsPage = lazy(() => import('./pages/EventReviewsPage'))

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4">
          <img src="/favicon1.svg" alt="" className="w-full h-full object-contain opacity-80 animate-pulse" />
        </div>
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-purple-200 border-t-purple-600 mb-3"></div>
        <p className="text-gray-500 text-sm font-medium">Loading...</p>
      </div>
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Disable browser's built-in scroll restoration which overrides manual scrollTo
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  return null
}

const PAGE_NAMES = {
  '/': 'Home',
  '/events': 'Events',
  '/create-event': 'Create Event',
  '/my-groups': 'My Groups',
  '/browse-groups': 'Browse Groups',
  '/groups': 'Browse Groups',
  '/groups/create': 'Create Group',
  '/profile': 'Profile',
  '/settings': 'Settings',
  '/notifications': 'Notifications',
  '/admin': 'Admin',
  '/hiking-grade-faq': 'Hiking Grade FAQ',
  '/pace-faq': 'Pace FAQ',
  '/auth/verify': 'Verify Magic Link',
}

function getPageName(pathname) {
  if (PAGE_NAMES[pathname]) return PAGE_NAMES[pathname]
  if (/^\/events\/[^/]+\/review$/.test(pathname)) return 'Submit Review'
  if (/^\/events\/[^/]+\/edit$/.test(pathname)) return 'Edit Event'
  if (/^\/events\/[^/]+$/.test(pathname)) return 'Event Detail'
  if (/^\/groups\/[^/]+\/edit$/.test(pathname)) return 'Edit Group'
  if (/^\/groups\/[^/]+\/transfer$/.test(pathname)) return 'Transfer Ownership'
  if (/^\/groups\/[^/]+$/.test(pathname)) return 'Group Detail'
  if (/^\/members\/[^/]+$/.test(pathname)) return 'Member Profile'
  return 'Unknown'
}

function RouteTracker() {
  const { pathname } = useLocation()

  useEffect(() => {
    trackPageView(getPageName(pathname))
    incrementNavigationCount()
  }, [pathname])

  return null
}

function UserIdentitySync() {
  const { isAuthenticated, user } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && user) {
      identifyUser(user.userId || user.id, user.email, user.role)
    } else if (!isAuthenticated) {
      resetUser()
    }
  }, [isAuthenticated, user])

  return null
}

// Handles SW_NAVIGATE messages sent by the service worker's notificationclick handler.
// WindowClient.navigate() is unreliable on iOS PWA, so we postMessage the URL and
// let React Router handle the navigation instead of causing a full page reload.
function ServiceWorkerNavigationHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handleMessage = (event) => {
      if (event.data?.type === 'SW_NAVIGATE' && event.data.url) {
        try {
          const url = new URL(event.data.url)
          if (url.origin === window.location.origin) {
            navigate(url.pathname + url.search + url.hash, { replace: false })
          }
        } catch {
          // ignore malformed URLs
        }
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage)
  }, [navigate])

  return null
}

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/" />
}

function App() {
  return (
    <FeatureFlagProvider>
      <ScrollToTop />
      <RouteTracker />
      <UserIdentitySync />
      <ServiceWorkerNavigationHandler />
      <PushNotificationPrompt />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={
            <ErrorBoundary name="HomePage" title="Unable to load home page" message="We're having trouble loading the home page. Please try refreshing.">
              <HomePage />
            </ErrorBoundary>
          } />  
          <Route path="auth/verify" element={<VerifyMagicLinkPage />} />
        <Route path="events" element={
          <Suspense fallback={<PageLoader />}>
            <EventsPage />
          </Suspense>
        } />
        <Route path="events/:id" element={
          <Suspense fallback={<PageLoader />}>
            <ErrorBoundary name="EventDetailPage" title="Unable to load event" message="We're having trouble loading this event. Please try again.">
              <EventDetailPage />
            </ErrorBoundary>
          </Suspense>
        } />
        <Route path="events/:id/reviews" element={
          <Suspense fallback={<PageLoader />}>
            <EventReviewsPage />
          </Suspense>
        } />
        <Route
          path="events/:eventId/review"
          element={
            <PrivateRoute>
              <Suspense fallback={<PageLoader />}>
                <ReviewSubmissionPage />
              </Suspense>
            </PrivateRoute>
          }
        />
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
        <Route path="pace-faq" element={
          <Suspense fallback={<PageLoader />}>
            <PaceFAQPage />
          </Suspense>
        } />
        <Route path="groups/:id" element={
          <Suspense fallback={<PageLoader />}>
            <ErrorBoundary name="GroupDetailPage" title="Unable to load group" message="We're having trouble loading this group. Please try again.">
              <GroupDetailPage />
            </ErrorBoundary>
          </Suspense>
        } />
        <Route path="groups/:id/reviews" element={
          <Suspense fallback={<PageLoader />}>
            <GroupReviewsPage />
          </Suspense>
        } />
        <Route
          path="groups/:id/edit"
          element={
            <PrivateRoute>
              <Suspense fallback={<PageLoader />}>
                <EditGroupPage />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="groups/:id/transfer"
          element={
            <PrivateRoute>
              <Suspense fallback={<PageLoader />}>
                <TransferOwnershipPage />
              </Suspense>
            </PrivateRoute>
          }
        />
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
          path="settings"
          element={
            <PrivateRoute>
              <Suspense fallback={<PageLoader />}>
                <SettingsPage />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="notifications"
          element={
            <PrivateRoute>
              <Suspense fallback={<PageLoader />}>
                <NotificationsPage />
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
        <Route path="invite/:token" element={
          <Suspense fallback={<PageLoader />}>
            <InvitePage />
          </Suspense>
        } />
      </Route>
    </Routes>
    </FeatureFlagProvider>
  )
}

export default App
