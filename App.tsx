import React, { useState, useEffect } from 'react';
import { ChefHat, AlertTriangle, ArrowRight, BookOpen, Package, Utensils, ShieldCheck, HeartPulse, Book, PlusCircle, Globe, Heart } from 'lucide-react';
import { Pantry } from './components/Pantry';
import { UserProfile } from './components/UserProfile';
import { RecipeDetail } from './components/RecipeDetail';
import { Button } from './components/Button';
import { CompatibilityCheck } from './components/CompatibilityCheck';
import { HealthRecovery } from './components/HealthRecovery';
import { MyRecipes } from './components/MyRecipes';
import { generateSmartRecipes, analyzeFoodCompatibility, getHealthRecoveryAdvice, identifyIngredientsFromImage } from './services/geminiService';
import { Recipe, UserProfile as UserProfileType, CompatibilityResult, HealthRecommendation } from './types';
import { useLanguage } from './LanguageContext';

const STORAGE_KEYS = {
  PANTRY: 'nutrisage_pantry_v1',
  PROFILE: 'nutrisage_profile_v1',
  USER_RECIPES: 'nutrisage_my_recipes_v1'
};

const App: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  // Initialize state from localStorage if available
  const [pantryItems, setPantryItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PANTRY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load pantry", e);
      return [];
    }
  });

  const [profile, setProfile] = useState<UserProfileType>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return saved ? JSON.parse(saved) : { allergies: [], dislikes: [] };
    } catch (e) {
      console.error("Failed to load profile", e);
      return { allergies: [], dislikes: [] };
    }
  });

  const [userRecipes, setUserRecipes] = useState<Recipe[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_RECIPES);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load user recipes", e);
      return [];
    }
  });

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- PERSISTENT STATE FOR SAFETY ENGINE ---
  const [safetyState, setSafetyState] = useState<{
    query: string;
    result: CompatibilityResult | null;
    loading: boolean;
    error: string | null;
  }>({
    query: '',
    result: null,
    loading: false,
    error: null
  });

  // --- PERSISTENT STATE FOR HEALTH RECOVERY ---
  const [recoveryState, setRecoveryState] = useState<{
    query: string;
    result: HealthRecommendation | null;
    loading: boolean;
    error: string | null;
  }>({
    query: '',
    result: null,
    loading: false,
    error: null
  });

  // Navigation State
  const [currentView, setCurrentView] = useState<'kitchen' | 'safety' | 'recovery' | 'my-recipes'>('kitchen');
  const [mobileTab, setMobileTab] = useState<'store' | 'recipes'>('store');

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PANTRY, JSON.stringify(pantryItems));
  }, [pantryItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER_RECIPES, JSON.stringify(userRecipes));
  }, [userRecipes]);

  // Language Refresh Effect
  useEffect(() => {
    const refreshData = async () => {
        // Refresh recipes if they exist
        if (recipes.length > 0 && !isGenerating) {
            handleGenerate(false);
        }
        // Refresh safety check
        if (safetyState.result && safetyState.query && !safetyState.loading) {
            handleSafetySearch(safetyState.query);
        }
        // Refresh recovery protocol
        if (recoveryState.result && recoveryState.query && !recoveryState.loading) {
            handleRecoverySearch(recoveryState.query);
        }
    };
    refreshData();
  }, [language]);

  const handleAddItem = (item: string) => {
    if (!pantryItems.includes(item)) {
      setPantryItems([...pantryItems, item]);
    }
  };

  const handleRemoveItem = (item: string) => {
    setPantryItems(pantryItems.filter(i => i !== item));
  };

  const handleScan = async (file: File) => {
    setError(null);
    try {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
         setError(t.errorImageTooLarge);
         return;
      }

      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const base64Image = await base64Promise;

      const detectedIngredients = await identifyIngredientsFromImage(base64Image);
      
      if (detectedIngredients && detectedIngredients.length > 0) {
        // Add only unique new items
        const newItems = detectedIngredients.filter(item => !pantryItems.includes(item));
        if (newItems.length > 0) {
          setPantryItems(prev => [...prev, ...newItems]);
        }
      } else {
        setError("Could not identify any ingredients in the image.");
      }
    } catch (e) {
      console.error("Scan error", e);
      setError("Failed to analyze image. Please try again.");
    }
  };

  const handleGenerate = async (switchView: boolean = true) => {
    setIsGenerating(true);
    setError(null);
    if (switchView) {
      setCurrentView('kitchen');
      setMobileTab('recipes'); 
    }
    
    try {
      // Pass empty array for excluded recipes on fresh generation
      const results = await generateSmartRecipes(pantryItems, profile, [], language);
      setRecipes(results);
    } catch (e) {
      setError("Unable to generate recipes. Please ensure API Key is configured and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    try {
      const existingNames = recipes.map(r => r.name);
      const newRecipes = await generateSmartRecipes(pantryItems, profile, existingNames, language);
      setRecipes(prev => [...prev, ...newRecipes]);
    } catch (e) {
      // Silently fail or show toast for load more
      console.error("Failed to load more recipes", e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Safety Engine Handler
  const handleSafetySearch = async (query: string) => {
    if (!query.trim()) return;
    setSafetyState(prev => ({ ...prev, query, loading: true, error: null, result: null }));
    
    try {
      const data = await analyzeFoodCompatibility(query, language);
      if (data) {
        setSafetyState(prev => ({ ...prev, result: data, loading: false }));
      } else {
        setSafetyState(prev => ({ ...prev, error: "Could not analyze food data.", loading: false }));
      }
    } catch (err) {
      setSafetyState(prev => ({ ...prev, error: "An error occurred connecting to the engine.", loading: false }));
    }
  };

  // Health Recovery Handler
  const handleRecoverySearch = async (query: string) => {
    if (!query.trim()) return;
    setRecoveryState(prev => ({ ...prev, query, loading: true, error: null, result: null }));

    try {
      const data = await getHealthRecoveryAdvice(query, language);
      if (data) {
        setRecoveryState(prev => ({ ...prev, result: data, loading: false }));
      } else {
        setRecoveryState(prev => ({ ...prev, error: "Could not generate advice.", loading: false }));
      }
    } catch (err) {
      setRecoveryState(prev => ({ ...prev, error: "An error occurred connecting to the engine.", loading: false }));
    }
  };

  const handleSaveUserRecipe = (recipe: Recipe) => {
    setUserRecipes([...userRecipes, recipe]);
  };

  const handleDeleteUserRecipe = (id: string) => {
    if (window.confirm("Are you sure you want to delete this recipe?")) {
      setUserRecipes(userRecipes.filter(r => r.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-offwhite pb-20">
      {/* Navigation */}
      <nav className="bg-white border-b border-sage-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => { setCurrentView('kitchen'); setMobileTab('store'); }}>
              <div className="flex-shrink-0 flex items-center">
                <div className="h-8 w-8 bg-sage-600 rounded-lg flex items-center justify-center text-white mr-3 relative overflow-hidden">
                   <Utensils size={14} className="absolute top-1.5 left-1.5" />
                   <Heart size={14} className="absolute bottom-1.5 right-1.5 fill-current" />
                </div>
                <h1 className="text-xl font-bold text-sage-900 tracking-tight">{t.appTitle}</h1>
              </div>
            </div>
            
            {/* Desktop Navigation Links */}
            <div className="hidden sm:flex items-center space-x-8">
              <button 
                onClick={() => setCurrentView('kitchen')}
                className={`text-sm font-medium transition-colors ${currentView === 'kitchen' ? 'text-sage-900 border-b-2 border-sage-600' : 'text-sage-500 hover:text-sage-700'}`}
              >
                {t.navKitchen}
              </button>
              <button 
                onClick={() => setCurrentView('my-recipes')}
                className={`text-sm font-medium transition-colors ${currentView === 'my-recipes' ? 'text-sage-900 border-b-2 border-sage-600' : 'text-sage-500 hover:text-sage-700'}`}
              >
                {t.navCookbook}
              </button>
              <button 
                onClick={() => setCurrentView('safety')}
                className={`text-sm font-medium transition-colors ${currentView === 'safety' ? 'text-sage-900 border-b-2 border-sage-600' : 'text-sage-500 hover:text-sage-700'}`}
              >
                {t.navSafety}
              </button>
              <button 
                onClick={() => setCurrentView('recovery')}
                className={`text-sm font-medium transition-colors ${currentView === 'recovery' ? 'text-sage-900 border-b-2 border-sage-600' : 'text-sage-500 hover:text-sage-700'}`}
              >
                {t.navRecovery}
              </button>
            </div>

            <div className="flex items-center space-x-4">
              {/* Language Switcher */}
              <button 
                onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                className="flex items-center space-x-1 text-sage-600 hover:text-sage-800 transition-colors px-2 py-1 rounded-md hover:bg-sage-50"
              >
                <Globe size={18} />
                <span className="text-sm font-medium">{language === 'en' ? 'EN' : '中文'}</span>
              </button>

              <div className="hidden sm:block text-xs text-sage-500 bg-sage-50 px-3 py-1 rounded-full border border-sage-100">
                {t.clinicalMode}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 text-red-700 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-3" />
            {error}
          </div>
        )}

        {/* Mobile Tab Navigation */}
        <div className="lg:hidden flex border-b border-sage-200 mb-6 sticky top-16 bg-offwhite z-20 overflow-x-auto no-scrollbar">
          <button 
            className={`flex-1 py-3 px-3 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 min-w-[80px] whitespace-nowrap ${currentView === 'kitchen' && mobileTab === 'store' ? 'text-sage-700 border-b-2 border-sage-600' : 'text-sage-400'}`}
            onClick={() => { setCurrentView('kitchen'); setMobileTab('store'); }}
          >
            <Package size={16} />
            {t.store}
          </button>
          <button 
            className={`flex-1 py-3 px-3 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 min-w-[80px] whitespace-nowrap ${currentView === 'kitchen' && mobileTab === 'recipes' ? 'text-sage-700 border-b-2 border-sage-600' : 'text-sage-400'}`}
            onClick={() => { setCurrentView('kitchen'); setMobileTab('recipes'); }}
          >
            <Utensils size={16} />
            {t.aiRecipes}
            {recipes.length > 0 && <span className="ml-0.5 bg-sage-100 text-sage-700 text-[10px] px-1.5 rounded-full">{recipes.length}</span>}
          </button>
          <button 
            className={`flex-1 py-3 px-3 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 min-w-[80px] whitespace-nowrap ${currentView === 'my-recipes' ? 'text-sage-700 border-b-2 border-sage-600' : 'text-sage-400'}`}
            onClick={() => setCurrentView('my-recipes')}
          >
            <Book size={16} />
            {t.myBook}
          </button>
          <button 
            className={`flex-1 py-3 px-3 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 min-w-[80px] whitespace-nowrap ${currentView === 'safety' ? 'text-sage-700 border-b-2 border-sage-600' : 'text-sage-400'}`}
            onClick={() => setCurrentView('safety')}
          >
            <ShieldCheck size={16} />
            {t.safety}
          </button>
           <button 
            className={`flex-1 py-3 px-3 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 min-w-[80px] whitespace-nowrap ${currentView === 'recovery' ? 'text-sage-700 border-b-2 border-sage-600' : 'text-sage-400'}`}
            onClick={() => setCurrentView('recovery')}
          >
            <HeartPulse size={16} />
            {t.recovery}
          </button>
        </div>

        {/* View: User Cookbook */}
        {currentView === 'my-recipes' && (
          <MyRecipes 
            recipes={userRecipes} 
            onSave={handleSaveUserRecipe}
            onDelete={handleDeleteUserRecipe}
            onView={setSelectedRecipe}
          />
        )}

        {/* View: Recovery Engine (Persisted) */}
        {currentView === 'recovery' && (
          <HealthRecovery 
            data={recoveryState}
            onSearch={handleRecoverySearch}
          />
        )}

        {/* View: Safety Engine (Persisted) */}
        {currentView === 'safety' && (
          <CompatibilityCheck 
            data={safetyState}
            onSearch={handleSafetySearch}
          />
        )}

        {/* View: Kitchen (Split Grid) */}
        {currentView === 'kitchen' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Sidebar: Controls (Store Tab on Mobile) */}
            <div className={`lg:col-span-4 space-y-6 ${mobileTab === 'store' ? 'block' : 'hidden lg:block'}`}>
              <Pantry 
                items={pantryItems}
                onAddItem={handleAddItem}
                onRemoveItem={handleRemoveItem}
                onGenerate={() => handleGenerate(true)}
                onScan={handleScan}
                isGenerating={isGenerating}
              />
              <UserProfile 
                profile={profile}
                onChange={setProfile}
              />
              
              {/* Educational Info Card */}
              <div className="bg-sage-700 rounded-xl p-6 text-white shadow-lg overflow-hidden relative">
                <div className="relative z-10">
                  <h3 className="font-bold text-lg mb-2 flex items-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    {t.foodCompatibility}
                  </h3>
                  <p className="text-sage-100 text-sm leading-relaxed mb-4">
                    {t.didYouKnow}
                  </p>
                  <Button variant="outline" size="sm" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={() => setCurrentView('safety')}>
                    {t.checkSafety}
                  </Button>
                </div>
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-sage-500 rounded-full opacity-20"></div>
                <div className="absolute top-10 -left-10 w-24 h-24 bg-sage-400 rounded-full opacity-20"></div>
              </div>
            </div>

            {/* Right Area: Results (Recipes Tab on Mobile) */}
            <div className={`lg:col-span-8 ${mobileTab === 'recipes' ? 'block' : 'hidden lg:block'}`}>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-sage-900">
                  {recipes.length > 0 ? t.recommendedRecipes : t.awaitingAnalysis}
                </h2>
                {recipes.length > 0 && (
                  <span className="text-sm text-sage-500">{recipes.length} {t.resultsFound}</span>
                )}
              </div>

              {recipes.length === 0 && !isGenerating && (
                <div className="bg-white rounded-xl border border-dashed border-sage-200 p-12 text-center">
                  <div className="mx-auto h-16 w-16 bg-sage-50 rounded-full flex items-center justify-center mb-4">
                    <ChefHat className="h-8 w-8 text-sage-400" />
                  </div>
                  <h3 className="text-lg font-medium text-sage-900">{t.startJourney}</h3>
                  <p className="mt-2 text-sage-500 max-w-sm mx-auto">
                    {t.startJourneyDesc}
                  </p>
                  <div className="mt-6 lg:hidden">
                      <Button variant="outline" onClick={() => setMobileTab('store')}>{t.goToStore}</Button>
                  </div>
                </div>
              )}

              {isGenerating && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden h-80 animate-pulse border border-sage-100">
                      <div className="h-40 bg-sage-100"></div>
                      <div className="p-6 space-y-3">
                        <div className="h-6 bg-sage-100 rounded w-3/4"></div>
                        <div className="h-4 bg-sage-50 rounded w-1/2"></div>
                        <div className="h-20 bg-sage-50 rounded w-full mt-4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recipes.map((recipe) => (
                  <div 
                    key={recipe.id} 
                    className="group bg-white rounded-xl shadow-sm border border-sage-100 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={recipe.image || `https://image.pollinations.ai/prompt/${encodeURIComponent(recipe.name)}?nologo=true`} 
                        alt={recipe.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        <span className="bg-white/90 backdrop-blur-sm text-sage-800 text-xs font-bold px-2 py-1 rounded shadow-sm">
                          {recipe.macros.calories} kcal
                        </span>
                      </div>
                      {recipe.safetyCheck.hasConflict && (
                        <div className="absolute bottom-3 left-3">
                          <span className="bg-amber-100/90 backdrop-blur-sm text-amber-800 text-xs font-bold px-2 py-1 rounded shadow-sm flex items-center border border-amber-200">
                            <AlertTriangle className="h-3 w-3 mr-1" /> Compatibility Warning
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-sage-900 leading-tight group-hover:text-sage-700 transition-colors">
                          {recipe.name}
                        </h3>
                        <div className="ml-2 flex-shrink-0">
                          <div className="radial-progress text-xs font-bold text-sage-600 border-2 border-sage-200 rounded-full w-8 h-8 flex items-center justify-center">
                              {recipe.matchScore}
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-sage-500 line-clamp-2 mb-4">
                        {recipe.description}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-6">
                        {recipe.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[10px] uppercase tracking-wider font-semibold text-sage-600 bg-sage-50 px-2 py-1 rounded-sm border border-sage-100">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="mt-auto">
                        <Button 
                          variant="primary" 
                          className="w-full group-hover:bg-sage-800"
                          onClick={() => setSelectedRecipe(recipe)}
                        >
                          {t.viewAnalysis} <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {recipes.length > 0 && (
                <div className="mt-10 flex justify-center">
                   <Button 
                    variant="secondary" 
                    size="lg" 
                    onClick={handleLoadMore} 
                    isLoading={isLoadingMore}
                    className="shadow-sm border border-sage-200"
                  >
                     <PlusCircle className="h-5 w-5 mr-2" /> {t.loadMore}
                   </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal View */}
      {selectedRecipe && (
        <RecipeDetail 
          recipe={selectedRecipe} 
          onClose={() => setSelectedRecipe(null)} 
        />
      )}
    </div>
  );
};

export default App;