-- =========================================
-- Spinr Driver Training — Seed Course
-- Run this AFTER lms_schema.sql
-- =========================================

-- First, insert a placeholder admin user ID for created_by
-- (Replace this UUID with your actual admin user ID after signup)
-- You can find it: SELECT id FROM lms_users WHERE role = 'admin';

-- =========================================
-- COURSE: Spinr Driver Onboarding
-- =========================================
INSERT INTO courses (id, title, description, is_published, sort_order, created_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Spinr Driver Onboarding — Complete Training',
  'Everything you need to know before your first ride. This course covers safety standards, the Spinr app, rider experience, Saskatchewan driving laws, and professional conduct. Complete all lessons and pass the quiz to receive your training certificate.',
  true,
  1,
  NOW()
);

-- =========================================
-- LESSON 1: Welcome to Spinr
-- =========================================
INSERT INTO lessons (id, course_id, title, content, sort_order) VALUES (
  '11111111-1111-1111-1111-111111111101',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Welcome to Spinr',
  'Welcome to Spinr — Saskatchewan''s Own Rideshare!

Thank you for joining the Spinr driver community. As a Spinr driver, you are an independent contractor providing rideshare services across Saskatchewan. We are committed to providing a safe, reliable, and affordable transportation option for riders in Regina, Saskatoon, and beyond.

WHAT MAKES SPINR DIFFERENT

• 0% Commission — You keep 100% of the fare. Riders pay a flat $1 platform fee per trip.
• No Surge Pricing — Same fair price, rain or shine, game day or regular Tuesday.
• Saskatchewan-Focused — We are built for our province, by people who live here.
• Community First — We prioritize driver satisfaction and rider safety equally.

YOUR ROLE AS A SPINR DRIVER

As a Spinr driver, you represent our brand on the road. Every interaction with a rider shapes their experience and our reputation. This training course will prepare you to deliver excellent, safe, and professional service.

WHAT THIS COURSE COVERS

1. Vehicle & Safety Requirements
2. Using the Spinr Driver App
3. Rider Experience & Customer Service
4. Saskatchewan Driving Laws for Rideshare
5. Emergency Procedures & Incident Reporting
6. Earnings, Payments & Tax Basics
7. Professional Conduct & Community Guidelines

After completing all lessons, you will take a quiz. You must score at least 80% to pass and receive your Spinr Driver Training Certificate. This certificate is verifiable by insurance companies and city authorities.

Let''s get started!',
  1
);

-- =========================================
-- LESSON 2: Vehicle & Safety Requirements
-- =========================================
INSERT INTO lessons (id, course_id, title, content, sort_order) VALUES (
  '11111111-1111-1111-1111-111111111102',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Vehicle & Safety Requirements',
  'Vehicle & Safety Requirements

Your vehicle is your workplace. Keeping it safe, clean, and well-maintained is essential for both your safety and your riders'' comfort.

VEHICLE ELIGIBILITY

Your vehicle must meet the following requirements:
• Model year: 2010 or newer
• 4-door sedan, SUV, or minivan
• Valid Saskatchewan vehicle registration
• Valid Saskatchewan vehicle insurance (rideshare endorsement required)
• Must pass a mechanical safety inspection (SGI-approved)
• No salvage or rebuilt titles
• Working air conditioning and heating (Saskatchewan winters demand it!)

REQUIRED DOCUMENTS

You must have these documents on file with Spinr at all times:
• Valid Saskatchewan Class 5 driver''s license (not GDL)
• SGI vehicle registration
• Proof of rideshare insurance (talk to your insurer about adding a rideshare endorsement)
• Criminal Record Check (updated within the last 12 months)
• SGI driver abstract (updated within the last 12 months)

DAILY VEHICLE CHECKLIST

Before starting each driving session, perform this quick check:
□ Tires — Properly inflated, no visible damage
□ Lights — Headlights, brake lights, turn signals all working
□ Windshield — Clean, no cracks that obstruct vision
□ Mirrors — Adjusted properly
□ Seatbelts — All seatbelts functional for every seat
□ Fuel — At least a quarter tank
□ Cleanliness — Interior clean, no strong odors, no personal clutter
□ Phone mount — Secure and visible for navigation
□ Phone — Fully charged or plugged in
□ Water bottles — Optional but recommended for riders in summer

WINTER DRIVING PREPAREDNESS (CRITICAL FOR SASKATCHEWAN)

Saskatchewan winters are harsh. You MUST be prepared:
• Winter tires are MANDATORY from November 1 to April 30
• Keep an emergency kit: blanket, flashlight, ice scraper, small shovel, jumper cables, phone charger
• Clear ALL snow and ice from your vehicle before driving (roof included — it''s the law)
• Allow extra time for trips — adjust speed for road conditions
• If road conditions are too dangerous, it is your right to go offline and stop driving',
  2
);

-- =========================================
-- LESSON 3: Using the Spinr Driver App
-- =========================================
INSERT INTO lessons (id, course_id, title, content, sort_order) VALUES (
  '11111111-1111-1111-1111-111111111103',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Using the Spinr Driver App',
  'Using the Spinr Driver App

The Spinr Driver app is your primary tool for receiving ride requests, navigating to riders, and managing your earnings.

GETTING STARTED

1. Download the Spinr Driver app from the App Store or Google Play
2. Log in with the same email and password you used during sign-up
3. Complete your profile — add a clear, friendly photo of yourself
4. Wait for your account to be approved (documents verification)
5. Once approved, you can go online and start accepting rides!

GOING ONLINE

• Tap the big "Go Online" button on the home screen
• Your location will be shared with the system to match you with nearby riders
• You can set your availability — choose when and where you want to drive
• You can go offline at any time by tapping "Go Offline"

RECEIVING RIDE REQUESTS

When a rider requests a ride near you:
• You''ll hear an alert sound and see the ride details on screen
• You''ll see: Rider name, pickup location, destination, estimated fare
• You have 15 seconds to accept or decline
• Accepting rate matters — consistently declining rides may affect your visibility

DURING A RIDE

1. NAVIGATE TO PICKUP — Follow the in-app navigation to the rider''s location
2. ARRIVE — Tap "Arrived" when you reach the pickup point. Wait up to 5 minutes.
3. START TRIP — Once the rider is in the car and buckled up, tap "Start Trip"
4. FOLLOW ROUTE — Follow the suggested route. If the rider requests a different route, accommodate if safe.
5. END TRIP — When you arrive at the destination, tap "End Trip"

AFTER THE RIDE

• The fare is automatically calculated
• Riders can tip you through the app
• You and the rider can rate each other (1-5 stars)
• All earnings are tracked in the "Earnings" tab

IMPORTANT APP FEATURES

• Heat Map — Shows areas with high rider demand
• Earnings Dashboard — Track daily, weekly, and monthly earnings
• Trip History — Review all past trips
• Support — In-app chat for any issues
• Location Sharing — Your real-time location is shared with riders during pickup for safety',
  3
);

-- =========================================
-- LESSON 4: Rider Experience & Customer Service
-- =========================================
INSERT INTO lessons (id, course_id, title, content, sort_order) VALUES (
  '11111111-1111-1111-1111-111111111104',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Rider Experience & Customer Service',
  'Rider Experience & Customer Service

As a Spinr driver, you are the face of our service. A great rider experience leads to higher ratings, more tips, and more ride requests.

THE GOLDEN RULES

1. Be Friendly — Greet every rider with a smile and a hello
2. Be Safe — Always drive safely, obey traffic laws, no phone use while driving
3. Be Clean — Keep your vehicle spotless inside and out
4. Be Professional — Dress neatly, avoid controversial topics, respect boundaries
5. Be On Time — Arrive at the pickup location promptly

GREETING YOUR RIDER

When the rider gets in:
• "Hi [Name], welcome to Spinr! Heading to [destination]?"
• Confirm the destination matches what''s in the app
• Ask about temperature preferences (AC/heat)
• Ask about music preferences or offer a quiet ride

CONVERSATION ETIQUETTE

• Follow the rider''s lead — some want to chat, others prefer quiet
• NEVER discuss politics, religion, or controversial topics
• If a rider seems uncomfortable, give them space
• Do NOT ask personal questions (where they live, relationship status, etc.)
• Keep your phone conversations for after the ride

HANDLING DIFFICULT SITUATIONS

Rude or Aggressive Riders:
• Stay calm and professional at all times
• Do not argue or escalate
• If you feel unsafe, pull over safely and end the trip
• Report the incident through the app immediately

Intoxicated Riders:
• You may accept or refuse intoxicated riders — it''s your choice
• If they are too intoxicated to give directions or are being disruptive, you may end the ride
• NEVER let a rider ride without a seatbelt
• If a rider vomits in your car, document with photos and report through the app for a cleaning fee

RATING SYSTEM

• Riders rate you 1-5 stars after each trip
• Your average rating is visible in the app
• Maintaining above 4.7 stars keeps you in good standing
• Dropping below 4.5 may result in account review
• Common reasons for low ratings: dirty car, rude behavior, unsafe driving, wrong route',
  4
);

-- =========================================
-- LESSON 5: Saskatchewan Driving Laws
-- =========================================
INSERT INTO lessons (id, course_id, title, content, sort_order) VALUES (
  '11111111-1111-1111-1111-111111111105',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Saskatchewan Driving Laws for Rideshare',
  'Saskatchewan Driving Laws for Rideshare

As a rideshare driver in Saskatchewan, you must comply with all provincial traffic laws plus specific rideshare regulations administered by SGI (Saskatchewan Government Insurance).

DISTRACTED DRIVING — ZERO TOLERANCE

Saskatchewan has strict distracted driving laws:
• You CANNOT hold or use a cell phone while driving
• Your phone MUST be in a hands-free mount
• Penalty: $580 fine + 4 demerit points (first offence)
• Use voice commands or pull over safely if you need to interact with your phone

SEATBELT LAWS

• All vehicle occupants MUST wear seatbelts
• As the driver, YOU are responsible for ensuring all passengers are buckled
• Children: appropriate car seats required for children under 7 or under 40 lbs
• Fine: $175 per unbuckled occupant

SPEED LIMITS

• Residential zones: 50 km/h (unless posted otherwise)
• School zones: 30 km/h (during posted hours — year round)
• Highways: 100-110 km/h (check posted signs)
• Construction zones: Fines are DOUBLED

IMPAIRED DRIVING — ABSOLUTE ZERO TOLERANCE FOR RIDESHARE

• As a rideshare driver, you MUST have 0.00% BAC at all times while on duty
• This is stricter than the general public limit
• Never consume alcohol or cannabis before or during any driving session
• SGI penalties for impaired driving: license suspension, vehicle seizure, criminal charges
• Spinr policy: Immediate permanent deactivation of your driver account

RIDESHARE-SPECIFIC REGULATIONS (SGI)

• You must have a valid rideshare endorsement on your vehicle insurance
• Your vehicle must pass an SGI-approved safety inspection
• You must have a clean criminal record check
• The Spinr platform is registered as a Transportation Network Company (TNC) with the province
• Pickup/dropoff rules: Follow all no-stopping and no-parking signs. Use designated rideshare zones where available (e.g., Mosaic Stadium, airports)

WINTER DRIVING LAWS

• Winter tires are strongly recommended and required by Spinr policy Nov 1 – Apr 30
• You must clear all ice and snow from your vehicle before driving
• You must adjust speed for conditions — driving too fast for conditions is chargeable even under the speed limit
• Use headlights at all times in winter (good practice year-round)',
  5
);

-- =========================================
-- LESSON 6: Emergency Procedures
-- =========================================
INSERT INTO lessons (id, course_id, title, content, sort_order) VALUES (
  '11111111-1111-1111-1111-111111111106',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Emergency Procedures & Incident Reporting',
  'Emergency Procedures & Incident Reporting

Your safety and your rider''s safety come first. Knowing what to do in emergencies can save lives.

IF YOU ARE IN A COLLISION

1. STOP immediately — never leave the scene of an accident
2. CHECK for injuries — call 911 if anyone is hurt
3. MOVE to safety — if the vehicle is drivable and it''s safe, move off the road
4. EXCHANGE information — name, phone, insurance, license plate with other driver(s)
5. DOCUMENT — Take photos of all vehicles, damage, license plates, and the scene
6. REPORT to police — Saskatchewan law requires you to report any collision over $2,000 in damage
7. REPORT in the app — Use the Spinr Driver app to report the incident immediately
8. CONTACT your insurance company within 24 hours

IF A RIDER MAKES YOU FEEL UNSAFE

• Trust your instincts — your safety comes first
• Do NOT escalate or argue
• Pull over to a safe, well-lit, public area
• End the trip in the app
• If there is an immediate threat, call 911
• Lock your doors after the rider exits
• Report the incident in the app with as much detail as possible

IF A RIDER HAS A MEDICAL EMERGENCY

• Pull over safely
• Call 911 immediately
• Provide the dispatcher with your exact location (the app shows your GPS coordinates)
• Stay on the line with 911 and follow their instructions
• Do not move the rider unless they are in immediate danger
• Wait for emergency services to arrive
• Report the incident in the app

WHAT TO DO IF YOU WITNESS A CRIME

• Do NOT intervene directly
• Call 911 and report what you see
• Note descriptions: persons, vehicles, license plates, direction of travel
• Report to Spinr after ensuring your own safety

LOST ITEMS

• Check your vehicle after every ride
• If you find a rider''s item, report it in the "Lost Item" section of the app
• Spinr will facilitate the return — do NOT contact the rider directly with personal phone numbers
• You may receive a return fee for bringing the item back

IMPORTANT NUMBERS

• Emergency: 911
• SGI (Saskatchewan Government Insurance): 1-844-855-2744
• Spinr Support: In-app chat or support@spinr.ca
• Saskatchewan Crime Stoppers: 1-800-222-TIPS',
  6
);

-- =========================================
-- LESSON 7: Earnings & Payments
-- =========================================
INSERT INTO lessons (id, course_id, title, content, sort_order) VALUES (
  '11111111-1111-1111-1111-111111111107',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Earnings, Payments & Tax Basics',
  'Earnings, Payments & Tax Basics

One of the best things about driving with Spinr: you keep 100% of your fares. Here''s how earnings work.

HOW FARES ARE CALCULATED

Spinr uses a transparent fare structure:
• Base fare + per-km rate + per-minute rate = total fare
• Riders see the fare estimate before requesting
• NO surge pricing — ever. The fare is the fare.
• Riders pay a flat $1 platform fee on top — this goes to Spinr, not you
• Tips are 100% yours and on top of the fare

HOW YOU GET PAID

• Earnings accumulate in your Spinr Driver account
• Payouts are processed weekly (every Monday for the previous week)
• Paid directly to your linked bank account via Stripe
• Set up your bank account in the Driver app under Settings → Payment
• You can request instant payouts (small processing fee may apply)

TRACKING YOUR EARNINGS

The Earnings dashboard in the app shows:
• Daily, weekly, and monthly breakdowns
• Fare earnings vs tip earnings
• Number of trips completed
• Online hours
• Average earnings per hour and per trip

TAX OBLIGATIONS — IMPORTANT

As an independent contractor, you are responsible for your own taxes:

• You are SELF-EMPLOYED — Spinr does not deduct taxes from your earnings
• You must report rideshare income on your tax return
• You will receive a tax summary from Spinr for the year
• You can deduct expenses: fuel, vehicle maintenance, car washes, phone plan (business portion), insurance (rideshare portion)
• KEEP RECEIPTS for all business-related expenses
• Consider setting aside 15-25% of your earnings for taxes
• Consult a tax professional — this guide is not tax advice

GST/HST CONSIDERATIONS

• If you earn more than $30,000/year from rideshare, you must register for GST
• Saskatchewan has 5% GST (no PST on rideshare services)
• Consult a tax professional for your specific situation

MAXIMIZING YOUR EARNINGS

• Drive during peak hours: weekday mornings (7-9 AM), evenings (5-7 PM), weekends (10 PM - 2 AM)
• Check the Heat Map for high-demand areas
• Game days at Mosaic Stadium are high-earning opportunities
• University areas around U of R and U of S are busy during school terms
• Maintain a high rating — it affects how many rides you get
• Keep your vehicle clean — riders tip more in clean cars',
  7
);

-- =========================================
-- LESSON 8: Professional Conduct
-- =========================================
INSERT INTO lessons (id, course_id, title, content, sort_order) VALUES (
  '11111111-1111-1111-1111-111111111108',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Professional Conduct & Community Guidelines',
  'Professional Conduct & Community Guidelines

As a Spinr driver, you represent our community. We hold ourselves to high standards.

CODE OF CONDUCT

1. SAFETY FIRST — Never compromise on safety. Obey all traffic laws.
2. ZERO DISCRIMINATION — Treat all riders equally regardless of race, gender, religion, sexual orientation, disability, or any other characteristic. This is the law (Saskatchewan Human Rights Code).
3. NO HARASSMENT — Any form of harassment, verbal or physical, results in immediate deactivation.
4. NO IMPAIRMENT — Zero tolerance for alcohol, cannabis, or any substance that impairs driving.
5. PRIVACY — Do not share rider information. Do not record audio/video of riders without consent.
6. HONESTY — Do not manipulate fares, take unnecessary detours, or engage in fraudulent behavior.

ACCESSIBILITY

• You MUST accept riders with service animals — no exceptions (it''s the law)
• Assist riders with disabilities to the best of your ability
• If a rider uses a wheelchair, help them if needed and accommodate the chair in your trunk
• Never charge extra for accessibility needs
• If your vehicle cannot accommodate a specific accessibility need, decline politely and recommend they request another vehicle

DRESS CODE

There is no strict uniform, but:
• Dress neatly and cleanly
• Avoid clothing with offensive messages or images
• Personal hygiene matters — riders will rate you on overall experience

WHAT WILL GET YOU DEACTIVATED

Immediate deactivation:
• Impaired driving
• Physical assault or harassment
• Discrimination
• Criminal activity
• Fraudulent behavior
• Consistently unsafe driving (multiple reports)

Account review (potential deactivation):
• Rating below 4.5 stars consistently
• Excessive ride cancellations
• Repeated complaints from riders
• Failure to maintain vehicle standards

SPINR COMMUNITY VALUES

We believe in:
• Fair pay for drivers — that''s why we charge 0% commission
• Affordable rides for our neighbors
• Building something Saskatchewan can be proud of
• Supporting each other as a community

Thank you for completing this training. You are now ready to take the quiz and earn your Spinr Driver Training Certificate. Good luck!

If you have any questions, reach out to support@spinr.ca or use the in-app chat.',
  8
);

-- =========================================
-- QUIZ: Driver Onboarding Quiz
-- =========================================
INSERT INTO quizzes (id, course_id, title, passing_score, sort_order) VALUES (
  '22222222-2222-2222-2222-222222222201',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Spinr Driver Onboarding Quiz',
  80,
  1
);

-- Question 1
INSERT INTO quiz_questions (id, quiz_id, question_text, sort_order) VALUES (
  '33333333-3333-3333-3333-333333333301',
  '22222222-2222-2222-2222-222222222201',
  'What commission does Spinr charge drivers on fares?',
  1
);
INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES
  ('33333333-3333-3333-3333-333333333301', '10% commission', false, 1),
  ('33333333-3333-3333-3333-333333333301', '25% commission', false, 2),
  ('33333333-3333-3333-3333-333333333301', '0% — drivers keep 100% of fares', true, 3),
  ('33333333-3333-3333-3333-333333333301', '5% commission', false, 4);

-- Question 2
INSERT INTO quiz_questions (id, quiz_id, question_text, sort_order) VALUES (
  '33333333-3333-3333-3333-333333333302',
  '22222222-2222-2222-2222-222222222201',
  'What is the maximum Blood Alcohol Content (BAC) allowed while driving for Spinr?',
  2
);
INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES
  ('33333333-3333-3333-3333-333333333302', '0.05%', false, 1),
  ('33333333-3333-3333-3333-333333333302', '0.08%', false, 2),
  ('33333333-3333-3333-3333-333333333302', '0.00% — absolute zero tolerance', true, 3),
  ('33333333-3333-3333-3333-333333333302', '0.02%', false, 4);

-- Question 3
INSERT INTO quiz_questions (id, quiz_id, question_text, sort_order) VALUES (
  '33333333-3333-3333-3333-333333333303',
  '22222222-2222-2222-2222-222222222201',
  'What is the fine for using a handheld cell phone while driving in Saskatchewan?',
  3
);
INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES
  ('33333333-3333-3333-3333-333333333303', '$100 fine', false, 1),
  ('33333333-3333-3333-3333-333333333303', '$580 fine + 4 demerit points', true, 2),
  ('33333333-3333-3333-3333-333333333303', 'Warning on first offence', false, 3),
  ('33333333-3333-3333-3333-333333333303', '$250 fine', false, 4);

-- Question 4
INSERT INTO quiz_questions (id, quiz_id, question_text, sort_order) VALUES (
  '33333333-3333-3333-3333-333333333304',
  '22222222-2222-2222-2222-222222222201',
  'What should you do FIRST if you are involved in a collision during a ride?',
  4
);
INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES
  ('33333333-3333-3333-3333-333333333304', 'Call Spinr support', false, 1),
  ('33333333-3333-3333-3333-333333333304', 'Drive away if damage seems minor', false, 2),
  ('33333333-3333-3333-3333-333333333304', 'Stop immediately and check for injuries', true, 3),
  ('33333333-3333-3333-3333-333333333304', 'Take photos of the damage', false, 4);

-- Question 5
INSERT INTO quiz_questions (id, quiz_id, question_text, sort_order) VALUES (
  '33333333-3333-3333-3333-333333333305',
  '22222222-2222-2222-2222-222222222201',
  'Can you refuse a rider who has a service animal?',
  5
);
INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES
  ('33333333-3333-3333-3333-333333333305', 'Yes, if you have allergies', false, 1),
  ('33333333-3333-3333-3333-333333333305', 'Yes, if the animal is large', false, 2),
  ('33333333-3333-3333-3333-333333333305', 'No — you must accept service animals, it is the law', true, 3),
  ('33333333-3333-3333-3333-333333333305', 'Yes, if your vehicle is too small', false, 4);

-- Question 6
INSERT INTO quiz_questions (id, quiz_id, question_text, sort_order) VALUES (
  '33333333-3333-3333-3333-333333333306',
  '22222222-2222-2222-2222-222222222201',
  'When are winter tires required by Spinr policy in Saskatchewan?',
  6
);
INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES
  ('33333333-3333-3333-3333-333333333306', 'December 1 to March 31', false, 1),
  ('33333333-3333-3333-3333-333333333306', 'November 1 to April 30', true, 2),
  ('33333333-3333-3333-3333-333333333306', 'Only when there is snow on the ground', false, 3),
  ('33333333-3333-3333-3333-333333333306', 'They are optional', false, 4);

-- Question 7
INSERT INTO quiz_questions (id, quiz_id, question_text, sort_order) VALUES (
  '33333333-3333-3333-3333-333333333307',
  '22222222-2222-2222-2222-222222222201',
  'What speed limit applies in school zones in Saskatchewan?',
  7
);
INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES
  ('33333333-3333-3333-3333-333333333307', '40 km/h', false, 1),
  ('33333333-3333-3333-3333-333333333307', '30 km/h', true, 2),
  ('33333333-3333-3333-3333-333333333307', '50 km/h', false, 3),
  ('33333333-3333-3333-3333-333333333307', '20 km/h', false, 4);

-- Question 8
INSERT INTO quiz_questions (id, quiz_id, question_text, sort_order) VALUES (
  '33333333-3333-3333-3333-333333333308',
  '22222222-2222-2222-2222-222222222201',
  'As a self-employed rideshare driver, which of the following is TRUE about taxes?',
  8
);
INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES
  ('33333333-3333-3333-3333-333333333308', 'Spinr deducts taxes from your earnings automatically', false, 1),
  ('33333333-3333-3333-3333-333333333308', 'You do not need to pay taxes on rideshare income', false, 2),
  ('33333333-3333-3333-3333-333333333308', 'You must report income and pay taxes yourself', true, 3),
  ('33333333-3333-3333-3333-333333333308', 'You only pay taxes if you earn over $50,000', false, 4);

-- Question 9
INSERT INTO quiz_questions (id, quiz_id, question_text, sort_order) VALUES (
  '33333333-3333-3333-3333-333333333309',
  '22222222-2222-2222-2222-222222222201',
  'What should you do if a rider makes you feel unsafe during a trip?',
  9
);
INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES
  ('33333333-3333-3333-3333-333333333309', 'Argue with the rider to establish authority', false, 1),
  ('33333333-3333-3333-3333-333333333309', 'Pull over safely, end the trip, and call 911 if needed', true, 2),
  ('33333333-3333-3333-3333-333333333309', 'Speed up to finish the trip quickly', false, 3),
  ('33333333-3333-3333-3333-333333333309', 'Ignore the situation and complete the ride', false, 4);

-- Question 10
INSERT INTO quiz_questions (id, quiz_id, question_text, sort_order) VALUES (
  '33333333-3333-3333-3333-333333333310',
  '22222222-2222-2222-2222-222222222201',
  'What rating must you maintain to stay in good standing with Spinr?',
  10
);
INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES
  ('33333333-3333-3333-3333-333333333310', 'Above 4.0 stars', false, 1),
  ('33333333-3333-3333-3333-333333333310', 'Above 3.5 stars', false, 2),
  ('33333333-3333-3333-3333-333333333310', 'Above 4.7 stars', true, 3),
  ('33333333-3333-3333-3333-333333333310', 'Above 4.9 stars', false, 4);
