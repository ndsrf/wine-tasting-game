import OpenAI from 'openai'
import { Difficulty, WineCharacteristics } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface WineInfo {
  name: string
  year: number
}

const CHARACTERISTIC_COUNTS = {
  NOVICE: 3,
  INTERMEDIATE: 5,
  SOMMELIER: 10,
}

const VISUAL_OPTIONS = [
  'Ruby red', 'Garnet', 'Purple', 'Brick red', 'Deep red', 'Light red',
  'Golden yellow', 'Pale yellow', 'Straw yellow', 'Greenish yellow',
  'Clear', 'Hazy', 'Brilliant', 'Cloudy', 'Transparent', 'Opaque'
]

const SMELL_OPTIONS = [
  'Fruity', 'Floral', 'Spicy', 'Herbal', 'Earthy', 'Woody', 'Vanilla',
  'Oak', 'Berry', 'Citrus', 'Tropical', 'Stone fruit', 'Red fruit',
  'Black fruit', 'Mineral', 'Smoky', 'Leather', 'Tobacco', 'Chocolate',
  'Coffee', 'Caramel', 'Honey', 'Nutty', 'Grassy', 'Vegetal'
]

const TASTE_OPTIONS = [
  'Sweet', 'Dry', 'Semi-dry', 'Acidic', 'Tart', 'Smooth', 'Tannic',
  'Bold', 'Light', 'Medium-bodied', 'Full-bodied', 'Crisp', 'Round',
  'Balanced', 'Complex', 'Simple', 'Harsh', 'Soft', 'Rich', 'Delicate',
  'Intense', 'Subtle', 'Long finish', 'Short finish', 'Warming'
]

export async function generateWineCharacteristics(
  wines: WineInfo[],
  difficulty: Difficulty
): Promise<{ wines: Array<{ wine: WineInfo; characteristics: WineCharacteristics }>, similarityWarning?: string }> {
  const characteristicCount = CHARACTERISTIC_COUNTS[difficulty]

  try {
    const wineDescriptions = wines.map(wine => `${wine.name} (${wine.year})`).join(', ')

    const prompt = `You are a sommelier expert. For each of these wines: ${wineDescriptions}

Generate exactly ${characteristicCount} characteristics for each category (visual, smell, taste) for each wine.

Visual characteristics should be selected from: ${VISUAL_OPTIONS.join(', ')}
Smell characteristics should be selected from: ${SMELL_OPTIONS.join(', ')}
Taste characteristics should be selected from: ${TASTE_OPTIONS.join(', ')}

Make sure the characteristics are realistic for each wine type and vintage. Ensure there are meaningful differences between wines to make the guessing game challenging but fair.

Return the response in this exact JSON format:
{
  "wines": [
    {
      "name": "Wine Name",
      "year": 2020,
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
          content: 'You are a professional sommelier with deep knowledge of wine characteristics. Always respond with valid JSON only.',
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

    const processedWines = result.wines.map((wineData: any, index: number) => ({
      wine: wines[index],
      characteristics: wineData.characteristics,
    }))

    const similarityWarning = checkSimilarity(processedWines.map(w => w.characteristics))

    return {
      wines: processedWines,
      similarityWarning,
    }
  } catch (error) {
    console.error('OpenAI API error:', error)

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

export { VISUAL_OPTIONS, SMELL_OPTIONS, TASTE_OPTIONS }