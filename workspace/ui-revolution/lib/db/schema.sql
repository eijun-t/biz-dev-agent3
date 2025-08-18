-- =============================================
-- High-Performance Report Storage Schema
-- Optimized for sub-100ms response times
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For composite indexes

-- =============================================
-- Main Reports Table
-- =============================================
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'in_progress', 'completed', 'archived')),
    score INTEGER CHECK (score >= 0 AND score <= 100),
    agents TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    thumbnail VARCHAR(10),
    is_favorite BOOLEAN DEFAULT false,
    author VARCHAR(100) DEFAULT 'AI Agent Pipeline',
    version INTEGER DEFAULT 1,
    search_vector tsvector,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMPTZ,
    
    -- Indexes for performance
    CONSTRAINT reports_title_length CHECK (char_length(title) >= 1)
);

-- Create indexes for fast queries
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_updated_at ON reports(updated_at DESC);
CREATE INDEX idx_reports_status ON reports(status) WHERE status != 'archived';
CREATE INDEX idx_reports_score ON reports(score DESC);
CREATE INDEX idx_reports_favorite ON reports(is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_reports_tags ON reports USING GIN(tags);
CREATE INDEX idx_reports_agents ON reports USING GIN(agents);
CREATE INDEX idx_reports_metadata ON reports USING GIN(metadata);

-- Full-text search index
CREATE INDEX idx_reports_search ON reports USING GIN(search_vector);

-- Composite indexes for common queries
CREATE INDEX idx_reports_status_created ON reports(status, created_at DESC);
CREATE INDEX idx_reports_favorite_created ON reports(is_favorite, created_at DESC) WHERE is_favorite = true;

-- =============================================
-- Search Index Table (Denormalized for speed)
-- =============================================
CREATE TABLE IF NOT EXISTS report_search_index (
    id SERIAL PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    summary TEXT,
    tags TEXT[],
    search_vector tsvector,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(report_id)
);

-- Search indexes
CREATE INDEX idx_search_report_id ON report_search_index(report_id);
CREATE INDEX idx_search_vector ON report_search_index USING GIN(search_vector);
CREATE INDEX idx_search_title_trgm ON report_search_index USING GIN(title gin_trgm_ops);

-- =============================================
-- Report Versions Table (for history tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS report_versions (
    id SERIAL PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    title VARCHAR(200),
    summary TEXT,
    content TEXT,
    metadata JSONB,
    changed_by VARCHAR(100),
    change_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(report_id, version)
);

CREATE INDEX idx_versions_report_id ON report_versions(report_id, version DESC);

-- =============================================
-- User Favorites Table (for quick access)
-- =============================================
CREATE TABLE IF NOT EXISTS user_favorites (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, report_id)
);

CREATE INDEX idx_favorites_user ON user_favorites(user_id, added_at DESC);
CREATE INDEX idx_favorites_report ON user_favorites(report_id);

-- =============================================
-- Analytics Table (for usage tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS report_analytics (
    id SERIAL PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    user_id VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_report ON report_analytics(report_id, created_at DESC);
CREATE INDEX idx_analytics_event ON report_analytics(event_type, created_at DESC);
CREATE INDEX idx_analytics_user ON report_analytics(user_id, created_at DESC);

-- =============================================
-- Functions and Triggers
-- =============================================

-- Auto-update search vector
CREATE OR REPLACE FUNCTION update_search_vector() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.agents, ' '), '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reports_search_vector
    BEFORE INSERT OR UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_search_vector();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Version tracking trigger
CREATE OR REPLACE FUNCTION track_report_version() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF OLD.content != NEW.content OR OLD.title != NEW.title OR OLD.summary != NEW.summary THEN
            NEW.version = OLD.version + 1;
            INSERT INTO report_versions (
                report_id, version, title, summary, content, metadata
            ) VALUES (
                OLD.id, OLD.version, OLD.title, OLD.summary, OLD.content, OLD.metadata
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_reports_version
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION track_report_version();

-- =============================================
-- Row-Level Security (RLS)
-- =============================================

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Policies (adjust based on your auth system)
CREATE POLICY "Reports are viewable by everyone" ON reports
    FOR SELECT USING (true);

CREATE POLICY "Reports are insertable by authenticated users" ON reports
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Reports are updatable by authenticated users" ON reports
    FOR UPDATE USING (true);

CREATE POLICY "Reports are deletable by authenticated users" ON reports
    FOR DELETE USING (status = 'draft' OR status = 'archived');

-- =============================================
-- Performance Views
-- =============================================

-- Recent reports view
CREATE OR REPLACE VIEW recent_reports AS
SELECT 
    r.id,
    r.title,
    r.summary,
    r.status,
    r.score,
    r.tags,
    r.agents,
    r.is_favorite,
    r.created_at,
    r.updated_at,
    COUNT(f.id) as favorite_count
FROM reports r
LEFT JOIN user_favorites f ON r.id = f.report_id
WHERE r.status != 'archived'
    AND r.created_at > NOW() - INTERVAL '30 days'
GROUP BY r.id
ORDER BY r.created_at DESC;

-- Popular reports view
CREATE OR REPLACE VIEW popular_reports AS
SELECT 
    r.*,
    COUNT(a.id) as view_count
FROM reports r
LEFT JOIN report_analytics a ON r.id = a.report_id AND a.event_type = 'view'
WHERE r.status = 'completed'
    AND a.created_at > NOW() - INTERVAL '7 days'
GROUP BY r.id
ORDER BY view_count DESC, r.score DESC
LIMIT 10;

-- =============================================
-- Indexes for Materialized Views (if needed)
-- =============================================

-- Create materialized view for heavy aggregations
CREATE MATERIALIZED VIEW IF NOT EXISTS report_stats AS
SELECT 
    DATE(created_at) as date,
    status,
    COUNT(*) as count,
    AVG(score) as avg_score,
    array_agg(DISTINCT unnest(tags)) as all_tags
FROM reports
GROUP BY DATE(created_at), status
ORDER BY date DESC;

CREATE UNIQUE INDEX idx_report_stats_date_status ON report_stats(date, status);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_report_stats() RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY report_stats;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Sample Data (for testing)
-- =============================================
INSERT INTO reports (title, summary, content, status, score, agents, tags) VALUES
    ('AI Healthcare Innovation', 'Analysis of AI in healthcare', 'Full content...', 'completed', 92, 
     ARRAY['researcher', 'analyst', 'writer'], ARRAY['healthcare', 'AI', 'innovation']),
    ('Sustainable Energy Report', 'Renewable energy opportunities', 'Full content...', 'completed', 88,
     ARRAY['researcher', 'ideator', 'critic', 'analyst', 'writer'], ARRAY['energy', 'sustainability']),
    ('E-commerce Trends 2024', 'Latest e-commerce developments', 'Full content...', 'in_progress', 75,
     ARRAY['researcher', 'ideator'], ARRAY['e-commerce', 'trends', '2024'])
ON CONFLICT DO NOTHING;