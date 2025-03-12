
-- This SQL will be executed separately by the user
CREATE TABLE IF NOT EXISTS public.nutrition_chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add Row Level Security (RLS)
ALTER TABLE public.nutrition_chat_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own chat logs
CREATE POLICY "Users can view their own chat logs" 
  ON public.nutrition_chat_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy for system to insert chat logs
CREATE POLICY "System can insert chat logs" 
  ON public.nutrition_chat_logs 
  FOR INSERT 
  WITH CHECK (true);
