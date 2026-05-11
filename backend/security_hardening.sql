-- SUPABASE SECURITY HARDENING MIGRATION
-- This script enables RLS on all public tables and creates user-scoped policies for authenticated users.
-- The backend (trusted server) should use the service_role key to bypass these restrictions.

-- 1. REPORTS (No user_id found, defaulting to closed access for public/authenticated clients)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow scoped access for authenticated users on reports" ON public.reports;
CREATE POLICY "Allow scoped access for authenticated users on reports" 
ON public.reports FOR ALL 
TO authenticated 
USING (false) 
WITH CHECK (false);

-- 2. CONTACTS (Uses user_id)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow scoped access for authenticated users on contacts" ON public.contacts;
CREATE POLICY "Allow scoped access for authenticated users on contacts" 
ON public.contacts FOR ALL 
TO authenticated 
USING (user_id = auth.uid()::text) 
WITH CHECK (user_id = auth.uid()::text);

-- 3. APPOINTMENTS (No direct user_id, relies on student_id)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow scoped access for authenticated users on appointments" ON public.appointments;
CREATE POLICY "Allow scoped access for authenticated users on appointments" 
ON public.appointments FOR ALL 
TO authenticated 
USING (false) 
WITH CHECK (false);

-- 4. REQUESTS (No user_id)
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow scoped access for authenticated users on requests" ON public.requests;
CREATE POLICY "Allow scoped access for authenticated users on requests" 
ON public.requests FOR ALL 
TO authenticated 
USING (false) 
WITH CHECK (false);

-- 5. CALLS (Uses user_id)
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow scoped access for authenticated users on calls" ON public.calls;
CREATE POLICY "Allow scoped access for authenticated users on calls" 
ON public.calls FOR ALL 
TO authenticated 
USING (user_id = auth.uid()::text) 
WITH CHECK (user_id = auth.uid()::text);

-- 6. SCHEDULED_CAMPAIGNS (No user_id found)
ALTER TABLE public.scheduled_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow scoped access for authenticated users on scheduled_campaigns" ON public.scheduled_campaigns;
CREATE POLICY "Allow scoped access for authenticated users on scheduled_campaigns" 
ON public.scheduled_campaigns FOR ALL 
TO authenticated 
USING (false) 
WITH CHECK (false);

-- 7. USERS (Uses user_id)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow scoped access for authenticated users on users" ON public.users;
CREATE POLICY "Allow scoped access for authenticated users on users" 
ON public.users FOR ALL 
TO authenticated 
USING (user_id = auth.uid()::text) 
WITH CHECK (user_id = auth.uid()::text);

-- 8. LEADS (Uses user_id)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow scoped access for authenticated users on leads" ON public.leads;
CREATE POLICY "Allow scoped access for authenticated users on leads" 
ON public.leads FOR ALL 
TO authenticated 
USING (user_id = auth.uid()::text) 
WITH CHECK (user_id = auth.uid()::text);

-- 9. STUDENTS (Uses created_by instead of user_id)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow scoped access for authenticated users on students" ON public.students;
CREATE POLICY "Allow scoped access for authenticated users on students" 
ON public.students FOR ALL 
TO authenticated 
USING (created_by = auth.uid()::text) 
WITH CHECK (created_by = auth.uid()::text);

-- 10. ATTENDANCE (No direct user_id, relies on student_id)
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow scoped access for authenticated users on attendance" ON public.attendance;
CREATE POLICY "Allow scoped access for authenticated users on attendance" 
ON public.attendance FOR ALL 
TO authenticated 
USING (false) 
WITH CHECK (false);

-- NOTE: No policies are created for 'anon' role, which effectively locks down 
-- public access to these tables. The backend must use the service_role key.
