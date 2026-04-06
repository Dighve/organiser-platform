-- Insert test review data for Group 1, Event 1
-- This script creates 3 reviews from the 3 members who attended Event 1

-- Insert reviews for Event 1 (assuming members 2, 3, 4 are participants)
-- Review 1: Member 2 - Excellent experience (5 stars)
INSERT INTO event_reviews (
    event_id,
    member_id,
    group_id,
    overall_rating,
    organization_rating,
    route_rating,
    group_rating,
    safety_rating,
    value_rating,
    comment,
    created_at,
    updated_at
) VALUES (
    1, -- event_id
    2, -- member_id (first participant)
    1, -- group_id
    5.0, -- overall_rating
    5.0, -- organization_rating
    5.0, -- route_rating
    5.0, -- group_rating
    5.0, -- safety_rating
    5.0, -- value_rating
    'Amazing hike! The route was well-planned and the group was very welcoming. Our guide was knowledgeable and made sure everyone felt safe throughout the journey. The views from the summit were absolutely breathtaking. Highly recommend this group for anyone looking for a great outdoor adventure!',
    NOW() - INTERVAL '5 days', -- created_at (5 days ago)
    NOW() - INTERVAL '5 days'  -- updated_at
);

-- Review 2: Member 3 - Good experience with minor issues (4 stars)
INSERT INTO event_reviews (
    event_id,
    member_id,
    group_id,
    overall_rating,
    organization_rating,
    route_rating,
    group_rating,
    safety_rating,
    value_rating,
    comment,
    created_at,
    updated_at
) VALUES (
    1, -- event_id
    3, -- member_id (second participant)
    1, -- group_id
    4.0, -- overall_rating
    4.0, -- organization_rating
    5.0, -- route_rating
    4.5, -- group_rating
    5.0, -- safety_rating
    3.5, -- value_rating
    'Great hike overall! The trail was beautiful and challenging in all the right ways. The group was friendly and supportive. Only minor complaint is that the meeting point instructions could have been clearer - took me a while to find everyone. Also felt the price was a bit steep for what was included. But would definitely join again!',
    NOW() - INTERVAL '3 days', -- created_at (3 days ago)
    NOW() - INTERVAL '3 days'  -- updated_at
);

-- Review 3: Member 4 - Average experience (3 stars)
INSERT INTO event_reviews (
    event_id,
    member_id,
    group_id,
    overall_rating,
    organization_rating,
    route_rating,
    group_rating,
    safety_rating,
    value_rating,
    comment,
    created_at,
    updated_at
) VALUES (
    1, -- event_id
    4, -- member_id (third participant)
    1, -- group_id
    3.0, -- overall_rating
    3.0, -- organization_rating
    4.0, -- route_rating
    3.5, -- group_rating
    4.5, -- safety_rating
    2.5, -- value_rating
    'The hike itself was nice, but there were some organizational issues. We started 20 minutes late because not everyone received the updated meeting time. The route was good though, and safety precautions were adequate. However, I expected more for the price - no snacks or refreshments provided as mentioned in the description. The group members were nice but felt a bit cliquey.',
    NOW() - INTERVAL '1 day', -- created_at (1 day ago)
    NOW() - INTERVAL '1 day'  -- updated_at
);
