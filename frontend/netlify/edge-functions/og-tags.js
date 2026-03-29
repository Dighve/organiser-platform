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
  
  // Fetch event data from your backend API
  const apiUrl = `https://hikehub-backend-nd4r.onrender.com/api/v1/events/public/${eventId}`;
  
  try {
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      return context.next();
    }
    
    const event = await response.json();
    
    // Generate dynamic meta tags
    const title = `${event.title} | OutMeets`;
    const description = event.description 
      ? event.description.substring(0, 160) + '...'
      : `Join this hiking event on ${new Date(event.eventDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
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
        /<meta name="description" content=".*?">/,
        `<meta name="description" content="${description}">`
      )
      // OG tags
      .replace(
        /<meta property="og:title" content=".*?">/,
        `<meta property="og:title" content="${title}">`
      )
      .replace(
        /<meta property="og:description" content=".*?">/,
        `<meta property="og:description" content="${description}">`
      )
      .replace(
        /<meta property="og:image" content=".*?">/,
        `<meta property="og:image" content="${image}">`
      )
      .replace(
        /<meta property="og:url" content=".*?">/,
        `<meta property="og:url" content="${eventUrl}">`
      )
      .replace(
        /<meta property="og:type" content=".*?">/,
        `<meta property="og:type" content="article">`
      )
      // Twitter tags
      .replace(
        /<meta name="twitter:title" content=".*?">/,
        `<meta name="twitter:title" content="${title}">`
      )
      .replace(
        /<meta name="twitter:description" content=".*?">/,
        `<meta name="twitter:description" content="${description}">`
      )
      .replace(
        /<meta name="twitter:image" content=".*?">/,
        `<meta name="twitter:image" content="${image}">`
      )
      .replace(
        /<meta name="twitter:url" content=".*?">/,
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
    html = html.replace(
      '</head>',
      `<script type="application/ld+json">${JSON.stringify(structuredData)}</script></head>`
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
