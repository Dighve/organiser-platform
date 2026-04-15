import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// Module-level counter that tracks in-app navigations.
// Starts at 0. The NavigationTracker component in App.jsx increments this
// on every React Router location change. The first change (initial page load)
// brings it to 1, so canGoBack is true only when count >= 2 (i.e. the user
// has navigated at least once *within* the app).
let navigationCount = 0

export function incrementNavigationCount() {
  navigationCount++
}

/**
 * A smarter replacement for navigate(-1).
 *
 * When the user arrived from an external source (email, notification, direct URL,
 * new tab) the browser history has no previous in-app entry, so navigate(-1)
 * either does nothing or leaves the app entirely.
 *
 * useSmartBack solves this by checking an in-app navigation counter:
 *  - If the user has navigated within the app → navigate(-1)
 *  - Otherwise → navigate to a contextual fallback route
 *
 * @param {string} fallback - The route to navigate to when there is no in-app
 *   history. Defaults to '/' (home). Pass a page-specific value for better UX,
 *   e.g. `/events/${id}` for an edit-event page.
 */
export function useSmartBack(fallback = '/') {
  const navigate = useNavigate()

  const goBack = useCallback(() => {
    if (navigationCount >= 2) {
      navigate(-1)
    } else {
      navigate(fallback, { replace: true })
    }
  }, [navigate, fallback])

  return goBack
}
