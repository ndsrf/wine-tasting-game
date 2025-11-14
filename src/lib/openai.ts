/**
 * @deprecated This file is now a compatibility layer for the new LLM abstraction.
 * All LLM functionality has been moved to src/lib/llm/
 * This file maintains backward compatibility by delegating to the configured LLM provider.
 */

import { Difficulty, WineCharacteristics } from '@/types';
import { getLLMProvider } from './llm';

interface WineInfo {
  name: string;
  year: number;
}

export interface CanonicalWineInfo {
  canonicalName: string;
  year: number;
  producer?: string;
  region?: string;
}

/**
 * Generate wine characteristics using the configured LLM provider
 * Delegates to the LLM provider configured via LLM_PROVIDER environment variable
 */
export async function generateWineCharacteristics(
  wines: WineInfo[],
  difficulty: Difficulty,
  language: string = 'en'
): Promise<{
  wines: Array<{
    wine: WineInfo;
    characteristics: WineCharacteristics;
    canonicalInfo: CanonicalWineInfo;
  }>;
  similarityWarning?: string;
}> {
  const provider = getLLMProvider();
  return provider.generateWineCharacteristics(wines, difficulty, language);
}

/**
 * Generate educational explanations for wine characteristics using the configured LLM provider
 * Delegates to the LLM provider configured via LLM_PROVIDER environment variable
 */
export async function generateWineExplanations(
  wines: Array<{ name: string; year: number; characteristics: WineCharacteristics }>,
  language: string = 'en'
): Promise<Record<string, { visual: string; smell: string; taste: string }>> {
  const provider = getLLMProvider();
  return provider.generateWineExplanations(wines, language);
}

/**
 * Generate a hint for a specific wine and phase using the configured LLM provider
 * Delegates to the LLM provider configured via LLM_PROVIDER environment variable
 */
export async function generateHint(
  wineName: string,
  wineYear: number,
  phase: 'VISUAL' | 'SMELL' | 'TASTE',
  correctCharacteristics: string[],
  allOptions: string[],
  language: string = 'en'
): Promise<string> {
  const provider = getLLMProvider();
  return provider.generateHint({
    wineName,
    wineYear,
    phase,
    correctCharacteristics,
    allOptions,
    language,
  });
}
