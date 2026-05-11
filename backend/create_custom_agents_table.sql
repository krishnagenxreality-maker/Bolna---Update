-- Create the custom_agents table
CREATE TABLE public.custom_agents (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES public.users(user_id) ON DELETE CASCADE,
    agent_name TEXT NOT NULL,
    script TEXT NOT NULL,
    script_type TEXT NOT NULL DEFAULT 'manual',
    bolna_agent_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.custom_agents ENABLE ROW LEVEL SECURITY;

-- Create policy
DROP POLICY IF EXISTS "Allow scoped access for authenticated users on custom_agents" ON public.custom_agents;
CREATE POLICY "Allow scoped access for authenticated users on custom_agents"
ON public.custom_agents FOR ALL
TO authenticated
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);
