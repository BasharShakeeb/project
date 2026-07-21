-- =====================================================================
-- LifeOS — Migration 0002: Ensure DEFAULT auth.uid() on user_id columns
-- Safe to run multiple times (idempotent ALTER COLUMN SET DEFAULT).
-- Run this in Supabase SQL Editor or via Supabase CLI.
-- =====================================================================

-- tasks
ALTER TABLE tasks       ALTER COLUMN user_id SET DEFAULT auth.uid();

-- goals
ALTER TABLE goals       ALTER COLUMN user_id SET DEFAULT auth.uid();

-- habits
ALTER TABLE habits      ALTER COLUMN user_id SET DEFAULT auth.uid();

-- habit_logs
ALTER TABLE habit_logs  ALTER COLUMN user_id SET DEFAULT auth.uid();

-- health_logs
ALTER TABLE health_logs ALTER COLUMN user_id SET DEFAULT auth.uid();

-- transactions
ALTER TABLE transactions ALTER COLUMN user_id SET DEFAULT auth.uid();

-- events
ALTER TABLE events      ALTER COLUMN user_id SET DEFAULT auth.uid();

-- budgets
ALTER TABLE budgets      ALTER COLUMN user_id SET DEFAULT auth.uid();

-- notes
ALTER TABLE notes        ALTER COLUMN user_id SET DEFAULT auth.uid();

-- notifications
ALTER TABLE notifications ALTER COLUMN user_id SET DEFAULT auth.uid();

-- categories
ALTER TABLE categories   ALTER COLUMN user_id SET DEFAULT auth.uid();

-- time_sessions
ALTER TABLE time_sessions ALTER COLUMN user_id SET DEFAULT auth.uid();

-- =====================================================================
-- End of migration
-- =====================================================================
