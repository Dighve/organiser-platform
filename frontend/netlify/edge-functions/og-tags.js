// Escape HTML special characters to prevent XSS
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async (request, context) => {
  const url = new URL(request.url);
  
  // Only handle event detail pages
  const eventMatch = url.pathname.match(/^\/events\/(\d+)$/);
  
  if (!eventMatch) {
    // Not an event page, serve normally
    return context.next();
  }
  
  const eventId = eventMatch[1];
  
  // Check if this is a bot/crawler (Instagram, Facebook, Twitter, etc.)
  const userAgent = request.headers.get('user-agent') || '';
  const isCrawler = /bot|crawler|spider|facebookexternalhit|twitterbot|instagram/i.test(userAgent);
  
  if (!isCrawler) {
    // Regular user, serve the SPA normally
    return context.next();
  }
  
  // Fetch event data from backend API
  const backendUrl = Netlify.env.get('BACKEND_API_URL') || 'https://hikehub-backend-nd4r.onrender.com';
  const apiUrl = `${backendUrl}/api/v1/events/public/${eventId}`;
  
  try {
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      return context.next();
    }
    
    const event = await response.json();
    
    // Generate dynamic meta tags (escaped to prevent XSS)
    const title = escapeHtml(event.title ? `${event.title} | OutMeets` : 'OutMeets');
    const rawDescription = event.description 
      ? (event.description.length > 160 ? event.description.substring(0, 160) + '...' : event.description)
      : `Join this hiking event on ${new Date(event.eventDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
    const description = escapeHtml(rawDescription);
    const image = event.imageUrl || 'https://www.outmeets.com/og-image.jpg';
    const eventUrl = `https://www.outmeets.com/events/${eventId}`;
    
    // Get the base HTML
    const htmlResponse = await context.next();
    let html = await htmlResponse.text();
    
    // Replace default meta tags with event-specific ones
    html = html
      // Title
      .replace(
        /<title>.*?<\/title>/,
        `<title>${title}</title>`
      )
      // Description
      .replace(
        /<meta name="description" content=".*?"\s*\/?>/,
        `<meta name="description" content="${description}">`
      )
      // OG tags
      .replace(
        /<meta property="og:title" content=".*?"\s*\/?>/,
        `<meta property="og:title" content="${title}">`
      )
      .replace(
        /<meta property="og:description" content=".*?"\s*\/?>/,
        `<meta property="og:description" content="${description}">`
      )
      .replace(
        /<meta property="og:image" content=".*?"\s*\/?>/,
        `<meta property="og:image" content="${image}">`
      )
      .replace(
        /<meta property="og:url" content=".*?"\s*\/?>/,
        `<meta property="og:url" content="${eventUrl}">`
      )
      .replace(
        /<meta property="og:type" content=".*?"\s*\/?>/,
        `<meta property="og:type" content="article">`
      )
      // Twitter tags
      .replace(
        /<meta name="twitter:title" content=".*?"\s*\/?>/,
        `<meta name="twitter:title" content="${title}">`
      )
      .replace(
        /<meta name="twitter:description" content=".*?"\s*\/?>/,
        `<meta name="twitter:description" content="${description}">`
      )
      .replace(
        /<meta name="twitter:image" content=".*?"\s*\/?>/,
        `<meta name="twitter:image" content="${image}">`
      )
      .replace(
        /<meta name="twitter:url" content=".*?"\s*\/?>/,
        `<meta name="twitter:url" content="${eventUrl}">`
      );
    
    // Add event-specific structured data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": event.title,
      "description": event.description || '',
      "startDate": event.eventDate,
      "endDate": event.endDate || event.eventDate,
      "eventStatus": "https://schema.org/EventScheduled",
      "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
      "location": {
        "@type": "Place",
        "name": event.location,
        "address": event.location
      },
      "image": image,
      "organizer": {
        "@type": "Organization",
        "name": "OutMeets",
        "url": "https://www.outmeets.com"
      },
      "offers": event.price > 0 ? {
        "@type": "Offer",
        "price": event.price,
        "priceCurrency": "GBP",
        "availability": "https://schema.org/InStock",
        "url": eventUrl
      } : undefined
    };
    
    // Inject structured data before </head>
    // Replace '</' in JSON to prevent </script> injection breaking the document
    const safeJsonLd = JSON.stringify(structuredData).replace(/</g, '\\u003c');
    html = html.replace(
      '</head>',
      `<script type="application/ld+json">${safeJsonLd}</script></head>`
    );
    
    return new Response(html, {
      headers: {
        'content-type': 'text/html;charset=UTF-8',
        'cache-control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
    
  } catch (error) {
    console.error('Error fetching event data:', error);
    return context.next();
  }
};

export const config = {
  path: "/events/*"
};
