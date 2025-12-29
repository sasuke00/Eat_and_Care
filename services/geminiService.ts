import { GoogleGenAI, Type } from "@google/genai";
import { Recipe, UserProfile, CompatibilityResult, HealthRecommendation, FoodConditionAnalysis } from "../types";

const parseRecipeResponse = (responseText: string): Recipe[] => {
  try {
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error("Failed to parse recipe JSON", e);
    return [];
  }
};

const parseCompatibilityResponse = (responseText: string): CompatibilityResult | null => {
  try {
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error("Failed to parse compatibility JSON", e);
    return null;
  }
};

const parseHealthResponse = (responseText: string): HealthRecommendation | null => {
  try {
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error("Failed to parse health JSON", e);
    return null;
  }
};

const parseIngredientsResponse = (responseText: string): string[] => {
  try {
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error("Failed to parse ingredients JSON", e);
    return [];
  }
};

const parseFoodCheckResponse = (responseText: string): FoodConditionAnalysis | null => {
  try {
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error("Failed to parse food check JSON", e);
    return null;
  }
};

const generateRecipeImage = async (recipeName: string): Promise<string | undefined> => {
  if (!process.env.API_KEY) return undefined;
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Professional food photography of ${recipeName}, appetizing, high resolution, studio lighting, clean background, 4k.` }],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9", 
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
  } catch (e) {
    console.warn(`Failed to generate image for ${recipeName}`, e);
    // Don't throw, just return undefined so we fall back to placeholder
  }
  return undefined;
};

export const identifyIngredientsFromImage = async (base64Image: string): Promise<string[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Strip the data URL prefix to get raw base64
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

  const prompt = `
    Analyze this image and identify the raw food ingredients visible (e.g., vegetables, fruits, packaged goods, meats).
    Return ONLY a JSON array of strings containing the names of the identified ingredients. 
    Example output: ["Spinach", "Tomatoes", "Eggs", "Pasta"]
    Do not include explanations or markdown formatting outside the JSON.
    Identify ingredients in English.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
      }
    });

    if (response.text) {
      return parseIngredientsResponse(response.text);
    }
    return [];
  } catch (error) {
    console.error("Gemini Vision API Error:", error);
    throw error;
  }
};

export const generateSmartRecipes = async (
  pantryItems: string[],
  profile: UserProfile,
  excludedRecipes: string[] = [],
  language: 'en' | 'zh' = 'en'
): Promise<Recipe[]> => {
  if (!process.env.API_KEY) {
    console.error("API Key missing");
    throw new Error("API Key is missing. Please set it in the environment.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const langInstruction = language === 'zh' ? 'Respond in Simplified Chinese (zh-CN).' : 'Respond in English.';

  const prompt = `
    You are an expert Clinical Nutritionist and Chef. 
    User has the following ingredients in their pantry: ${pantryItems.join(", ")}.
    
    User Constraints:
    - Allergies (MUST EXCLUDE): ${profile.allergies.join(", ") || "None"}
    - Dislikes (Avoid): ${profile.dislikes.join(", ") || "None"}

    ${excludedRecipes.length > 0 ? `IMPORTANT: Do NOT generate these recipes as they are already displayed: ${excludedRecipes.join(", ")}.` : ""}

    Task:
    1. Generate 3 distinct recipes that utilize the pantry ingredients.
    2. Rank them by "matchScore" (how many pantry ingredients they use).
    3. Perform a "Food Compatibility Safety Check". Identify if any combined ingredients have negative biochemical interactions (e.g., Iron absorption inhibition, high oxalate/calcium conflicts).
    4. Provide estimated Macros and Micros.
    5. ${langInstruction}
    
    Return ONLY a JSON array with the following schema per recipe:
    {
      "id": "unique_string",
      "name": "Recipe Name",
      "description": "Short appetizing description",
      "ingredients": ["list of strings"],
      "missingIngredients": ["list of strings (ingredients user needs but doesn't have)"],
      "instructions": ["step 1", "step 2"],
      "macros": { "calories": number, "protein": number, "carbs": number, "fats": number },
      "micros": [{ "name": "Vitamin A", "amount": "100mcg", "dv": 15 }],
      "safetyCheck": {
        "hasConflict": boolean,
        "conflictingIngredients": ["ing1", "ing2"],
        "reason": "Short warning title",
        "scientificExplanation": "Detailed clinical explanation of the interaction",
        "severity": "low" | "medium" | "high"
      },
      "matchScore": number (0-100 integer),
      "tags": ["Low Carb", "High Protein", etc]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    let recipes: Recipe[] = [];
    if (response.text) {
      recipes = parseRecipeResponse(response.text);
    }

    // Generate images for recipes in parallel
    if (recipes.length > 0) {
      const recipesWithImages = await Promise.all(recipes.map(async (recipe) => {
        const image = await generateRecipeImage(recipe.name);
        return { ...recipe, image };
      }));
      return recipesWithImages;
    }
    
    return recipes;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const analyzeFoodCompatibility = async (foodItem: string, language: 'en' | 'zh' = 'en'): Promise<CompatibilityResult | null> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const langInstruction = language === 'zh' ? 'Respond in Simplified Chinese (zh-CN).' : 'Respond in English.';

  const prompt = `
    You are a specialized Clinical Nutritionist focusing on Food Synergy and Contraindications.
    Analyze the food item: "${foodItem}".
    
    Task:
    1. Identify a comprehensive list (aim for 10-15 items) of BIOCHEMICALLY BENEFICIAL (Synergistic) food pairings. E.g., Vitamin C sources + Non-heme Iron. Prioritize the most potent synergies.
    2. Identify a comprehensive list (aim for 10-20 items) of INCOMPATIBLE or CONTRAINDICATED food pairings. E.g., High Calcium + Iron, or specific digestion speed conflicts causing bloating. Prioritize the most common or severe conflicts. BE EXHAUSTIVE with contraindications.
    3. ${langInstruction}
    
    Return ONLY a JSON object:
    {
      "food": "${foodItem}",
      "beneficial": [
        { "pair": "Food Name", "reason": "Scientific explanation of synergy" }
      ],
      "harmful": [
        { "pair": "Food Name", "reason": "Scientific explanation of conflict", "severity": "low" | "medium" | "high" }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    if (response.text) {
      return parseCompatibilityResponse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const getHealthRecoveryAdvice = async (condition: string, language: 'en' | 'zh' = 'en'): Promise<HealthRecommendation | null> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const langInstruction = language === 'zh' ? 'Respond in Simplified Chinese (zh-CN).' : 'Respond in English.';

  const prompt = `
    You are a Clinical Nutritionist specializing in recovery and symptom management.
    The user has the following condition(s) or symptom(s): "${condition}".
    
    Task:
    1. List 4 specific foods/ingredients that are HIGHLY BENEFICIAL for recovery or soothing symptoms. Consider ALL mentioned conditions (e.g. if "flu and cough", consider both). Explain why scientifically.
    2. List 4 specific foods/ingredients that should be AVOIDED/CONTRAINDICATED because they might aggravate symptoms or inflammation. Explain why.
    3. Provide 3 short clinical lifestyle tips for this specific health situation.
    4. ${langInstruction}

    Return ONLY a JSON object:
    {
      "condition": "${condition}",
      "eat": [
        { "food": "Name", "reason": "Explanation of benefit" }
      ],
      "avoid": [
        { "food": "Name", "reason": "Explanation of risk" }
      ],
      "lifestyleTips": ["Tip 1", "Tip 2", "Tip 3"]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    if (response.text) {
      return parseHealthResponse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const checkFoodSafetyForCondition = async (condition: string, food: string, language: 'en' | 'zh' = 'en'): Promise<FoodConditionAnalysis | null> => {
  if (!process.env.API_KEY) throw new Error("API Key is missing.");

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const langInstruction = language === 'zh' ? 'Respond in Simplified Chinese (zh-CN).' : 'Respond in English.';

  const prompt = `
    As a Clinical Nutritionist, analyze if "${food}" is suitable for someone with "${condition}".
    
    Determine status:
    - 'Recommended': Helps recovery.
    - 'Safe': Neutral, can eat.
    - 'Caution': Eat in moderation or specific preparation.
    - 'Avoid': Worsens symptoms or inflammation.

    Provide a short, clinical reason (max 1 sentence).
    ${langInstruction}

    Return ONLY JSON:
    {
      "food": "${food}",
      "condition": "${condition}",
      "status": "Recommended" | "Safe" | "Caution" | "Avoid",
      "reason": "Explanation string"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    if (response.text) {
      return parseFoodCheckResponse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};