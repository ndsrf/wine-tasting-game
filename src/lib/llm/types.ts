import { Difficulty, WineCharacteristics } from '@/types';
import { CanonicalWineInfo } from '../openai';

export interface WineInfo {
  name: string;
  year: number;
}

export interface GenerateWineCharacteristicsResult {
  wines: Array<{
    wine: WineInfo;
    characteristics: WineCharacteristics;
    canonicalInfo: CanonicalWineInfo;
  }>;
  similarityWarning?: string;
}

export interface GenerateWineExplanationsInput {
  name: string;
  year: number;
  characteristics: WineCharacteristics;
}

export interface GenerateHintInput {
  wineName: string;
  wineYear: number;
  phase: 'VISUAL' | 'SMELL' | 'TASTE';
  correctCharacteristics: string[];
  allOptions: string[];
  language?: string;
}

/**
 * Abstract interface for LLM providers
 * All LLM providers must implement these methods
 */
export interface LLMProvider {
  /**
   * Generate wine characteristics for a list of wines
   */
  generateWineCharacteristics(
    wines: WineInfo[],
    difficulty: Difficulty,
    language?: string
  ): Promise<GenerateWineCharacteristicsResult>;

  /**
   * Generate educational explanations for wine characteristics
   */
  generateWineExplanations(
    wines: GenerateWineExplanationsInput[],
    language?: string
  ): Promise<Record<string, { visual: string; smell: string; taste: string }>>;

  /**
   * Generate a hint for a specific wine and phase
   */
  generateHint(input: GenerateHintInput): Promise<string>;
}

export type LLMProviderType = 'openai' | 'gemini' | 'anthropic';
