import OpenAI from 'openai';
import { Difficulty, WineCharacteristics } from '@/types';
import { VISUAL_OPTIONS, SMELL_OPTIONS, TASTE_OPTIONS } from './wine-options';

interface WineInfo {
  name: string;
  year: number;
}

const CHARACTERISTIC_COUNTS = {
  NOVICE: 3,
  INTERMEDIATE: 4,
  SOMMELIER: 5,
};

export async function generateWineCharacteristics(
  wines: WineInfo[],
  difficulty: Difficulty,
  language: string = 'en'
): Promise<{ wines: Array<{ wine: WineInfo; characteristics: WineCharacteristics }>, similarityWarning?: string }> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const characteristicCount = CHARACTERISTIC_COUNTS[difficulty];

  try {
    const wineDescriptions = wines.map(wine => `${wine.name} (${wine.year})`).join(', ')

    const prompt = `You are a sommelier expert. Respond in English only.

For each of these wines: ${wineDescriptions}

Generate exactly ${characteristicCount} characteristics for each category (visual, smell, taste) for each wine.

Visual characteristics should be selected from: ${VISUAL_OPTIONS.join(', ')}
Smell characteristics should be selected from: ${SMELL_OPTIONS.join(', ')}
Taste characteristics should be selected from: ${TASTE_OPTIONS.join(', ')}

IMPORTANT: All characteristic names MUST be in English exactly as they appear in the lists above, regardless of the user's language preference. The application will handle translation.

Make sure the characteristics are realistic for each wine type and vintage. Ensure there are meaningful differences between wines to make the guessing game challenging but fair.

For each wine, also provide a confidence score (0-100) indicating how certain you are about the wine's identity and ability to provide accurate characteristics. Consider:
- Whether the wine name is recognizable and specific
- Whether the vintage year is appropriate for that wine
- Whether you have enough information to provide accurate characteristics

If the wine name is vague, misspelled, or you're uncertain about its identity, assign a lower confidence score.

Return the response in this exact JSON format:
{
  "wines": [
    {
      "name": "Wine Name",
      "year": 2020,
      "confidence": 95,
      "characteristics": {
        "visual": ["characteristic1", "characteristic2", "characteristic3"],
        "smell": ["characteristic1", "characteristic2", "characteristic3"],
        "taste": ["characteristic1", "characteristic2", "characteristic3"]
      }
    }
  ]
}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a professional sommelier with deep knowledge of wine characteristics. Respond in English only. Always respond with valid JSON only.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    const result = JSON.parse(content)

    // Check confidence scores
    const lowConfidenceWines = result.wines.filter((wineData: any) => {
      const confidence = wineData.confidence || 0
      return confidence < 80
    })

    if (lowConfidenceWines.length > 0) {
      // Return structured data for translation on the client side
      const error: any = new Error('LOW_CONFIDENCE_WINES')
      error.isConfidenceError = true
      error.lowConfidenceWines = lowConfidenceWines.map((w: any) => ({
        name: w.name,
        year: w.year,
        confidence: w.confidence || 0
      }))
      throw error
    }

    const processedWines = result.wines.map((wineData: any, index: number) => ({
      wine: wines[index],
      characteristics: wineData.characteristics,
    }))

    const similarityWarning = checkSimilarity(processedWines.map((w: { wine: WineInfo; characteristics: WineCharacteristics }) => w.characteristics))

    return {
      wines: processedWines,
      similarityWarning,
    }
  } catch (error) {
    console.error('OpenAI API error:', error)

    // If it's a confidence error, throw it so the game creation fails
    if (error instanceof Error && (error as any).isConfidenceError) {
      throw error
    }

    return {
      wines: wines.map(wine => ({
        wine,
        characteristics: generateFallbackCharacteristics(difficulty),
      })),
      similarityWarning: 'Using fallback characteristics due to API error.',
    }
  }
}

function generateFallbackCharacteristics(difficulty: Difficulty): WineCharacteristics {
  const count = CHARACTERISTIC_COUNTS[difficulty]

  const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  return {
    visual: shuffleArray(VISUAL_OPTIONS).slice(0, count),
    smell: shuffleArray(SMELL_OPTIONS).slice(0, count),
    taste: shuffleArray(TASTE_OPTIONS).slice(0, count),
  }
}

function checkSimilarity(characteristics: WineCharacteristics[]): string | undefined {
  if (characteristics.length < 2) return undefined

  const categories: (keyof WineCharacteristics)[] = ['visual', 'smell', 'taste']
  let totalSimilarity = 0
  let comparisons = 0

  for (let i = 0; i < characteristics.length; i++) {
    for (let j = i + 1; j < characteristics.length; j++) {
      for (const category of categories) {
        const wine1Chars = characteristics[i][category]
        const wine2Chars = characteristics[j][category]
        const commonChars = wine1Chars.filter(char => wine2Chars.includes(char))
        const similarity = commonChars.length / Math.max(wine1Chars.length, wine2Chars.length)
        totalSimilarity += similarity
        comparisons++
      }
    }
  }

  const averageSimilarity = totalSimilarity / comparisons

  if (averageSimilarity > 0.6) {
    return 'Warning: The wine characteristics are quite similar. This may make the game too difficult for players to distinguish between wines.'
  }

  return undefined
}

export async function generateWineExplanations(
  wines: Array<{ name: string; year: number; characteristics: WineCharacteristics }>,
  language: string = 'en'
): Promise<Record<string, { visual: string; smell: string; taste: string }>> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const wineDescriptions = wines.map((wine, index) =>
      `Wine ${index + 1}: ${wine.name} (${wine.year})\n` +
      `Visual: ${wine.characteristics.visual.join(', ')}\n` +
      `Smell: ${wine.characteristics.smell.join(', ')}\n` +
      `Taste: ${wine.characteristics.taste.join(', ')}`
    ).join('\n\n')

    const languageNames: Record<string, string> = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German'
    }

    const targetLanguage = languageNames[language] || 'English'

    const prompt = `You are a sommelier expert. For each wine listed below, provide educational explanations for why each characteristic (visual, smell, taste) is correct for that specific wine.

Wines:
${wineDescriptions}

For each wine, explain:
1. Visual characteristics: Why does this wine have these visual properties? Consider the grape variety, age, winemaking process, etc.
2. Smell characteristics: Why does this wine have these aromatic properties? Explain the origin of these aromas.
3. Taste characteristics: Why does this wine have these taste properties? Explain how the characteristics relate to the wine's origin, production, and composition.

IMPORTANT: Respond in ${targetLanguage} language.

Return the response in this exact JSON format:
{
  "Wine 1": {
    "visual": "Explanation for visual characteristics...",
    "smell": "Explanation for smell characteristics...",
    "taste": "Explanation for taste characteristics..."
  },
  "Wine 2": {
    "visual": "Explanation for visual characteristics...",
    "smell": "Explanation for smell characteristics...",
    "taste": "Explanation for taste characteristics..."
  }
}

Keep each explanation concise (4-5 sentences) but informative.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a professional sommelier providing educational explanations about wine characteristics. Respond in ${targetLanguage}. Always respond with valid JSON only.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    const explanations = JSON.parse(content)
    return explanations
  } catch (error) {
    console.error('OpenAI API error for explanations:', error)

    // Return fallback explanations
    const fallbackExplanations: Record<string, { visual: string; smell: string; taste: string }> = {}
    wines.forEach((wine, index) => {
      const wineKey = `Wine ${index + 1}`
      fallbackExplanations[wineKey] = {
        visual: `The visual characteristics of ${wine.name} (${wine.year}) are typical for this type of wine.`,
        smell: `The aromatic profile of ${wine.name} (${wine.year}) reflects its grape variety and winemaking process.`,
        taste: `The taste characteristics of ${wine.name} (${wine.year}) are influenced by its terroir and aging.`
      }
    })

    return fallbackExplanations
  }
}

export async function generateHint(
  wineName: string,
  wineYear: number,
  phase: 'VISUAL' | 'SMELL' | 'TASTE',
  correctCharacteristics: string[],
  allOptions: string[],
  language: string = 'en'
): Promise<string> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const languageNames: Record<string, string> = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German'
    }

    const targetLanguage = languageNames[language] || 'English'
    const phaseNames = {
      VISUAL: 'visual',
      SMELL: 'smell/aroma',
      TASTE: 'taste'
    }

    const prompt = `You are a sommelier helping a student learn about wine tasting. A student is trying to identify the ${phaseNames[phase]} characteristics of a wine (${wineYear}).

The available options are: ${allOptions.join(', ')}

Without revealing the exact answers, provide an educational hint (1-2 sentences) that helps the student understand what to look for in this wine's ${phaseNames[phase]} characteristics. Focus on general properties of this type of wine, its grape variety, region, or age that would guide them toward the correct characteristics.

IMPORTANT:
- Do NOT mention the wine's name - just say "this wine"
- Do NOT mention the specific correct characteristics directly
- Do NOT say things like "look for X, Y, and Z" where X, Y, Z are the exact answers
- Instead, describe general qualities or what to expect from this wine type
- Respond in ${targetLanguage} language

Example good hint: "This wine from 2015 typically shows characteristics associated with mature wines that have undergone oak aging."
Example bad hint: "Look for Ruby red, Oak, and Medium-bodied." (too specific)
Example bad hint: "Château Margaux typically shows..." (mentions wine name)`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a helpful sommelier providing educational hints without giving away answers. Respond in ${targetLanguage}.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
    })

    const hint = response.choices[0]?.message?.content
    if (!hint) {
      throw new Error('No hint generated')
    }

    return hint.trim()
  } catch (error) {
    console.error('OpenAI API error for hint generation:', error)

    // Return fallback hint based on phase
    const fallbackHints: Record<string, string> = {
      VISUAL: `Consider what the appearance of this wine tells you about its age and type.`,
      SMELL: `Think about the typical aromas you'd find in this wine based on its grape variety and production.`,
      TASTE: `Consider the body, acidity, and flavor profile typical of this wine.`
    }

    return fallbackHints[phase] || `Think about the typical characteristics of this wine.`
  }
}
