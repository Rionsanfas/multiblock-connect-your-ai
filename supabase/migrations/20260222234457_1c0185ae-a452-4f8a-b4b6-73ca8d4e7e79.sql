
-- Helper function to generate secure random tokens
CREATE OR REPLACE FUNCTION public.generate_webhook_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(24), 'hex');
END;
$$ LANGUAGE plpgsql;

-- 1. openclaw_connections table
CREATE TABLE public.openclaw_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  webhook_token TEXT UNIQUE NOT NULL DEFAULT public.generate_webhook_token(),
  webhook_url TEXT NOT NULL DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'disconnected')),
  last_heartbeat TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. agents table
CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  openclaw_agent_id TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT,
  tools JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'stopped', 'error')),
  board_id UUID REFERENCES public.boards(id) ON DELETE SET NULL,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_run_at TIMESTAMPTZ,
  UNIQUE(user_id, openclaw_agent_id)
);

-- 3. activity_logs table
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'error', 'success', 'warning')),
  message TEXT NOT NULL,
  details TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_openclaw_connections_user_id ON public.openclaw_connections(user_id);
CREATE INDEX idx_openclaw_connections_token ON public.openclaw_connections(webhook_token);
CREATE INDEX idx_agents_user_id ON public.agents(user_id);
CREATE INDEX idx_agents_status ON public.agents(status);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_timestamp ON public.activity_logs(timestamp DESC);

-- RLS: openclaw_connections
ALTER TABLE public.openclaw_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own connection"
ON public.openclaw_connections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own connection"
ON public.openclaw_connections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connection"
ON public.openclaw_connections FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connection"
ON public.openclaw_connections FOR DELETE
USING (auth.uid() = user_id);

-- RLS: agents
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agents"
ON public.agents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agents"
ON public.agents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agents"
ON public.agents FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agents"
ON public.agents FOR DELETE
USING (auth.uid() = user_id);

-- RLS: activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity logs"
ON public.activity_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activity logs"
ON public.activity_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activity logs"
ON public.activity_logs FOR DELETE
USING (auth.uid() = user_id);

-- Trigger to auto-set webhook_url on insert
CREATE OR REPLACE FUNCTION public.set_webhook_details()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.webhook_token IS NULL OR NEW.webhook_token = '' THEN
    NEW.webhook_token = public.generate_webhook_token();
  END IF;
  NEW.webhook_url = 'https://dpeljwqtkjjkriobkhtj.supabase.co/functions/v1/openclaw-webhook?token=' || NEW.webhook_token;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_webhook_details_trigger
BEFORE INSERT ON public.openclaw_connections
FOR EACH ROW
EXECUTE FUNCTION public.set_webhook_details();

-- Trigger for updated_at on openclaw_connections
CREATE TRIGGER update_openclaw_connections_updated_at
BEFORE UPDATE ON public.openclaw_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on agents
CREATE TRIGGER update_agents_updated_at
BEFORE UPDATE ON public.agents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
