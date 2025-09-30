export const VISUAL_CHARACTERISTICS = {
  Colour: ['Ruby red', 'Garnet', 'Purple', 'Brick red', 'Deep red', 'Light red', 'Golden yellow', 'Pale yellow', 'Straw yellow', 'Greenish yellow'],
  Clarity: ['Clear', 'Hazy', 'Brilliant', 'Cloudy', 'Transparent', 'Opaque'],
  Intensity: ['Pale', 'Medium', 'Deep'],
  Appearance: ['Bright', 'Dull', 'Youthful', 'Aged'],
  Hue: ['Red', 'Yellow', 'Brown', 'Orange'],
};

export const SMELL_CHARACTERISTICS = {
  'Primary Aroma': ['Fruity', 'Floral', 'Spicy', 'Herbal', 'Earthy', 'Mineral'],
  'Secondary Aroma': ['Woody', 'Vanilla', 'Oak', 'Creamy', 'Buttery'],
  'Tertiary Aroma': ['Leather', 'Tobacco', 'Chocolate', 'Coffee', 'Caramel', 'Honey', 'Nutty'],
  Bouquet: ['Complex', 'Simple', 'Developing', 'Mature'],
  Nose: ['Clean', 'Intense', 'Subtle', 'Open', 'Closed'],
};

export const TASTE_CHARACTERISTICS = {
  Sweetness: ['Dry', 'Off-Dry', 'Medium-Dry', 'Medium-Sweet', 'Sweet'],
  Acidity: ['Low', 'Medium-Minus', 'Medium', 'Medium-Plus', 'High'],
  Tannins: ['Low', 'Medium', 'High', 'Grippy', 'Smooth', 'Harsh', 'Soft'],
  Body: ['Light-bodied', 'Medium-bodied', 'Full-bodied', 'Rich', 'Delicate'],
  Finish: ['Short', 'Medium', 'Long', 'Warming', 'Clean'],
};

// For backwards compatibility with old code that might use the flat arrays
export const VISUAL_OPTIONS = Object.values(VISUAL_CHARACTERISTICS).flat();
export const SMELL_OPTIONS = Object.values(SMELL_CHARACTERISTICS).flat();
export const TASTE_OPTIONS = Object.values(TASTE_CHARACTERISTICS).flat();