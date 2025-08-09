import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

console.log('Environment variables check:')
console.log('SERPER_API_KEY:', process.env.SERPER_API_KEY ? `${process.env.SERPER_API_KEY.substring(0, 10)}...` : 'NOT SET')
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 10)}...` : 'NOT SET')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET')