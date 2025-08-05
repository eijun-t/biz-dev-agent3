export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMConfig {
  model: string
  temperature: number
  maxTokens: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
}

export interface LLMResponse {
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  cost: number
}

export interface LLMService {
  chat(messages: LLMMessage[], config?: Partial<LLMConfig>): Promise<LLMResponse>
  stream(messages: LLMMessage[], config?: Partial<LLMConfig>): AsyncIterableIterator<string>
  calculateCost(usage: { promptTokens: number; completionTokens: number }): number
}