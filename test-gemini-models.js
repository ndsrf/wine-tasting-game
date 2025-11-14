/**
 * Test script to check available Gemini models
 * Run with: node test-gemini-models.js
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.development' });

async function listAvailableModels() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in environment');
    process.exit(1);
  }

  console.log('🔑 API Key found (first 10 chars):', apiKey.substring(0, 10) + '...');
  console.log('\n📋 Fetching available models...\n');

  try {
    // Method 1: Try to list models using the API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (!response.ok) {
      console.error('❌ Error response:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      process.exit(1);
    }

    const data = await response.json();

    console.log('✅ Available models:\n');
    data.models.forEach(model => {
      if (model.name.includes('gemini')) {
        console.log(`  • ${model.name}`);
        console.log(`    Description: ${model.description || 'N/A'}`);
        console.log(`    Supported methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
        console.log('');
      }
    });

    // Method 2: Test specific models
    console.log('\n🧪 Testing specific models...\n');

    const modelsToTest = [
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.0-flash-exp',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-pro',
    ];

    const genAI = new GoogleGenerativeAI(apiKey);

    for (const modelName of modelsToTest) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Say "test successful" in 2 words');
        const response = await result.response;
        const text = response.text();
        console.log(`✅ ${modelName}: ${text.trim()}`);
      } catch (error) {
        console.log(`❌ ${modelName}: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    process.exit(1);
  }
}

listAvailableModels();
