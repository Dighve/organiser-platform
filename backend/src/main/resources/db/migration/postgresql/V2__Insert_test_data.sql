-- Insert test data for the organiser platform (PostgreSQL version)

-- Insert Activities
INSERT INTO activities (name, description, icon_url, active, created_at) VALUES
('Hiking', 'Outdoor hiking and trekking activities', 'https://example.com/icons/hiking.png', true, CURRENT_TIMESTAMP),
('Cycling', 'Road and mountain biking activities', 'https://example.com/icons/cycling.png', true, CURRENT_TIMESTAMP),
('Running', 'Running and jogging groups', 'https://example.com/icons/running.png', true, CURRENT_TIMESTAMP),
('Swimming', 'Swimming and water sports', 'https://example.com/icons/swimming.png', true, CURRENT_TIMESTAMP),
('Yoga', 'Yoga and meditation sessions', 'https://example.com/icons/yoga.png', true, CURRENT_TIMESTAMP);

-- Insert Test Member (verified organiser)
INSERT INTO members (email, display_name, profile_photo_url, verified, active, created_at) VALUES
('organiser@test.com', 'Test Organiser', 'https://ui-avatars.com/api/?name=Test+Organiser&background=random', true, true, CURRENT_TIMESTAMP);

-- Insert Additional Test Members
INSERT INTO members (email, display_name, profile_photo_url, verified, active, created_at) VALUES
('user1@test.com', 'Alice Smith', 'https://ui-avatars.com/api/?name=Alice+Smith&background=random', true, true, CURRENT_TIMESTAMP),
('user2@test.com', 'Bob Johnson', 'https://ui-avatars.com/api/?name=Bob+Johnson&background=random', true, true, CURRENT_TIMESTAMP),
('user3@test.com', 'Carol White', 'https://ui-avatars.com/api/?name=Carol+White&background=random', true, true, CURRENT_TIMESTAMP);

-- Insert Groups (using the verified organiser as primary organiser)
INSERT INTO groups (name, description, image_url, primary_organiser_id, activity_id, location, max_members, active, is_public, created_at, updated_at) VALUES
('Mountain Hikers', 'A group for enthusiasts who love challenging mountain trails', 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800', 1, 1, 'San Francisco Bay Area', 50, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Bay Area Cyclists', 'Cycling through the beautiful Bay Area routes', 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800', 1, 2, 'San Francisco, CA', 30, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Morning Runners', 'Early morning running group for all levels', 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800', 1, 3, 'San Francisco, CA', 25, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Subscriptions (members subscribing to groups)
INSERT INTO subscriptions (member_id, group_id, status, subscribed_at) VALUES
(1, 1, 'ACTIVE', CURRENT_TIMESTAMP),
(2, 1, 'ACTIVE', CURRENT_TIMESTAMP),
(3, 2, 'ACTIVE', CURRENT_TIMESTAMP),
(4, 3, 'ACTIVE', CURRENT_TIMESTAMP);

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
    CURRENT_TIMESTAMP + INTERVAL '7 days',
    CURRENT_TIMESTAMP + INTERVAL '7 days',
    CURRENT_TIMESTAMP + INTERVAL '5 days',
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
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'Golden Gate Bridge Cycling Tour',
    'A scenic cycling tour across the iconic Golden Gate Bridge and through the Presidio. Perfect for intermediate cyclists. We will stop for photo opportunities and enjoy the views.',
    2,
    CURRENT_TIMESTAMP + INTERVAL '10 days',
    CURRENT_TIMESTAMP + INTERVAL '10 days',
    CURRENT_TIMESTAMP + INTERVAL '8 days',
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
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'Sunrise Run at Ocean Beach',
    'Start your day with an energizing run along Ocean Beach. Watch the sunrise over the Pacific while getting your morning workout. All fitness levels welcome!',
    3,
    CURRENT_TIMESTAMP + INTERVAL '3 days',
    CURRENT_TIMESTAMP + INTERVAL '3 days',
    CURRENT_TIMESTAMP + INTERVAL '2 days',
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
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'Advanced Trail Running - Marin Headlands',
    'For experienced trail runners only. Steep climbs and technical terrain through the beautiful Marin Headlands with ocean views.',
    3,
    CURRENT_TIMESTAMP + INTERVAL '14 days',
    CURRENT_TIMESTAMP + INTERVAL '14 days',
    CURRENT_TIMESTAMP + INTERVAL '12 days',
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
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- Insert Event Participants
INSERT INTO event_participants (event_id, member_id, status, created_at) VALUES
(1, 2, 'REGISTERED', CURRENT_TIMESTAMP),
(1, 3, 'REGISTERED', CURRENT_TIMESTAMP),
(2, 3, 'REGISTERED', CURRENT_TIMESTAMP),
(2, 4, 'REGISTERED', CURRENT_TIMESTAMP),
(3, 2, 'REGISTERED', CURRENT_TIMESTAMP),
(3, 4, 'REGISTERED', CURRENT_TIMESTAMP);
