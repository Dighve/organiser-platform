-- Add group guidelines to existing test groups
-- This migration adds guidelines after the group_guidelines column was added in V31

UPDATE groups 
SET group_guidelines = '## Mountain Hikers Group Guidelines

Welcome to Mountain Hikers! To ensure everyone has a safe and enjoyable experience, please review and agree to these guidelines:

### Safety Requirements
- Always inform someone of your hiking plans
- Carry proper safety equipment (first aid kit, whistle, headlamp)
- Check weather conditions before each hike
- Stay with the group and follow the designated trail

### What to Bring
- Sturdy hiking boots with good traction
- Weather-appropriate clothing (layers recommended)
- At least 2 liters of water per person
- Snacks/lunch for longer hikes
- Sunscreen and hat

### Group Conduct
- Respect fellow hikers and wildlife
- Follow Leave No Trace principles
- No alcohol or drugs during activities
- Be punctual and prepared for scheduled meetups

### Cancellation Policy
- Events may be cancelled due to severe weather
- Members will be notified at least 2 hours before start time
- Partial refunds available for paid events (see individual event policies)

By joining our events, you agree to follow these guidelines and participate at your own risk. Let''s explore the mountains together safely!'
WHERE name = 'Mountain Hikers';
