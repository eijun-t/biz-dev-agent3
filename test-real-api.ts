/**
 * Real API Test for Broad Researcher Agent
 * Tests with actual API keys
 */

import { SerperSearchService } from './lib/services/serper/serper-search-service'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
}

function print(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function testSerperAPI() {
  print('\n=== Serper API Test ===\n', 'blue')
  
  try {
    // Check if API key is a test key
    if (process.env.SERPER_API_KEY === 'test_key_12345') {
      print('⚠️ Using test API key - skipping real API test', 'yellow')
      print('Please set a real Serper API key in .env.local', 'yellow')
      return false
    }
    
    const searchService = new SerperSearchService()
    
    // Test API key validation
    print('Validating API key...', 'yellow')
    const isValid = await searchService.validateApiKey()
    
    if (!isValid) {
      print('✗ Invalid Serper API key', 'red')
      return false
    }
    
    print('✓ API key is valid', 'green')
    
    // Test Japanese search
    print('\nTesting Japanese search...', 'yellow')
    const jpResult = await searchService.search({
      query: 'AI 不動産 市場規模 2024',
      gl: 'jp',
      hl: 'ja',
      num: 5
    })
    
    print(`✓ Japanese search returned ${jpResult.searchResults.length} results`, 'green')
    if (jpResult.searchResults.length > 0) {
      print(`  First result: ${jpResult.searchResults[0].title}`, 'blue')
    }
    
    // Test English search
    print('\nTesting English search...', 'yellow')
    const enResult = await searchService.search({
      query: 'AI real estate market trends 2024',
      gl: 'us',
      hl: 'en',
      num: 5
    })
    
    print(`✓ English search returned ${enResult.searchResults.length} results`, 'green')
    if (enResult.searchResults.length > 0) {
      print(`  First result: ${enResult.searchResults[0].title}`, 'blue')
    }
    
    // Test cache
    print('\nTesting cache...', 'yellow')
    const cachedResult = await searchService.search({
      query: 'AI 不動産 市場規模 2024',
      gl: 'jp',
      hl: 'ja',
      num: 5
    })
    
    print(`✓ Cache ${cachedResult.cached ? 'hit' : 'miss'}`, cachedResult.cached ? 'green' : 'yellow')
    
    // Summary
    print('\n=== Summary ===\n', 'blue')
    print('✓ Serper API is working correctly', 'green')
    print(`✓ Total results: ${jpResult.totalResults + enResult.totalResults}`, 'green')
    print(`✓ Search time: ${(jpResult.searchTime + enResult.searchTime).toFixed(2)}s`, 'green')
    
    return true
    
  } catch (error) {
    print(`\n✗ Error: ${error}`, 'red')
    return false
  }
}

// Run test
testSerperAPI().then(success => {
  process.exit(success ? 0 : 1)
})