import { LLMProvider, LLMProviderType } from './types';
import { OpenAIProvider } from './providers/openai';
import { GeminiProvider } from './providers/gemini';
import { AnthropicProvider } from './providers/anthropic';

let cachedProvider: LLMProvider | null = null;

/**
 * Get the configured LLM provider
 * Returns a singleton instance based on the LLM_PROVIDER environment variable
 * Defaults to OpenAI if not specified
 */
export function getLLMProvider(): LLMProvider {
  // Return cached provider if available
  if (cachedProvider) {
    return cachedProvider;
  }

  const providerType = (process.env.LLM_PROVIDER || 'openai').toLowerCase() as LLMProviderType;

  switch (providerType) {
    case 'openai':
      cachedProvider = new OpenAIProvider();
      break;
    case 'gemini':
      cachedProvider = new GeminiProvider();
      break;
    case 'anthropic':
      cachedProvider = new AnthropicProvider();
      break;
    default:
      console.warn(`Unknown LLM provider: ${providerType}. Falling back to OpenAI.`);
      cachedProvider = new OpenAIProvider();
  }

  console.log(`Initialized LLM provider: ${providerType}`);
  return cachedProvider;
}

// Re-export types and interfaces
export * from './types';
