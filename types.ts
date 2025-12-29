
export interface Ingredient {
  id: string;
  name: string;
}

export interface MacroNutrients {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface MicroNutrient {
  name: string;
  amount: string;
  dv: number; // Daily Value percentage
}

export interface SafetyCheck {
  hasConflict: boolean;
  conflictingIngredients: string[];
  reason: string;
  scientificExplanation: string;
  severity: 'low' | 'medium' | 'high';
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  missingIngredients: string[];
  instructions: string[];
  macros: MacroNutrients;
  micros: MicroNutrient[];
  safetyCheck: SafetyCheck;
  matchScore: number; // Percentage 0-100
  tags: string[];
  // New fields for User Recipes
  image?: string;
  isUserCreated?: boolean;
  servings?: string;
}

export interface UserProfile {
  allergies: string[];
  dislikes: string[];
}

export interface CompatibilityResult {
  food: string;
  beneficial: Array<{
    pair: string;
    reason: string;
  }>;
  harmful: Array<{
    pair: string;
    reason: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

export interface HealthRecommendation {
  condition: string;
  eat: Array<{
    food: string;
    reason: string;
  }>;
  avoid: Array<{
    food: string;
    reason: string;
  }>;
  lifestyleTips: string[];
}

export interface FoodConditionAnalysis {
  food: string;
  condition: string;
  status: 'Recommended' | 'Safe' | 'Caution' | 'Avoid';
  reason: string;
}
