-- Helix Laboratory OS: Supabase Database Setup
-- Copy and paste this into your Supabase SQL Editor

-- 1. Create Samples Table
CREATE TABLE IF NOT EXISTS public.samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_name TEXT NOT NULL,
    test_type TEXT NOT NULL,
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'Pending',
    collected_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT,
    date TEXT,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create Tests Table
CREATE TABLE IF NOT EXISTS public.tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT,
    time TEXT,
    price TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create Equipment Table
CREATE TABLE IF NOT EXISTS public.equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT DEFAULT 'Online',
    health INTEGER DEFAULT 100,
    last_service TEXT,
    temperature TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Create Equipment History Table
CREATE TABLE IF NOT EXISTS public.equipment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID REFERENCES public.equipment(id) ON DELETE CASCADE,
    health INTEGER NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create Policies (Allow all for development/demo)
-- Note: In production, you should restrict these to authenticated users
CREATE POLICY "Allow all operations for samples" ON public.samples FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for reports" ON public.reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for tests" ON public.tests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for equipment" ON public.equipment FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for equipment_history" ON public.equipment_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.samples;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subjects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.equipment;
ALTER PUBLICATION supabase_realtime ADD TABLE public.equipment_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
