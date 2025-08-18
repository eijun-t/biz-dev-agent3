-- Supabaseダッシュボードで実行してください
-- SQL Editor > New Query でこのSQLを実行

-- 1. ideation_sessionsテーブルに不足しているカラムを追加
ALTER TABLE public.ideation_sessions 
ADD COLUMN IF NOT EXISTS theme TEXT,
ADD COLUMN IF NOT EXISTS topic TEXT,
ADD COLUMN IF NOT EXISTS result JSONB,
ADD COLUMN IF NOT EXISTS final_report JSONB;

-- 2. 既存のレコードにデフォルト値を設定
UPDATE public.ideation_sessions 
SET theme = 'Unknown Theme' 
WHERE theme IS NULL;

UPDATE public.ideation_sessions 
SET topic = theme 
WHERE topic IS NULL AND theme IS NOT NULL;

-- 3. インデックスを追加
CREATE INDEX IF NOT EXISTS idx_ideation_sessions_created_at 
ON public.ideation_sessions(created_at DESC);

-- 4. 確認用クエリ
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ideation_sessions' 
AND table_schema = 'public'
ORDER BY ordinal_position;