-- Create the campaigns table
CREATE TABLE public.campaigns (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.users(user_id) ON DELETE CASCADE,
    campaign_title TEXT NOT NULL,
    campaign_date TEXT NOT NULL,
    uploaded_sheet_name TEXT,
    total_calls INTEGER DEFAULT 0,
    selected_agent TEXT,
    campaign_status TEXT NOT NULL DEFAULT 'Scheduled',
    credits_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Create policy to allow scoped access for authenticated users
DROP POLICY IF EXISTS "Allow scoped access for authenticated users on campaigns" ON public.campaigns;
CREATE POLICY "Allow scoped access for authenticated users on campaigns" 
ON public.campaigns FOR ALL 
TO authenticated 
USING (user_id = auth.uid()::text) 
WITH CHECK (user_id = auth.uid()::text);
