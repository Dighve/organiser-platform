-- Insert test data for the organiser platform

-- Insert Activities
INSERT INTO activities (name, description, icon_url, active, created_at) VALUES
('Hiking', 'Outdoor hiking and trekking activities', 'https://example.com/icons/hiking.png', true, NOW()),
('Cycling', 'Road and mountain biking activities', 'https://example.com/icons/cycling.png', true, NOW()),
('Running', 'Running and jogging groups', 'https://example.com/icons/running.png', true, NOW()),
('Swimming', 'Swimming and water sports', 'https://example.com/icons/swimming.png', true, NOW()),
('Yoga', 'Yoga and meditation sessions', 'https://example.com/icons/yoga.png', true, NOW());

-- Insert Test Member (verified organiser)
INSERT INTO members (email, display_name, profile_photo_url, verified, active, created_at) VALUES
('organiser@test.com', 'Test Organiser', 'https://ui-avatars.com/api/?name=Test+Organiser&background=random', true, true, NOW());

-- Insert Additional Test Members
INSERT INTO members (email, display_name, profile_photo_url, verified, active, created_at) VALUES
('user1@test.com', 'Alice Smith', 'https://ui-avatars.com/api/?name=Alice+Smith&background=random', true, true, NOW()),
('user2@test.com', 'Bob Johnson', 'https://ui-avatars.com/api/?name=Bob+Johnson&background=random', true, true, NOW()),
('user3@test.com', 'Carol White', 'https://ui-avatars.com/api/?name=Carol+White&background=random', true, true, NOW());

-- Insert Groups (using the verified organiser as primary organiser)
INSERT INTO `groups` (name, description, image_url, primary_organiser_id, activity_id, location, max_members, active, is_public, created_at, updated_at) VALUES
('Mountain Hikers', 'A group for enthusiasts who love challenging mountain trails', 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800', 1, 1, 'San Francisco Bay Area', 50, true, true, NOW(), NOW()),
('Bay Area Cyclists', 'Cycling through the beautiful Bay Area routes', 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800', 1, 2, 'San Francisco, CA', 30, true, true, NOW(), NOW()),
('Morning Runners', 'Early morning running group for all levels', 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800', 1, 3, 'San Francisco, CA', 25, true, true, NOW(), NOW());

-- Insert Subscriptions (members subscribing to groups)
INSERT INTO subscriptions (member_id, group_id, status, subscribed_at) VALUES
(1, 1, 'ACTIVE', NOW()),
(2, 1, 'ACTIVE', NOW()),
(3, 2, 'ACTIVE', NOW()),
(4, 3, 'ACTIVE', NOW());

-- Insert Events
INSERT INTO events (
    title, description, group_id, event_date, end_date, registration_deadline,
    location, latitude, longitude, max_participants, min_participants,
    price, status, difficulty_level, distance_km, elevation_gain_m,
    estimated_duration_hours, image_url, cancellation_policy,
    created_at, updated_at
) VALUES
(
    'Mount Tamalpais Summit Hike',
    'Join us for a challenging hike to the summit of Mount Tamalpais. Enjoy breathtaking views of the Bay Area and Pacific Ocean. This is a moderately difficult hike covering about 7 miles with significant elevation gain.',
    1,
    DATE_ADD(NOW(), INTERVAL 7 DAY),
    DATE_ADD(NOW(), INTERVAL 7 DAY),
    DATE_ADD(NOW(), INTERVAL 5 DAY),
    'Mount Tamalpais State Park, Mill Valley, CA',
    37.9235, -122.5965,
    20, 5,
    15.00,
    'PUBLISHED',
    'INTERMEDIATE',
    11.5, 800,
    4.5,
    'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
    'Full refund if cancelled 48 hours before the event',
    NOW(), NOW()
),
(
    'Golden Gate Bridge Cycling Tour',
    'A scenic cycling tour across the iconic Golden Gate Bridge and through the Presidio. Perfect for intermediate cyclists. We will stop for photo opportunities and enjoy the views.',
    2,
    DATE_ADD(NOW(), INTERVAL 10 DAY),
    DATE_ADD(NOW(), INTERVAL 10 DAY),
    DATE_ADD(NOW(), INTERVAL 8 DAY),
    'Golden Gate Bridge, San Francisco, CA',
    37.8199, -122.4783,
    15, 5,
    20.00,
    'PUBLISHED',
    'BEGINNER',
    25.0, 200,
    3.0,
    'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800',
    'Full refund if cancelled 24 hours before the event',
    NOW(), NOW()
),
(
    'Sunrise Run at Ocean Beach',
    'Start your day with an energizing run along Ocean Beach. Watch the sunrise over the Pacific while getting your morning workout. All fitness levels welcome!',
    3,
    DATE_ADD(NOW(), INTERVAL 3 DAY),
    DATE_ADD(NOW(), INTERVAL 3 DAY),
    DATE_ADD(NOW(), INTERVAL 2 DAY),
    'Ocean Beach, San Francisco, CA',
    37.7594, -122.5107,
    30, 3,
    0.00,
    'PUBLISHED',
    'BEGINNER',
    8.0, 50,
    1.5,
    'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800',
    'Free event, no refunds necessary',
    NOW(), NOW()
),
(
    'Advanced Trail Running - Marin Headlands',
    'For experienced trail runners only. Steep climbs and technical terrain through the beautiful Marin Headlands with ocean views.',
    3,
    DATE_ADD(NOW(), INTERVAL 14 DAY),
    DATE_ADD(NOW(), INTERVAL 14 DAY),
    DATE_ADD(NOW(), INTERVAL 12 DAY),
    'Marin Headlands, Sausalito, CA',
    37.8324, -122.4977,
    12, 4,
    10.00,
    'PUBLISHED',
    'ADVANCED',
    15.0, 1200,
    3.5,
    'https://images.unsplash.com/photo-1472740378865-80aab8e73251?w=800',
    'Full refund if cancelled 72 hours before the event',
    NOW(), NOW()
);

-- Insert Event Participants
INSERT INTO event_participants (event_id, member_id, status, created_at) VALUES
(1, 2, 'REGISTERED', NOW()),
(1, 3, 'REGISTERED', NOW()),
(2, 3, 'REGISTERED', NOW()),
(2, 4, 'REGISTERED', NOW()),
(3, 2, 'REGISTERED', NOW()),
(3, 4, 'REGISTERED', NOW());
