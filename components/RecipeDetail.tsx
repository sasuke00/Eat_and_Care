import React from 'react';
import { X, AlertTriangle, CheckCircle, Info, Activity, User, Utensils } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Recipe } from '../types';
import { useLanguage } from '../LanguageContext';

interface RecipeDetailProps {
  recipe: Recipe;
  onClose: () => void;
}

export const RecipeDetail: React.FC<RecipeDetailProps> = ({ recipe, onClose }) => {
  const { t } = useLanguage();
  const data = [
    { name: 'Protein', value: recipe.macros.protein, color: '#3f6a50' }, // sage-600
    { name: 'Fats', value: recipe.macros.fats, color: '#ca8a04' },    // yellow-600
    { name: 'Carbs', value: recipe.macros.carbs, color: '#94a3b8' },  // slate-400
  ];

  const hasClinicalData = !recipe.isUserCreated || (recipe.macros.calories > 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-sage-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-4xl border border-sage-100">
          
          {/* Header Image Area */}
          <div className="relative h-64 bg-sage-100 group">
            <img 
              src={recipe.image || `https://image.pollinations.ai/prompt/${encodeURIComponent(recipe.name)}?nologo=true`} 
              alt={recipe.name} 
              className="h-full w-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 to-transparent"></div>
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 backdrop-blur-md transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="absolute bottom-0 left-0 p-8 text-white w-full">
               <div className="flex items-center gap-2 mb-2">
                 {recipe.isUserCreated ? (
                    <span className="px-2 py-1 bg-sage-500/80 backdrop-blur-md rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                      <User className="h-3 w-3" /> {t.myRecipe}
                    </span>
                 ) : (
                   <span className="px-2 py-1 bg-sage-500/80 backdrop-blur-md rounded-md text-xs font-semibold uppercase tracking-wider">
                     {recipe.matchScore}% {t.match}
                   </span>
                 )}
                 {recipe.servings && (
                    <span className="px-2 py-1 bg-white/20 backdrop-blur-md rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                      <Utensils className="h-3 w-3" /> {recipe.servings}
                    </span>
                 )}
                 {recipe.safetyCheck.hasConflict && (
                   <span className="px-2 py-1 bg-amber-500/80 backdrop-blur-md rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                     <AlertTriangle className="h-3 w-3" /> {t.caution}
                   </span>
                 )}
               </div>
              <h2 className="text-3xl font-bold leading-tight">{recipe.name}</h2>
              <p className="mt-2 text-sage-100 max-w-2xl">{recipe.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3">
            {/* Left Column: Ingredients & Instructions */}
            <div className="col-span-2 p-8 space-y-8 border-r border-sage-100">
              
              {/* Safety Check - Clinical Feature */}
              {hasClinicalData ? (
                recipe.safetyCheck.hasConflict ? (
                  <div className={`rounded-xl border p-4 ${recipe.safetyCheck.severity === 'high' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                    <div className="flex items-start">
                      <AlertTriangle className={`h-5 w-5 mt-0.5 ${recipe.safetyCheck.severity === 'high' ? 'text-red-600' : 'text-amber-600'}`} />
                      <div className="ml-3">
                        <h3 className={`text-sm font-semibold ${recipe.safetyCheck.severity === 'high' ? 'text-red-800' : 'text-amber-800'}`}>
                          {t.clinicalInteraction}: {recipe.safetyCheck.reason}
                        </h3>
                        <p className={`mt-1 text-sm ${recipe.safetyCheck.severity === 'high' ? 'text-red-700' : 'text-amber-700'}`}>
                          {recipe.safetyCheck.scientificExplanation}
                        </p>
                        <div className="mt-2 text-xs font-medium uppercase tracking-wide opacity-75">
                           Between: {recipe.safetyCheck.conflictingIngredients.join(" & ")}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-sage-50 border border-sage-100 p-4 flex items-center text-sage-700">
                    <CheckCircle className="h-5 w-5 text-sage-500 mr-3" />
                    <div>
                      <h3 className="text-sm font-semibold">{t.bioCompatible}</h3>
                      <p className="text-xs text-sage-500">{t.noKnownConflicts}</p>
                    </div>
                  </div>
                )
              ) : (
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 flex items-center text-gray-500">
                  <Info className="h-5 w-5 mr-3" />
                  <p className="text-sm">Clinical safety analysis not available for manual recipes.</p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-sage-900 mb-4 flex items-center">
                  {t.ingredients}
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {recipe.ingredients.map((ing, idx) => (
                    <li key={idx} className="flex items-center text-sm text-sage-700">
                      <div className="h-1.5 w-1.5 rounded-full bg-sage-400 mr-2"></div>
                      {ing}
                    </li>
                  ))}
                  {recipe.missingIngredients && recipe.missingIngredients.map((ing, idx) => (
                     <li key={`missing-${idx}`} className="flex items-center text-sm text-amber-700 opacity-75">
                     <div className="h-1.5 w-1.5 rounded-full bg-amber-400 mr-2"></div>
                     {ing} ({t.missing})
                   </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-sage-900 mb-4">{t.instructions}</h3>
                <ol className="space-y-4">
                  {recipe.instructions.map((step, idx) => (
                    <li key={idx} className="flex">
                      <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-sage-100 text-sage-600 text-xs font-bold mr-3 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-sage-700 leading-relaxed text-sm">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Right Column: Nutrition Intelligence */}
            <div className="col-span-1 bg-offwhite p-8">
              <h3 className="text-lg font-bold text-sage-900 mb-6 flex items-center">
                <Activity className="h-5 w-5 text-sage-500 mr-2" />
                {t.nutritionProfile}
              </h3>
              
              {hasClinicalData ? (
                <>
                  <div className="mb-8">
                    <div className="text-3xl font-bold text-sage-900">{recipe.macros.calories}</div>
                    <div className="text-sm text-sage-500 uppercase tracking-wider font-medium">{t.calories}</div>
                  </div>

                  <div className="h-64 w-full mb-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          itemStyle={{ color: '#2c2c2c', fontSize: '12px' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-sage-900 uppercase tracking-wide border-b border-sage-200 pb-2">
                      {t.micronutrients}
                    </h4>
                    {recipe.micros.map((micro, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="text-sage-600">{micro.name}</span>
                        <div className="text-right">
                          <span className="block font-medium text-sage-900">{micro.amount}</span>
                          <span className="block text-xs text-sage-400">{micro.dv}% DV</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 p-4 bg-white rounded-xl shadow-sm border border-sage-100">
                    <div className="flex items-start">
                      <Info className="h-4 w-4 text-sage-400 mt-0.5 mr-2" />
                      <p className="text-xs text-sage-500 leading-tight">
                        {t.nutritionalValuesEstimate}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                 <div className="text-center py-10">
                   <div className="mx-auto h-12 w-12 bg-sage-100 rounded-full flex items-center justify-center mb-4">
                     <Activity className="h-6 w-6 text-sage-400" />
                   </div>
                   <h4 className="text-sage-900 font-medium">{t.noAnalysisData}</h4>
                   <p className="text-sm text-sage-500 mt-2">
                     {t.noAnalysisDataDesc}
                   </p>
                 </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};