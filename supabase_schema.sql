-- =========================================================================
-- APEX ATHLETICS // SUPABASE DATABASE SCHEMA
-- Execute this script in your Supabase Dashboard SQL Editor (https://app.supabase.com)
-- =========================================================================

-- 1. Create MEMBERS table
CREATE TABLE IF NOT EXISTS public.members (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    plan VARCHAR(50) DEFAULT 'Apex Pro',
    status VARCHAR(20) DEFAULT 'Active', -- 'Active', 'Pending', 'Expired'
    joined_date DATE DEFAULT CURRENT_DATE,
    check_in VARCHAR(100) DEFAULT 'Never',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create BOOKINGS table (VIP Passes & Class Reservations)
CREATE TABLE IF NOT EXISTS public.bookings (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    type VARCHAR(50) DEFAULT 'VIP Pass', -- 'VIP Pass', 'Class Reservation', 'Membership'
    target VARCHAR(200) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Cancelled'
    code VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create NEWSLETTER Subscribers table
CREATE TABLE IF NOT EXISTS public.newsletter (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create AUDIT_LOGS table (Security & Gate logs)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    event TEXT NOT NULL,
    ip VARCHAR(50) DEFAULT '127.0.0.1',
    status VARCHAR(20) DEFAULT 'SUCCESS', -- 'SUCCESS', 'BLOCKED', 'SECURE'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) FOR PRODUCTION GRADE PROTECTION
-- =========================================================================
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow public anonymous submissions (from website booking & newsletter forms)
CREATE POLICY "Allow public insert to bookings" 
ON public.bookings FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Allow public select bookings" 
ON public.bookings FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow update bookings" 
ON public.bookings FOR UPDATE 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow public insert to members" 
ON public.members FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Allow public select members" 
ON public.members FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow update members" 
ON public.members FOR UPDATE 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow delete members" 
ON public.members FOR DELETE 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow public insert to newsletter" 
ON public.newsletter FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Allow select newsletter" 
ON public.newsletter FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow insert audit_logs" 
ON public.audit_logs FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Allow select audit_logs" 
ON public.audit_logs FOR SELECT 
TO anon, authenticated 
USING (true);

-- =========================================================================
-- SEED INITIAL ATHLETE & BOOKING DATA FOR IMMEDIATE DASHBOARD TESTING
-- =========================================================================
INSERT INTO public.members (id, name, email, phone, plan, status, joined_date, check_in)
VALUES
    ('MEM-10492', 'Damon Krause', 'damon.k@athlete.io', '+1 (555) 392-1049', 'Titan VIP', 'Active', '2024-03-12', 'Today, 06:14 AM'),
    ('MEM-10493', 'Samantha Rhodes', 'samantha.r@techlead.co', '+1 (555) 882-9910', 'Apex Pro', 'Active', '2025-01-08', 'Today, 07:30 AM'),
    ('MEM-10494', 'Tariq Chen', 'tariq.chen@medcenter.org', '+1 (555) 441-2098', 'Titan VIP', 'Active', '2025-06-20', 'Yesterday, 11:45 PM'),
    ('MEM-10495', 'Valerie Pierce', 'v.pierce@speedlab.com', '+1 (555) 670-3341', 'Iron Starter', 'Active', '2025-09-14', 'Today, 08:15 AM'),
    ('MEM-10496', 'Gavin Sterling', 'g.sterling@venture.vc', '+1 (555) 120-7788', 'Apex Pro', 'Pending', '2026-02-01', 'Never'),
    ('MEM-10497', 'Kira Novak', 'k.novak@olympiclifts.net', '+1 (555) 901-4452', 'Titan VIP', 'Active', '2026-02-14', 'Today, 05:45 AM')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.bookings (id, name, email, phone, type, target, status, code)
VALUES
    ('BKG-901', 'Alex Mercer', 'alex@domain.com', '+1 (555) 234-5678', 'VIP Pass', '7-Day All Access VIP Pass', 'Pending', 'APX-771923'),
    ('BKG-902', 'Jordan Hayes', 'jordan@powerlifter.org', '+1 (555) 987-6543', 'Class Reservation', 'Iron Forge: Heavy Barbell Mechanics', 'Confirmed', 'APX-551029'),
    ('BKG-903', 'Lucas Scott', 'lucas@hyroxathlete.com', '+1 (555) 345-6789', 'Class Reservation', 'Hypersonic HIIT: Tabata Blitz', 'Confirmed', 'APX-442819')
ON CONFLICT (id) DO NOTHING;
