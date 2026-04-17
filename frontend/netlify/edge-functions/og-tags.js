/* global Netlify */
// Escape HTML special characters to prevent XSS
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Detect bots: social crawlers + search engine crawlers (Googlebot, Bingbot, etc.)
function isCrawlerRequest(userAgent) {
  return /googlebot|google-inspectiontool|adsbot-google|bingbot|slurp|duckduckbot|yandexbot|baiduspider|sogou|exabot|facebot|ia_archiver|rogerbot|linkedinbot|bot|crawler|spider|facebookexternalhit|twitterbot|instagram|whatsapp|slackbot|discordbot|embedly|pinterest|flipboard|tumblr|skypeuripreview|vkshare|google-structured-data-testing-tool/i.test(userAgent);
}

async function injectMetaTags(context, { title, description, url, image, schema }) {
  const htmlResponse = await context.next();
  let html = await htmlResponse.text();
  const safeImage = image || 'https://www.outmeets.com/og-image.jpg';

  html = html
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta name="description" content=".*?"\s*\/?>/, `<meta name="description" content="${escapeHtml(description)}">`)
    .replace(/<meta property="og:title" content=".*?"\s*\/?>/, `<meta property="og:title" content="${escapeHtml(title)}">`)
    .replace(/<meta property="og:description" content=".*?"\s*\/?>/, `<meta property="og:description" content="${escapeHtml(description)}">`)
    .replace(/<meta property="og:image" content=".*?"\s*\/?>/, `<meta property="og:image" content="${escapeHtml(safeImage)}">`)
    .replace(/<meta property="og:url" content=".*?"\s*\/?>/, `<meta property="og:url" content="${escapeHtml(url)}">`)
    .replace(/<meta name="twitter:title" content=".*?"\s*\/?>/, `<meta name="twitter:title" content="${escapeHtml(title)}">`)
    .replace(/<meta name="twitter:description" content=".*?"\s*\/?>/, `<meta name="twitter:description" content="${escapeHtml(description)}">`)
    .replace(/<meta name="twitter:url" content=".*?"\s*\/?>/, `<meta name="twitter:url" content="${escapeHtml(url)}">`);

  if (schema) {
    const safeJsonLd = JSON.stringify(schema).replace(/</g, '\\u003c');
    html = html.replace('</head>', `<script type="application/ld+json">${safeJsonLd}</script></head>`);
  }

  // Inject canonical URL
  const canonicalTag = `<link rel="canonical" href="${escapeHtml(url)}" />`;
  html = html.replace(/<link rel="canonical" href=".*?"\s*\/?>/, canonicalTag);

  return new Response(html, {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
      'cache-control': 'public, max-age=300',
    },
  });
}

async function handleEventPage(request, context, eventId) {
  const backendUrl = Netlify.env.get('BACKEND_API_URL') || 'https://hikehub-backend-nd4r.onrender.com';
  const apiUrl = `${backendUrl}/api/v1/events/public/${eventId}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) return context.next();

    const event = await response.json();

    const rawDescription = event.description
      ? (event.description.length > 160 ? event.description.substring(0, 160) + '...' : event.description)
      : `Join this hiking event on ${new Date(event.eventDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;

    const eventUrl = `https://www.outmeets.com/events/${eventId}`;
    const image = event.imageUrl || 'https://www.outmeets.com/og-image.jpg';

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      'name': event.title,
      'description': event.description || '',
      'startDate': event.eventDate,
      'endDate': event.endDate || event.eventDate,
      'eventStatus': 'https://schema.org/EventScheduled',
      'eventAttendanceMode': 'https://schema.org/OfflineEventAttendanceMode',
      'location': {
        '@type': 'Place',
        'name': event.location,
        'address': event.location,
      },
      'image': image,
      'organizer': {
        '@type': 'Organization',
        'name': 'OutMeets',
        'url': 'https://www.outmeets.com',
      },
      ...(event.price > 0 ? {
        'offers': {
          '@type': 'Offer',
          'price': event.price,
          'priceCurrency': 'GBP',
          'availability': 'https://schema.org/InStock',
          'url': eventUrl,
        },
      } : {}),
    };

    const htmlResponse = await context.next();
    let html = await htmlResponse.text();

    const title = escapeHtml(event.title ? `${event.title} | OutMeets` : 'OutMeets');
    const description = escapeHtml(rawDescription);

    html = html
      .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
      .replace(/<meta name="description" content=".*?"\s*\/?>/, `<meta name="description" content="${description}">`)
      .replace(/<meta property="og:title" content=".*?"\s*\/?>/, `<meta property="og:title" content="${title}">`)
      .replace(/<meta property="og:description" content=".*?"\s*\/?>/, `<meta property="og:description" content="${description}">`)
      .replace(/<meta property="og:image" content=".*?"\s*\/?>/, `<meta property="og:image" content="${escapeHtml(image)}">`)
      .replace(/<meta property="og:url" content=".*?"\s*\/?>/, `<meta property="og:url" content="${escapeHtml(eventUrl)}">`)
      .replace(/<meta property="og:type" content=".*?"\s*\/?>/, `<meta property="og:type" content="article">`)
      .replace(/<meta name="twitter:title" content=".*?"\s*\/?>/, `<meta name="twitter:title" content="${title}">`)
      .replace(/<meta name="twitter:description" content=".*?"\s*\/?>/, `<meta name="twitter:description" content="${description}">`)
      .replace(/<meta name="twitter:image" content=".*?"\s*\/?>/, `<meta name="twitter:image" content="${escapeHtml(image)}">`)
      .replace(/<meta name="twitter:url" content=".*?"\s*\/?>/, `<meta name="twitter:url" content="${escapeHtml(eventUrl)}">`);

    const canonicalTag = `<link rel="canonical" href="${escapeHtml(eventUrl)}" />`;
    html = html.replace(/<link rel="canonical" href=".*?"\s*\/?>/, canonicalTag);

    const safeJsonLd = JSON.stringify(schema).replace(/</g, '\\u003c');
    html = html.replace('</head>', `<script type="application/ld+json">${safeJsonLd}</script></head>`);

    return new Response(html, {
      headers: {
        'content-type': 'text/html;charset=UTF-8',
        'cache-control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('Error fetching event data:', error);
    return context.next();
  }
}

const HIKING_GRADE_FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  'mainEntity': [
    {
      '@type': 'Question',
      'name': 'What is a Beginner hiking grade?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Beginner hikes are perfect for first-time hikers and families. Trails are well-maintained and clearly marked, with minimal elevation gain (under 300m) and distances typically under 8km. They usually take 2–3 hours and are suitable for most fitness levels.',
      },
    },
    {
      '@type': 'Question',
      'name': 'What is an Intermediate hiking grade?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Intermediate hikes are for hikers with some experience. They involve moderate elevation gain (300–600m), distances of 8–15km, and some steep sections on well-defined paths. Typically take 3–5 hours and require moderate fitness.',
      },
    },
    {
      '@type': 'Question',
      'name': 'What is an Advanced hiking grade?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Advanced hikes are challenging and for experienced hikers. They involve significant elevation gain (600–1000m), distances of 15–25km, steep climbs, and rocky terrain. They usually take 5–8 hours and require good fitness and stamina.',
      },
    },
    {
      '@type': 'Question',
      'name': 'What is an Expert hiking grade?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Expert hikes are very challenging and for highly experienced hikers only. They involve extreme elevation gain (over 1000m), distances often over 25km, technical terrain, scrambling, and can take 8+ hours. Excellent fitness and technical skills are required.',
      },
    },
    {
      '@type': 'Question',
      'name': 'What equipment do I need for a day hike from London?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'For beginner hikes, comfortable walking shoes, 1L water, and light snacks are sufficient. For intermediate hikes, bring hiking boots, 2L water, packed lunch, and a weatherproof jacket. Advanced and Expert hikes require high-quality boots, 2–3L water, navigation tools, and comprehensive first aid.',
      },
    },
  ],
};

const PACE_FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  'mainEntity': [
    {
      '@type': 'Question',
      'name': 'What does Leisurely pace mean on a hike?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Leisurely pace is approximately 2–3 km/h with frequent breaks, stops at viewpoints, and a social atmosphere. Ideal for first-time hikers, families, and anyone who prefers a relaxed, sociable day out.',
      },
    },
    {
      '@type': 'Question',
      'name': 'What does Steady pace mean on a hike?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Steady pace is approximately 3–4 km/h with breaks at summits and viewpoints. It balances covering ground with enjoying the route. Suitable for hikers with some regular walking experience.',
      },
    },
    {
      '@type': 'Question',
      'name': 'What does Brisk pace mean on a hike?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Brisk pace is approximately 4–5 km/h with shorter stops. It covers more ground and is suitable for those with good fitness who want a more energetic hike.',
      },
    },
    {
      '@type': 'Question',
      'name': 'Which hiking pace is right for beginners in London?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Leisurely or Steady pace is best for beginners joining day hike groups from London. These paces allow you to enjoy the scenery, socialise with the group, and not feel rushed or left behind.',
      },
    },
  ],
};

const LONDON_DAY_HIKES_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  'name': 'Day Hikes from London | OutMeets',
  'description': 'Find and join organised day hikes from London with local hiking groups. Explore the Surrey Hills, Chilterns, South Downs and more. All abilities welcome.',
  'url': 'https://www.outmeets.com/london/day-hikes',
  'about': {
    '@type': 'SportsEvent',
    'name': 'Day Hikes from London',
    'location': {
      '@type': 'Place',
      'name': 'London, United Kingdom',
      'geo': {
        '@type': 'GeoCoordinates',
        'latitude': '51.5074',
        'longitude': '-0.1278',
      },
    },
  },
  'breadcrumb': {
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://www.outmeets.com/' },
      { '@type': 'ListItem', 'position': 2, 'name': 'Day Hikes from London', 'item': 'https://www.outmeets.com/london/day-hikes' },
    ],
  },
};

export default async (request, context) => {
  const url = new URL(request.url);
  const pathname = url.pathname;

  const userAgent = request.headers.get('user-agent') || '';
  if (!isCrawlerRequest(userAgent)) {
    return context.next();
  }

  // Event detail pages — dynamic meta from API
  const eventMatch = pathname.match(/^\/events\/(\d+)$/);
  if (eventMatch) {
    return handleEventPage(request, context, eventMatch[1]);
  }

  // Hiking grade FAQ page
  if (pathname === '/hiking-grade-faq') {
    return injectMetaTags(context, {
      title: 'Hiking Difficulty Grades Explained | OutMeets',
      description: 'Understand hiking difficulty grades: Beginner, Intermediate, Advanced, Expert. Learn trail characteristics and what equipment to bring for day hikes from London.',
      url: 'https://www.outmeets.com/hiking-grade-faq',
      schema: HIKING_GRADE_FAQ_SCHEMA,
    });
  }

  // Pace FAQ page
  if (pathname === '/pace-faq') {
    return injectMetaTags(context, {
      title: 'Hiking Pace Guide — Leisurely to Brisk | OutMeets',
      description: 'Understand hiking pace levels used in OutMeets events: Leisurely, Steady, and Brisk. Find the right pace for your fitness level on day hikes from London.',
      url: 'https://www.outmeets.com/pace-faq',
      schema: PACE_FAQ_SCHEMA,
    });
  }

  // London day hikes landing page
  if (pathname === '/london/day-hikes') {
    return injectMetaTags(context, {
      title: 'Day Hikes from London | Join Hiking Groups | OutMeets',
      description: 'Discover and join organised day hikes from London with local hiking groups. Surrey Hills, Chilterns, South Downs and more. All abilities welcome on OutMeets.',
      url: 'https://www.outmeets.com/london/day-hikes',
      schema: LONDON_DAY_HIKES_SCHEMA,
    });
  }

  return context.next();
};

export const config = {
  path: "/*",
};
