-- =========================================
-- Task 2.1 & 2.2: Orchestration Tables Migration
-- =========================================

-- 1. generation_jobs table
-- ジョブキューを管理するテーブル
CREATE TABLE IF NOT EXISTS generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES ideation_sessions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  priority INTEGER NOT NULL DEFAULT 0,
  
  -- Input/Output as JSONB
  input JSONB NOT NULL,
  output JSONB,
  error TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Indexes for queue management
  CONSTRAINT valid_timestamps CHECK (
    (started_at IS NULL OR started_at >= created_at) AND
    (completed_at IS NULL OR completed_at >= started_at)
  )
);

-- Indexes for efficient queue operations
CREATE INDEX idx_generation_jobs_status ON generation_jobs(status);
CREATE INDEX idx_generation_jobs_user_id ON generation_jobs(user_id);
CREATE INDEX idx_generation_jobs_created_at ON generation_jobs(created_at);
CREATE INDEX idx_generation_jobs_priority_created ON generation_jobs(priority DESC, created_at ASC);
CREATE INDEX idx_generation_jobs_session_id ON generation_jobs(session_id);

-- 2. checkpoints table
-- 中間状態を保存するテーブル
CREATE TABLE IF NOT EXISTS checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ideation_sessions(id) ON DELETE CASCADE,
  state JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 各セッションの最新チェックポイントを効率的に取得
  UNIQUE(session_id, created_at)
);

-- Composite index for efficient checkpoint retrieval
CREATE INDEX idx_checkpoints_session_created ON checkpoints(session_id, created_at DESC);

-- 3. progress_events table (optional, for SSE history)
CREATE TABLE IF NOT EXISTS progress_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ideation_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_progress_events_session ON progress_events(session_id, created_at DESC);

-- 4. RLS Policies for generation_jobs
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own jobs
CREATE POLICY "Users can view own jobs" ON generation_jobs
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own jobs
CREATE POLICY "Users can create own jobs" ON generation_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending/processing jobs
CREATE POLICY "Users can update own jobs" ON generation_jobs
  FOR UPDATE USING (
    auth.uid() = user_id AND 
    status IN ('pending', 'processing')
  );

-- Users can cancel their own jobs
CREATE POLICY "Users can cancel own jobs" ON generation_jobs
  FOR UPDATE USING (
    auth.uid() = user_id AND 
    status IN ('pending', 'processing')
  ) WITH CHECK (
    status = 'cancelled'
  );

-- 5. RLS Policies for checkpoints
ALTER TABLE checkpoints ENABLE ROW LEVEL SECURITY;

-- Users can view checkpoints for their sessions
CREATE POLICY "Users can view own checkpoints" ON checkpoints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ideation_sessions 
      WHERE ideation_sessions.id = checkpoints.session_id 
      AND ideation_sessions.user_id = auth.uid()
    )
  );

-- Service role can manage checkpoints
CREATE POLICY "Service can manage checkpoints" ON checkpoints
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- 6. RLS Policies for progress_events
ALTER TABLE progress_events ENABLE ROW LEVEL SECURITY;

-- Users can view progress events for their sessions
CREATE POLICY "Users can view own progress events" ON progress_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ideation_sessions 
      WHERE ideation_sessions.id = progress_events.session_id 
      AND ideation_sessions.user_id = auth.uid()
    )
  );

-- Service role can create progress events
CREATE POLICY "Service can create progress events" ON progress_events
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- 7. Functions for queue management
CREATE OR REPLACE FUNCTION dequeue_job()
RETURNS generation_jobs AS $$
DECLARE
  job generation_jobs;
BEGIN
  -- Select and lock the highest priority, oldest pending job
  SELECT * INTO job
  FROM generation_jobs
  WHERE status = 'pending'
  ORDER BY priority DESC, created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
  
  -- Update status to processing if found
  IF job.id IS NOT NULL THEN
    UPDATE generation_jobs
    SET status = 'processing',
        started_at = NOW(),
        updated_at = NOW()
    WHERE id = job.id;
  END IF;
  
  RETURN job;
END;
$$ LANGUAGE plpgsql;

-- Function to get active job count
CREATE OR REPLACE FUNCTION get_active_job_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM generation_jobs
    WHERE status = 'processing'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to update job timestamps automatically
CREATE OR REPLACE FUNCTION update_job_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Set completed_at when status changes to completed/failed/cancelled
  IF NEW.status IN ('completed', 'failed', 'cancelled') AND OLD.status != NEW.status THEN
    NEW.completed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_generation_jobs_timestamp
  BEFORE UPDATE ON generation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_job_timestamp();

-- 8. Add comments for documentation
COMMENT ON TABLE generation_jobs IS 'Job queue for multi-agent orchestration';
COMMENT ON COLUMN generation_jobs.priority IS 'Higher priority jobs are processed first (0 = normal, positive = higher priority)';
COMMENT ON COLUMN generation_jobs.input IS 'Job input parameters including theme and options';
COMMENT ON COLUMN generation_jobs.output IS 'Final output from the agent pipeline';

COMMENT ON TABLE checkpoints IS 'Intermediate state checkpoints for job recovery';
COMMENT ON COLUMN checkpoints.state IS 'Complete GraphState serialized as JSON';

COMMENT ON TABLE progress_events IS 'Progress event history for debugging and replay';

COMMENT ON FUNCTION dequeue_job() IS 'Atomically dequeue and lock the next job for processing';
COMMENT ON FUNCTION get_active_job_count() IS 'Get count of currently processing jobs for concurrency control';