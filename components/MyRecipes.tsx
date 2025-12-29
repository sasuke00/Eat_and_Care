import React, { useState } from 'react';
import { Plus, Image as ImageIcon, Trash2, Book, ArrowLeft, Save, Upload, X } from 'lucide-react';
import { Button } from './Button';
import { Recipe } from '../types';
import { useLanguage } from '../LanguageContext';

interface MyRecipesProps {
  recipes: Recipe[];
  onSave: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
  onView: (recipe: Recipe) => void;
}

export const MyRecipes: React.FC<MyRecipesProps> = ({ recipes, onSave, onDelete, onView }) => {
  const { t } = useLanguage();
  const [view, setView] = useState<'list' | 'create'>('list');
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState('');
  const [image, setImage] = useState<string | null>(null);
  
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [instructions, setInstructions] = useState<string[]>(['']);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5000000) { // 5MB limit
        alert(t.errorImageTooLarge);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateIngredient = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const addIngredientField = () => setIngredients([...ingredients, '']);
  const removeIngredientField = (index: number) => setIngredients(ingredients.filter((_, i) => i !== index));

  const updateInstruction = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
  };

  const addInstructionField = () => setInstructions([...instructions, '']);
  const removeInstructionField = (index: number) => setInstructions(instructions.filter((_, i) => i !== index));

  const handleSubmit = () => {
    if (!name.trim()) return;

    const newRecipe: Recipe = {
      id: Date.now().toString(),
      name,
      description: description || 'User created recipe',
      ingredients: ingredients.filter(i => i.trim()),
      missingIngredients: [],
      instructions: instructions.filter(i => i.trim()),
      macros: { calories: 0, protein: 0, carbs: 0, fats: 0 },
      micros: [],
      safetyCheck: {
        hasConflict: false,
        conflictingIngredients: [],
        reason: '',
        scientificExplanation: '',
        severity: 'low'
      },
      matchScore: 100,
      tags: ['My Recipe'],
      image: image || undefined,
      isUserCreated: true,
      servings
    };

    onSave(newRecipe);
    resetForm();
    setView('list');
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setServings('');
    setImage(null);
    setIngredients(['']);
    setInstructions(['']);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {view === 'list' && (
        <>
          <div className="flex justify-between items-center mb-8">
            <div>
               <h2 className="text-3xl font-bold text-sage-900 flex items-center gap-3">
                 <Book className="h-8 w-8 text-sage-600" />
                 {t.myCookbook}
               </h2>
               <p className="text-sage-500 mt-1">{t.startBuilding}</p>
            </div>
            <Button onClick={() => setView('create')}>
              <Plus className="h-5 w-5 mr-2" /> {t.createRecipe}
            </Button>
          </div>

          {recipes.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-sage-200 p-12 text-center">
              <div className="mx-auto h-16 w-16 bg-sage-50 rounded-full flex items-center justify-center mb-4">
                <Book className="h-8 w-8 text-sage-400" />
              </div>
              <h3 className="text-lg font-medium text-sage-900">{t.noRecipesYet}</h3>
              <p className="mt-2 text-sage-500 max-w-sm mx-auto mb-6">
                {t.startBuilding}
              </p>
              <Button variant="outline" onClick={() => setView('create')}>{t.createFirst}</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map(recipe => (
                <div key={recipe.id} className="bg-white rounded-xl shadow-sm border border-sage-100 overflow-hidden group hover:shadow-md transition-all">
                  <div className="relative h-48 bg-sage-100 cursor-pointer" onClick={() => onView(recipe)}>
                    {recipe.image ? (
                      <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sage-400">
                        <ImageIcon className="h-10 w-10" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                       <button 
                         onClick={(e) => { e.stopPropagation(); onDelete(recipe.id); }}
                         className="p-2 bg-white/90 text-red-500 rounded-full shadow-sm hover:bg-red-50 transition-colors"
                       >
                         <Trash2 className="h-4 w-4" />
                       </button>
                    </div>
                  </div>
                  <div className="p-5 cursor-pointer" onClick={() => onView(recipe)}>
                    <h3 className="font-bold text-lg text-sage-900 mb-1">{recipe.name}</h3>
                    <p className="text-sm text-sage-500 line-clamp-2">{recipe.description}</p>
                    <div className="mt-4 flex items-center text-xs text-sage-400 font-medium">
                      <span>{recipe.ingredients.length} {t.ingredients}</span>
                      <span className="mx-2">•</span>
                      <span>{recipe.servings || '-'} {t.servings}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view === 'create' && (
        <div className="bg-white rounded-xl shadow-sm border border-sage-100 max-w-3xl mx-auto overflow-hidden">
          <div className="border-b border-sage-100 p-6 flex items-center justify-between bg-sage-50/50">
             <div className="flex items-center">
               <button onClick={() => setView('list')} className="mr-4 text-sage-500 hover:text-sage-700">
                 <ArrowLeft className="h-6 w-6" />
               </button>
               <h2 className="text-xl font-bold text-sage-900">{t.createRecipe}</h2>
             </div>
             <Button onClick={handleSubmit} disabled={!name}>
               <Save className="h-4 w-4 mr-2" /> {t.saveRecipe}
             </Button>
          </div>
          
          <div className="p-8 space-y-8">
            {/* Image Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-sage-700">{t.recipeImage}</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-sage-200 border-dashed rounded-lg cursor-pointer bg-sage-50 hover:bg-sage-100 transition-colors relative overflow-hidden">
                  {image ? (
                    <>
                      <img src={image} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white font-medium">{t.changeImage}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-sage-400" />
                      <p className="mb-2 text-sm text-sage-500"><span className="font-semibold">{t.clickToUpload}</span> cover photo</p>
                      <p className="text-xs text-sage-400">PNG, JPG (Max 5MB)</p>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-sage-700 mb-1">{t.recipeName}</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-sage-200 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-500 bg-white text-sage-900"
                  placeholder="e.g. Grandma's Chicken Soup"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-sage-700 mb-1">{t.description}</label>
                <textarea 
                  className="w-full px-4 py-2 border border-sage-200 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-500 bg-white text-sage-900"
                  rows={2}
                  placeholder="A short description of the dish..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-1">{t.servings}</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-sage-200 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-500 bg-white text-sage-900"
                  placeholder="e.g. 4 people"
                  value={servings}
                  onChange={e => setServings(e.target.value)}
                />
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-sage-700">{t.ingredients}</label>
                <button onClick={addIngredientField} className="text-xs text-sage-600 hover:text-sage-800 font-medium flex items-center">
                  <Plus className="h-3 w-3 mr-1" /> {t.addItem}
                </button>
              </div>
              <div className="space-y-2">
                {ingredients.map((ing, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input 
                      type="text" 
                      className="flex-1 px-3 py-2 border border-sage-200 rounded-lg text-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500 bg-white text-sage-900"
                      placeholder={`Ingredient ${idx + 1}`}
                      value={ing}
                      onChange={e => updateIngredient(idx, e.target.value)}
                    />
                    {ingredients.length > 1 && (
                      <button onClick={() => removeIngredientField(idx)} className="text-sage-400 hover:text-red-500 p-2">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-sage-700">{t.instructions}</label>
                <button onClick={addInstructionField} className="text-xs text-sage-600 hover:text-sage-800 font-medium flex items-center">
                  <Plus className="h-3 w-3 mr-1" /> {t.addStep}
                </button>
              </div>
              <div className="space-y-2">
                {instructions.map((step, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="flex-shrink-0 w-6 h-9 flex items-center justify-center text-sm font-bold text-sage-400">{idx + 1}.</span>
                    <textarea 
                      className="flex-1 px-3 py-2 border border-sage-200 rounded-lg text-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500 bg-white text-sage-900"
                      rows={2}
                      placeholder={`Step ${idx + 1}`}
                      value={step}
                      onChange={e => updateInstruction(idx, e.target.value)}
                    />
                    {instructions.length > 1 && (
                      <button onClick={() => removeInstructionField(idx)} className="text-sage-400 hover:text-red-500 p-2 self-start mt-2">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
          <div className="border-t border-sage-100 p-6 bg-sage-50/50 flex justify-end">
             <Button variant="secondary" onClick={() => setView('list')} className="mr-3">{t.cancel}</Button>
             <Button onClick={handleSubmit} disabled={!name}>{t.saveRecipe}</Button>
          </div>
        </div>
      )}
    </div>
  );
};