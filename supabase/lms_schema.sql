-- =========================================
-- Spinr Driver LMS — Database Schema
-- Run this in Supabase SQL Editor
-- =========================================

-- LMS Users (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS lms_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'driver' CHECK (role IN ('driver', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Courses
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_by UUID REFERENCES lms_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lessons
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quizzes
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  passing_score INT NOT NULL DEFAULT 70,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz Questions
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  sort_order INT DEFAULT 0
);

-- Quiz Options
CREATE TABLE IF NOT EXISTS quiz_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0
);

-- Enrollments
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES lms_users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled','in_progress','completed')),
  progress NUMERIC DEFAULT 0,
  completed_at TIMESTAMPTZ,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Lesson Progress
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES lms_users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, lesson_id)
);

-- Quiz Attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES lms_users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL,
  passed BOOLEAN NOT NULL,
  answers JSONB,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training Certificates (insurance & city compliance)
CREATE TABLE IF NOT EXISTS training_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_number TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES lms_users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  driver_name TEXT NOT NULL,
  driver_email TEXT NOT NULL,
  course_title TEXT NOT NULL,
  final_quiz_score NUMERIC,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','revoked','expired')),
  metadata JSONB
);

-- Audit Log (immutable compliance records)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES lms_users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_certificates_user ON training_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_number ON training_certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);

-- Enable RLS on all tables
ALTER TABLE lms_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- lms_users: users can read their own profile, admins can read all
CREATE POLICY "Users can view own profile" ON lms_users FOR SELECT USING (id = (select auth.uid()));
CREATE POLICY "Users can update own profile" ON lms_users FOR UPDATE USING (id = (select auth.uid()));
CREATE POLICY "Admins can view all users" ON lms_users FOR SELECT USING (
  EXISTS (SELECT 1 FROM lms_users WHERE id = (select auth.uid()) AND role = 'admin')
);
CREATE POLICY "Service role can insert users" ON lms_users FOR INSERT WITH CHECK (true);

-- courses: anyone authenticated can read published, admins can CRUD
CREATE POLICY "Anyone can view published courses" ON courses FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage courses" ON courses FOR ALL USING (
  EXISTS (SELECT 1 FROM lms_users WHERE id = (select auth.uid()) AND role = 'admin')
);

-- lessons: anyone authenticated can read lessons of published courses
CREATE POLICY "Anyone can view lessons of published courses" ON lessons FOR SELECT USING (
  EXISTS (SELECT 1 FROM courses WHERE id = lessons.course_id AND is_published = true)
);
CREATE POLICY "Admins can manage lessons" ON lessons FOR ALL USING (
  EXISTS (SELECT 1 FROM lms_users WHERE id = (select auth.uid()) AND role = 'admin')
);

-- quizzes
CREATE POLICY "Anyone can view quizzes of published courses" ON quizzes FOR SELECT USING (
  EXISTS (SELECT 1 FROM courses WHERE id = quizzes.course_id AND is_published = true)
);
CREATE POLICY "Admins can manage quizzes" ON quizzes FOR ALL USING (
  EXISTS (SELECT 1 FROM lms_users WHERE id = (select auth.uid()) AND role = 'admin')
);

-- quiz_questions
CREATE POLICY "Anyone can view questions" ON quiz_questions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM quizzes q JOIN courses c ON q.course_id = c.id
    WHERE q.id = quiz_questions.quiz_id AND c.is_published = true
  )
);
CREATE POLICY "Admins can manage questions" ON quiz_questions FOR ALL USING (
  EXISTS (SELECT 1 FROM lms_users WHERE id = (select auth.uid()) AND role = 'admin')
);

-- quiz_options (hide is_correct from non-admins handled in app logic)
CREATE POLICY "Anyone can view options" ON quiz_options FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM quiz_questions qq JOIN quizzes q ON qq.quiz_id = q.id JOIN courses c ON q.course_id = c.id
    WHERE qq.id = quiz_options.question_id AND c.is_published = true
  )
);
CREATE POLICY "Admins can manage options" ON quiz_options FOR ALL USING (
  EXISTS (SELECT 1 FROM lms_users WHERE id = (select auth.uid()) AND role = 'admin')
);

-- enrollments: users manage own enrollments
CREATE POLICY "Users can view own enrollments" ON enrollments FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can enroll themselves" ON enrollments FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update own enrollments" ON enrollments FOR UPDATE USING (user_id = (select auth.uid()));
CREATE POLICY "Admins can view all enrollments" ON enrollments FOR SELECT USING (
  EXISTS (SELECT 1 FROM lms_users WHERE id = (select auth.uid()) AND role = 'admin')
);

-- lesson_progress
CREATE POLICY "Users can view own progress" ON lesson_progress FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can track own progress" ON lesson_progress FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update own progress" ON lesson_progress FOR UPDATE USING (user_id = (select auth.uid()));
CREATE POLICY "Admins can view all progress" ON lesson_progress FOR SELECT USING (
  EXISTS (SELECT 1 FROM lms_users WHERE id = (select auth.uid()) AND role = 'admin')
);

-- quiz_attempts
CREATE POLICY "Users can view own attempts" ON quiz_attempts FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can submit attempts" ON quiz_attempts FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Admins can view all attempts" ON quiz_attempts FOR SELECT USING (
  EXISTS (SELECT 1 FROM lms_users WHERE id = (select auth.uid()) AND role = 'admin')
);

-- training_certificates
CREATE POLICY "Users can view own certificates" ON training_certificates FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Public can verify certificates" ON training_certificates FOR SELECT USING (true);
CREATE POLICY "Admins can manage certificates" ON training_certificates FOR ALL USING (
  EXISTS (SELECT 1 FROM lms_users WHERE id = (select auth.uid()) AND role = 'admin')
);

-- audit_log: only admins can read, system inserts
CREATE POLICY "Admins can view audit log" ON audit_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM lms_users WHERE id = (select auth.uid()) AND role = 'admin')
);
CREATE POLICY "System can insert audit entries" ON audit_log FOR INSERT WITH CHECK (true);
