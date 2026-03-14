-- =========================================
-- Spinr Driver LMS — FIX: RLS Infinite Recursion
-- Run this in Supabase SQL Editor to fix the
-- "infinite recursion detected in policy for
-- relation lms_users" error.
-- =========================================

-- Step 1: Create a SECURITY DEFINER function to check admin role
-- This bypasses RLS when checking the user's role, preventing recursion.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.lms_users
    WHERE id = (SELECT auth.uid())
    AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Step 2: Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON lms_users;
DROP POLICY IF EXISTS "Users can update own profile" ON lms_users;
DROP POLICY IF EXISTS "Admins can view all users" ON lms_users;
DROP POLICY IF EXISTS "Service role can insert users" ON lms_users;

DROP POLICY IF EXISTS "Anyone can view published courses" ON courses;
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;

DROP POLICY IF EXISTS "Anyone can view lessons of published courses" ON lessons;
DROP POLICY IF EXISTS "Admins can manage lessons" ON lessons;

DROP POLICY IF EXISTS "Anyone can view quizzes of published courses" ON quizzes;
DROP POLICY IF EXISTS "Admins can manage quizzes" ON quizzes;

DROP POLICY IF EXISTS "Anyone can view questions" ON quiz_questions;
DROP POLICY IF EXISTS "Admins can manage questions" ON quiz_questions;

DROP POLICY IF EXISTS "Anyone can view options" ON quiz_options;
DROP POLICY IF EXISTS "Admins can manage options" ON quiz_options;

DROP POLICY IF EXISTS "Users can view own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can enroll themselves" ON enrollments;
DROP POLICY IF EXISTS "Users can update own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON enrollments;

DROP POLICY IF EXISTS "Users can view own progress" ON lesson_progress;
DROP POLICY IF EXISTS "Users can track own progress" ON lesson_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON lesson_progress;
DROP POLICY IF EXISTS "Admins can view all progress" ON lesson_progress;

DROP POLICY IF EXISTS "Users can view own attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can submit attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Admins can view all attempts" ON quiz_attempts;

DROP POLICY IF EXISTS "Users can view own certificates" ON training_certificates;
DROP POLICY IF EXISTS "Public can verify certificates" ON training_certificates;
DROP POLICY IF EXISTS "Admins can manage certificates" ON training_certificates;

DROP POLICY IF EXISTS "Admins can view audit log" ON audit_log;
DROP POLICY IF EXISTS "System can insert audit entries" ON audit_log;

-- Step 3: Recreate ALL policies using is_admin() function

-- lms_users
CREATE POLICY "Users can view own profile" ON lms_users FOR SELECT
  USING (id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY "Users can update own profile" ON lms_users FOR UPDATE
  USING (id = (SELECT auth.uid()));

CREATE POLICY "Admins can update any user" ON lms_users FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Service role can insert users" ON lms_users FOR INSERT
  WITH CHECK (true);

-- courses
CREATE POLICY "Anyone can view published courses" ON courses FOR SELECT
  USING (is_published = true OR public.is_admin());

CREATE POLICY "Admins can insert courses" ON courses FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update courses" ON courses FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete courses" ON courses FOR DELETE
  USING (public.is_admin());

-- lessons
CREATE POLICY "Anyone can view lessons" ON lessons FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM courses WHERE id = lessons.course_id AND is_published = true)
    OR public.is_admin()
  );

CREATE POLICY "Admins can insert lessons" ON lessons FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update lessons" ON lessons FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete lessons" ON lessons FOR DELETE
  USING (public.is_admin());

-- quizzes
CREATE POLICY "Anyone can view quizzes" ON quizzes FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM courses WHERE id = quizzes.course_id AND is_published = true)
    OR public.is_admin()
  );

CREATE POLICY "Admins can insert quizzes" ON quizzes FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update quizzes" ON quizzes FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete quizzes" ON quizzes FOR DELETE
  USING (public.is_admin());

-- quiz_questions
CREATE POLICY "Anyone can view questions" ON quiz_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quizzes q JOIN courses c ON q.course_id = c.id
      WHERE q.id = quiz_questions.quiz_id AND c.is_published = true
    )
    OR public.is_admin()
  );

CREATE POLICY "Admins can insert questions" ON quiz_questions FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update questions" ON quiz_questions FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete questions" ON quiz_questions FOR DELETE
  USING (public.is_admin());

-- quiz_options
CREATE POLICY "Anyone can view options" ON quiz_options FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quiz_questions qq JOIN quizzes q ON qq.quiz_id = q.id JOIN courses c ON q.course_id = c.id
      WHERE qq.id = quiz_options.question_id AND c.is_published = true
    )
    OR public.is_admin()
  );

CREATE POLICY "Admins can insert options" ON quiz_options FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update options" ON quiz_options FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete options" ON quiz_options FOR DELETE
  USING (public.is_admin());

-- enrollments
CREATE POLICY "Users can view own enrollments" ON enrollments FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY "Users can enroll themselves" ON enrollments FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own enrollments" ON enrollments FOR UPDATE
  USING (user_id = (SELECT auth.uid()) OR public.is_admin());

-- lesson_progress
CREATE POLICY "Users can view own progress" ON lesson_progress FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY "Users can track own progress" ON lesson_progress FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own progress" ON lesson_progress FOR UPDATE
  USING (user_id = (SELECT auth.uid()) OR public.is_admin());

-- quiz_attempts
CREATE POLICY "Users can view own attempts" ON quiz_attempts FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY "Users can submit attempts" ON quiz_attempts FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

-- training_certificates
CREATE POLICY "Anyone can view certificates" ON training_certificates FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR public.is_admin() OR true);

CREATE POLICY "Admins can insert certificates" ON training_certificates FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update certificates" ON training_certificates FOR UPDATE
  USING (public.is_admin());

-- audit_log
CREATE POLICY "Admins can view audit log" ON audit_log FOR SELECT
  USING (public.is_admin());

CREATE POLICY "System can insert audit entries" ON audit_log FOR INSERT
  WITH CHECK (true);
