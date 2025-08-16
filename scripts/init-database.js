/**
 * Database Initialization Script
 * 
 * Supabaseデータベースに必要なテーブルを作成
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function initDatabase() {
  console.log('Initializing database...');

  try {
    // Check if tables exist
    const { data: existingTables, error: checkError } = await supabase
      .from('ideation_sessions')
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log('Tables already exist');
      
      // Create generation_jobs table if it doesn't exist
      const { error: jobsError } = await supabase.rpc('create_generation_jobs_table', {
        sql: `
          CREATE TABLE IF NOT EXISTS generation_jobs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            session_id UUID NOT NULL REFERENCES ideation_sessions(id) ON DELETE CASCADE,
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
            priority INTEGER NOT NULL DEFAULT 0,
            input JSONB NOT NULL,
            output JSONB,
            error TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            started_at TIMESTAMPTZ,
            completed_at TIMESTAMPTZ
          );
          
          CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON generation_jobs(status);
          CREATE INDEX IF NOT EXISTS idx_generation_jobs_user_id ON generation_jobs(user_id);
          CREATE INDEX IF NOT EXISTS idx_generation_jobs_created_at ON generation_jobs(created_at);
        `
      });

      if (jobsError) {
        console.log('Note: Could not create generation_jobs table via RPC. Please create it manually in Supabase dashboard.');
      } else {
        console.log('generation_jobs table created or already exists');
      }

      return;
    }

    console.log('Tables need to be created. Please run the SQL migrations in Supabase dashboard:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the migration files from supabase/migrations/ directory');
    console.log('   - 20250108_initial_schema.sql');
    console.log('   - 20250113_orchestration_tables.sql');
    console.log('   - 20250113_add_html_reports_table.sql');

  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase()
  .then(() => {
    console.log('Database initialization complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database initialization failed:', error);
    process.exit(1);
  });