-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Ideation sessions table
CREATE TABLE public.ideation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'initializing' CHECK (status IN ('initializing', 'researching', 'generating', 'analyzing', 'completed', 'error')),
  current_phase TEXT NOT NULL DEFAULT 'initialization',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Business ideas table
CREATE TABLE public.business_ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.ideation_sessions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  market_analysis TEXT NOT NULL,
  revenue_projection BIGINT NOT NULL CHECK (revenue_projection >= 0),
  implementation_difficulty TEXT NOT NULL CHECK (implementation_difficulty IN ('low', 'medium', 'high')),
  time_to_market TEXT NOT NULL,
  required_resources TEXT[] NOT NULL DEFAULT '{}',
  risks TEXT[] NOT NULL DEFAULT '{}',
  opportunities TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Idea feedback table
CREATE TABLE public.idea_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID NOT NULL REFERENCES public.business_ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(idea_id, user_id)
);

-- Agent execution logs table
CREATE TABLE public.agent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.ideation_sessions(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL CHECK (agent_name IN ('researcher', 'ideator', 'critic', 'analyst', 'writer')),
  message TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- System logs table
CREATE TABLE public.system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.ideation_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_ideation_sessions_user_id ON public.ideation_sessions(user_id);
CREATE INDEX idx_ideation_sessions_status ON public.ideation_sessions(status);
CREATE INDEX idx_business_ideas_session_id ON public.business_ideas(session_id);
CREATE INDEX idx_idea_feedback_idea_id ON public.idea_feedback(idea_id);
CREATE INDEX idx_idea_feedback_user_id ON public.idea_feedback(user_id);
CREATE INDEX idx_agent_logs_session_id ON public.agent_logs(session_id);
CREATE INDEX idx_system_logs_session_id ON public.system_logs(session_id);
CREATE INDEX idx_system_logs_user_id ON public.system_logs(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Users can read their own sessions
CREATE POLICY "Users can read own sessions" ON public.ideation_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own sessions
CREATE POLICY "Users can create own sessions" ON public.ideation_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions" ON public.ideation_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can read ideas from their sessions
CREATE POLICY "Users can read ideas from own sessions" ON public.business_ideas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ideation_sessions
      WHERE ideation_sessions.id = business_ideas.session_id
      AND ideation_sessions.user_id = auth.uid()
    )
  );

-- Users can read their own feedback
CREATE POLICY "Users can read own feedback" ON public.idea_feedback
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create feedback for ideas they can access
CREATE POLICY "Users can create feedback" ON public.idea_feedback
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.business_ideas
      JOIN public.ideation_sessions ON ideation_sessions.id = business_ideas.session_id
      WHERE business_ideas.id = idea_feedback.idea_id
      AND ideation_sessions.user_id = auth.uid()
    )
  );

-- Users can read logs from their sessions
CREATE POLICY "Users can read logs from own sessions" ON public.agent_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ideation_sessions
      WHERE ideation_sessions.id = agent_logs.session_id
      AND ideation_sessions.user_id = auth.uid()
    )
  );

-- Users can read their own system logs
CREATE POLICY "Users can read own system logs" ON public.system_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Create function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ideation_sessions_updated_at BEFORE UPDATE ON public.ideation_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();