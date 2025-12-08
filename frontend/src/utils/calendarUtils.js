/**
 * Utility functions for generating calendar links for various providers
 * Supports Google Calendar, Apple Calendar, Outlook, Yahoo Calendar, and ICS download
 */

/**
 * Format date to YYYYMMDDTHHMMSSZ format for calendar URLs
 */
const formatDateForCalendar = (date) => {
  return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

/**
 * Generate Google Calendar URL
 */
export const generateGoogleCalendarUrl = (calendarData) => {
  const { title, description, location, startTime, endTime } = calendarData
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details: description,
    location: location || '',
    dates: `${formatDateForCalendar(startTime)}/${formatDateForCalendar(endTime)}`
  })
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/**
 * Generate Outlook Calendar URL
 */
export const generateOutlookCalendarUrl = (calendarData) => {
  const { title, description, location, startTime, endTime } = calendarData
  
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: title,
    body: description,
    location: location || '',
    startdt: new Date(startTime).toISOString(),
    enddt: new Date(endTime).toISOString()
  })
  
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}

/**
 * Generate Yahoo Calendar URL
 */
export const generateYahooCalendarUrl = (calendarData) => {
  const { title, description, location, startTime, endTime } = calendarData
  
  const params = new URLSearchParams({
    v: '60',
    title: title,
    desc: description,
    in_loc: location || '',
    st: formatDateForCalendar(startTime),
    et: formatDateForCalendar(endTime)
  })
  
  return `https://calendar.yahoo.com/?${params.toString()}`
}

/**
 * Generate ICS file content for download (Apple Calendar, Outlook desktop, etc.)
 */
export const generateICSFile = (calendarData) => {
  const { title, description, location, startTime, endTime, organiserName, eventUrl } = calendarData
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OutMeets//Hiking Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${formatDateForCalendar(startTime)}`,
    `DTEND:${formatDateForCalendar(endTime)}`,
    `DTSTAMP:${formatDateForCalendar(new Date())}`,
    `ORGANIZER:CN=${organiserName}`,
    `UID:${Date.now()}@outmeets.com`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    location ? `LOCATION:${location}` : '',
    eventUrl ? `URL:${eventUrl}` : '',
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(line => line).join('\r\n')
  
  return icsContent
}

/**
 * Download ICS file
 */
export const downloadICSFile = (calendarData) => {
  const icsContent = generateICSFile(calendarData)
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${calendarData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}
