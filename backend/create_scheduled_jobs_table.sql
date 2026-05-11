-- Create the scheduled_jobs table
CREATE TABLE public.scheduled_jobs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.users(user_id) ON DELETE CASCADE,
    campaign_title TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    agent_name TEXT,
    contacts JSONB NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    api_key TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.scheduled_jobs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow scoped access for authenticated users
DROP POLICY IF EXISTS "Allow scoped access for authenticated users on scheduled_jobs" ON public.scheduled_jobs;
CREATE POLICY "Allow scoped access for authenticated users on scheduled_jobs" 
ON public.scheduled_jobs FOR ALL 
TO authenticated 
USING (user_id = auth.uid()::text) 
WITH CHECK (user_id = auth.uid()::text);