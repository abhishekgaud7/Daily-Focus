-- ==========================================================
-- Dincharya Focus OS - Supabase PostgreSQL Database Schema
-- Run this script in the Supabase SQL Editor to set up tables,
-- foreign keys, indexes, and Row Level Security (RLS) policies.
-- ==========================================================

-- Enable pgcrypto for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------
-- 1. Profiles Table
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    timezone TEXT DEFAULT 'Asia/Kolkata',
    work_start_hour INTEGER DEFAULT 9,
    work_end_hour INTEGER DEFAULT 22,
    sound_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------
-- 2. Daily Blocks Table (Scheduled Focus & Time Blocks)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    task_title TEXT NOT NULL,
    category TEXT CHECK (category IN ('Deep Work', 'Learning', 'Health', 'Break', 'Admin', 'Work', 'Study')) DEFAULT 'Deep Work',
    task_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIME NOT NULL,
    duration_hours NUMERIC(3,1) NOT NULL CHECK (duration_hours > 0),
    end_time TIME NOT NULL,
    status TEXT CHECK (status IN ('pending', 'running', 'completed', 'snoozed', 'skipped')) DEFAULT 'pending',
    notes TEXT,
    ai_suggested BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------
-- 3. Focus Sessions Log Table
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.focus_sessions_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.daily_blocks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    actual_duration_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------
-- 4. Indexes for Rapid Filtering & Minimal Query Overhead
-- ----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_daily_blocks_user_date ON public.daily_blocks(user_id, task_date);
CREATE INDEX IF NOT EXISTS idx_daily_blocks_date_start ON public.daily_blocks(task_date, start_time);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_task ON public.focus_sessions_log(task_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user ON public.focus_sessions_log(user_id);

-- ----------------------------------------------------------
-- 5. Row Level Security (RLS) Policies
-- ----------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions_log ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Daily Blocks Policies
CREATE POLICY "Users can view own daily blocks"
    ON public.daily_blocks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily blocks"
    ON public.daily_blocks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily blocks"
    ON public.daily_blocks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily blocks"
    ON public.daily_blocks FOR DELETE
    USING (auth.uid() = user_id);

-- Focus Sessions Log Policies
CREATE POLICY "Users can view own focus logs"
    ON public.focus_sessions_log FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own focus logs"
    ON public.focus_sessions_log FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own focus logs"
    ON public.focus_sessions_log FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own focus logs"
    ON public.focus_sessions_log FOR DELETE
    USING (auth.uid() = user_id);

-- ----------------------------------------------------------
-- 6. Trigger to automatically create profile on signup
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, timezone)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Focus Achiever'),
        'Asia/Kolkata'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
