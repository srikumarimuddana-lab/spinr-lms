-- =========================================================================
-- Spinr Driver Training — Airport Rules & Regulations
-- Run this AFTER seed_course.sql
-- Adds Lesson 9: Airport Pickup & Drop-off Rules
-- Updates quiz questions 11-13 with airport-specific content
-- =========================================================================

-- =========================================
-- LESSON 9: Airport Pickup & Drop-off Rules
-- =========================================
INSERT INTO lessons (id, course_id, title, content, sort_order) VALUES (
  '11111111-1111-1111-1111-111111111109',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Airport Pickup & Drop-off Rules',
  'Airport Pickup & Drop-off Rules

Saskatchewan airports have specific rules for rideshare (TNC) drivers. Violating these rules can result in fines, airport access restrictions, and Spinr account consequences. Learn them, follow them, every single time.

WHY AIRPORT RULES MATTER

Airports are controlled environments with strict traffic management. Unlike regular city streets, airport authorities have their own bylaws and enforcement officers. As a rideshare driver, you are a guest on airport property and must follow their specific procedures — on top of all regular traffic laws.

WAITING FOR RIDE REQUESTS

When heading to the airport to wait for ride requests:

• You MUST wait in the designated Cell Phone Waiting Lot (also known as the TNC Staging Area)
• The Cell Phone Lot is free to use and clearly signed as you approach the terminal area
• Do NOT wait at the terminal curb, in the short-term parking lot, or along the airport entrance road
• While in the Cell Phone Lot, you are placed in a virtual queue — ride requests are assigned based on your arrival order in the lot
• Stay in your vehicle and be ready to move when a request comes in
• Do NOT circle the terminal to avoid waiting — airport security monitors this behavior and it may result in a fine

PICKING UP RIDERS

When you receive a ride request from an arriving passenger:

• Drive from the Cell Phone Lot to the terminal
• Pick up your rider ONLY at the designated Rideshare/TNC Pickup Zone
• Look for the blue rideshare signs marking the pickup area — typically located at the public (outer) curb
• Do NOT pick up riders at the commercial curb — this area is reserved for taxis and licensed commercial vehicles
• Do NOT pick up riders in the parking garage, rental car area, or departures level
• Confirm the rider''s name and destination before starting the trip
• If the rider is not at the pickup zone, ask them to walk to the designated area — do NOT drive around the terminal searching for them

DROPPING OFF RIDERS

When dropping off a rider at the airport:

• Drop off at the public (outer) curb, following the Departures/Arrivals signage
• Do NOT enter the commercial curb area for drop-offs
• Pull up as close to the terminal door as safely possible
• Help with luggage if the rider needs assistance
• Do NOT linger at the curb — drop off and move on promptly
• If the curb is full, pull forward and let the rider walk back to the door

AIRPORT SURCHARGE

• A surcharge (typically $2.00) is automatically added to all rideshare fares for both pickups and drop-offs at the airport
• This fee is collected by the airport authority and is remitted automatically through the Spinr platform
• The surcharge is shown to the rider in their fare estimate — you do not need to collect it separately
• This surcharge applies every time you enter airport grounds for a ride

TRADE DRESS / VEHICLE IDENTIFICATION

• You MUST display your rideshare vehicle decal (trade dress) while operating at the airport
• Front windshield decal: passenger side, facing outward
• Rear windshield decal: driver side, facing outward
• Airport security and bylaw officers check for proper trade dress — missing or improperly placed decals may result in a fine
• Spinr will provide your trade dress decals upon account activation

VIOLATIONS, FINES & DRIVER BAN POLICY

Airport authorities enforce rideshare rules strictly. Spinr takes airport violations extremely seriously.

• Picking up outside the designated zone: Up to $250 fine
• Waiting at the terminal curb instead of the Cell Phone Lot: Up to $250 fine
• Missing or improper trade dress: Up to $250 fine
• Blocking traffic or parking in unauthorized areas: Up to $250 fine
• Spinr will NOT cover fines for airport violations — you are personally responsible

DRIVER BAN POLICY — ZERO TOLERANCE

• If you receive ANY fine at the airport, your Spinr driver account will be PERMANENTLY BANNED
• If you are reported for misbehavior at the airport (rude conduct, arguing with airport staff, ignoring instructions, reckless driving on airport grounds), your account will be PERMANENTLY BANNED
• If you are caught picking up or dropping off outside the designated zones, your account will be PERMANENTLY BANNED
• There are NO warnings and NO second chances for airport violations
• Excessive trip cancellations at the airport will also result in permanent deactivation
• Spinr has a strict zero-tolerance policy — any violation at the airport means you lose access to the platform entirely

BEST PRACTICES FOR AIRPORT RUNS

• Keep your trunk clean and empty — airport riders usually have luggage
• Have a phone charger available — travelers often have low battery after flights
• Know the main routes from the airport to downtown, major hotels, and the university
• Be patient — riders may take time collecting luggage and finding the pickup zone
• A friendly greeting goes a long way after a long flight: "Welcome! How was your flight?"
• Airport trips tend to be higher-value fares — maintaining a reliable airport presence is great for your earnings

PEAK TIMES AT AIRPORTS

Airport rideshare demand is typically highest during:

• Early morning departures (4:30 AM - 7:00 AM)
• Evening arrivals (6:00 PM - 10:00 PM)
• Friday evenings and Sunday evenings (business travelers)
• Holiday travel periods (Christmas, summer, long weekends)
• Major local events and festivals

KEY REMINDERS

• ALWAYS wait in the Cell Phone Lot — never at the terminal curb
• ALWAYS pick up at the designated Rideshare/TNC Pickup Zone
• ALWAYS drop off at the public (outer) curb
• ALWAYS display your trade dress decals
• The airport surcharge is automatic — do not ask riders to pay extra
• Violations result in fines up to $250 that YOU must pay
• Follow airport staff instructions at all times — arguing or misbehaving with staff will result in a permanent ban
• ANY fine or misbehavior at the airport = PERMANENT BAN from Spinr — no exceptions',
  9
);

-- =========================================
-- UPDATE QUIZ QUESTIONS 11-13 FOR AIRPORTS
-- Delete old questions and re-insert with
-- generic airport content
-- =========================================

-- Remove old quiz options for questions 11, 12, 13
DELETE FROM quiz_options WHERE question_id = '33333333-3333-3333-3333-333333333311';
DELETE FROM quiz_options WHERE question_id = '33333333-3333-3333-3333-333333333312';
DELETE FROM quiz_options WHERE question_id = '33333333-3333-3333-3333-333333333313';

-- Remove old quiz questions 11, 12, 13
DELETE FROM quiz_questions WHERE id = '33333333-3333-3333-3333-333333333311';
DELETE FROM quiz_questions WHERE id = '33333333-3333-3333-3333-333333333312';
DELETE FROM quiz_questions WHERE id = '33333333-3333-3333-3333-333333333313';

-- Question 11 — Where to wait
INSERT INTO quiz_questions (id, quiz_id, question_text, sort_order) VALUES (
  '33333333-3333-3333-3333-333333333311',
  '22222222-2222-2222-2222-222222222201',
  'Where must you wait while expecting an airport pickup request?',
  11
);
INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES
  ('33333333-3333-3333-3333-333333333311', 'At the terminal curbside near the arrivals door', false, 1),
  ('33333333-3333-3333-3333-333333333311', 'In the Cell Phone Waiting Lot (TNC Staging Area)', true, 2),
  ('33333333-3333-3333-3333-333333333311', 'In the short-term public parking lot', false, 3),
  ('33333333-3333-3333-3333-333333333311', 'Circling the terminal until a request comes in', false, 4);

-- Question 12 — Where to pick up
INSERT INTO quiz_questions (id, quiz_id, question_text, sort_order) VALUES (
  '33333333-3333-3333-3333-333333333312',
  '22222222-2222-2222-2222-222222222201',
  'Where are you allowed to pick up a rider at the airport?',
  12
);
INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES
  ('33333333-3333-3333-3333-333333333312', 'At the commercial curb (taxi zone)', false, 1),
  ('33333333-3333-3333-3333-333333333312', 'At the designated Rideshare/TNC Pickup Zone only', true, 2),
  ('33333333-3333-3333-3333-333333333312', 'At the departures drop-off area', false, 3),
  ('33333333-3333-3333-3333-333333333312', 'In the rental car parking lot', false, 4);

-- Question 13 — Fines for violations
INSERT INTO quiz_questions (id, quiz_id, question_text, sort_order) VALUES (
  '33333333-3333-3333-3333-333333333313',
  '22222222-2222-2222-2222-222222222201',
  'What can happen if you violate airport rideshare pickup and parking rules?',
  13
);
INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES
  ('33333333-3333-3333-3333-333333333313', 'Nothing — airport rules are just suggestions', false, 1),
  ('33333333-3333-3333-3333-333333333313', 'A warning email from Spinr only', false, 2),
  ('33333333-3333-3333-3333-333333333313', 'Fines up to $250, airport access ban, and Spinr disciplinary action', true, 3),
  ('33333333-3333-3333-3333-333333333313', 'A small $25 parking ticket', false, 4);
