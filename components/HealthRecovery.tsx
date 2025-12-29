import React, { useState, useEffect } from 'react';
import { Search, HeartPulse, AlertCircle, CheckCircle2, Thermometer, Droplets, Info, Utensils, XCircle, AlertTriangle, Check } from 'lucide-react';
import { Button } from './Button';
import { HealthRecommendation, FoodConditionAnalysis } from '../types';
import { checkFoodSafetyForCondition } from '../services/geminiService';
import { useLanguage } from '../LanguageContext';

interface HealthRecoveryProps {
  data: {
    query: string;
    result: HealthRecommendation | null;
    loading: boolean;
    error: string | null;
  };
  onSearch: (query: string) => void;
}

export const HealthRecovery: React.FC<HealthRecoveryProps> = ({ data, onSearch }) => {
  const { language, t } = useLanguage();
  const [localQuery, setLocalQuery] = useState(data.query);
  
  // State for specific food checker
  const [checkFood, setCheckFood] = useState('');
  const [isCheckingFood, setIsCheckingFood] = useState(false);
  const [foodCheckResult, setFoodCheckResult] = useState<FoodConditionAnalysis | null>(null);

  useEffect(() => {
    setLocalQuery(data.query);
    // Reset food check when main condition changes
    setFoodCheckResult(null);
    setCheckFood('');
  }, [data.query, data.result]);

  // Refresh food check when language changes
  useEffect(() => {
    if (foodCheckResult && checkFood) {
        handleSpecificFoodCheck();
    }
  }, [language]);

  const commonConditions = [
    { name: t.flu, icon: <Thermometer className="w-3 h-3" /> },
    { name: t.soreThroat, icon: <ActivityIcon className="w-3 h-3" /> },
    { name: t.fever, icon: <Thermometer className="w-3 h-3" /> },
    { name: t.menstruation, icon: <Droplets className="w-3 h-3" /> },
    { name: t.cough, icon: <ActivityIcon className="w-3 h-3" /> }
  ];

  const handleSearchClick = (term: string) => {
    // Update local query if clicked from tags
    setLocalQuery(term);
    onSearch(term);
  };

  const handleSpecificFoodCheck = async () => {
    if (!checkFood.trim() || !data.result) return;
    
    setIsCheckingFood(true);
    setFoodCheckResult(null);
    try {
      const result = await checkFoodSafetyForCondition(data.result.condition, checkFood, language);
      setFoodCheckResult(result);
    } catch (e) {
      console.error("Failed to check specific food", e);
    } finally {
      setIsCheckingFood(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Recommended': return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'Safe': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'Caution': return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'Avoid': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Recommended': return <CheckCircle2 className="w-6 h-6 text-emerald-600" />;
      case 'Safe': return <Check className="w-6 h-6 text-blue-600" />;
      case 'Caution': return <AlertTriangle className="w-6 h-6 text-amber-600" />;
      case 'Avoid': return <XCircle className="w-6 h-6 text-red-600" />;
      default: return <Info className="w-6 h-6 text-gray-600" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-sage-900 mb-4 flex justify-center items-center gap-3">
          <HeartPulse className="h-8 w-8 text-sage-600" />
          {t.recoveryTitle}
        </h2>
        <p className="text-sage-500 max-w-lg mx-auto">
          {t.recoverySubtitle}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-sage-100 p-8 mb-8">
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-sage-300" />
              </div>
            <input
              type="text"
              className="block w-full pl-10 pr-4 py-4 border border-sage-700 rounded-lg text-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-500 bg-sage-800 text-white placeholder-sage-400"
              placeholder={t.enterConditionPlaceholder}
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchClick(localQuery)}
            />
          </div>
          <Button 
            size="lg" 
            onClick={() => handleSearchClick(localQuery)} 
            isLoading={data.loading}
            className="px-8"
            disabled={!localQuery.trim()}
          >
            {t.getProtocol}
          </Button>
        </div>
        
        {/* Quick Tags */}
        <div className="flex flex-wrap gap-2 justify-center">
          <span className="text-xs text-sage-400 uppercase tracking-wider font-semibold self-center mr-2">{t.quickAccess}</span>
          {commonConditions.map((c) => (
            <button
              key={c.name}
              onClick={() => handleSearchClick(c.name)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-sage-50 text-sage-700 border border-sage-200 hover:bg-sage-100 hover:border-sage-300 transition-all"
            >
              {c.icon}
              {c.name}
            </button>
          ))}
        </div>

        {data.error && (
          <div className="mt-4 text-red-600 bg-red-50 p-3 rounded-lg text-sm flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {data.error}
          </div>
        )}
      </div>

      {data.result && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-sage-200 pb-4">
            <h3 className="text-2xl font-bold text-sage-900 capitalize">
              {t.protocol}: {data.result.condition}
            </h3>
            <span className="text-xs font-semibold text-sage-500 bg-sage-50 px-3 py-1 rounded-full uppercase tracking-wider">
              {t.clinicalAdvice}
            </span>
          </div>

          {/* Specific Food Checker (Moved Here) */}
          <div className="bg-white rounded-xl shadow-sm border border-sage-200 overflow-hidden">
            <div className="p-6 bg-sage-50/50 border-b border-sage-100">
              <div className="flex items-center mb-2">
                <Utensils className="h-5 w-5 text-sage-600 mr-2" />
                <h4 className="text-lg font-bold text-sage-900">{t.canIEatThis}</h4>
              </div>
              <p className="text-sm text-sage-500 mb-4">
                {t.checkIfSafe} <strong>{data.result.condition}</strong>.
              </p>
              
              <div className="flex gap-3">
                <input
                  type="text"
                  className="block w-full px-4 py-2 border border-sage-300 rounded-lg text-sm focus:ring-2 focus:ring-sage-500 focus:border-sage-500 bg-white placeholder-sage-400"
                  placeholder={t.checkFoodPlaceholder}
                  value={checkFood}
                  onChange={(e) => setCheckFood(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSpecificFoodCheck()}
                />
                <Button onClick={handleSpecificFoodCheck} isLoading={isCheckingFood} disabled={!checkFood.trim()}>
                  {t.check}
                </Button>
              </div>
            </div>

            {foodCheckResult && (
              <div className={`p-6 border-l-4 animate-fade-in ${getStatusColor(foodCheckResult.status)}`}>
                 <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(foodCheckResult.status)}
                    </div>
                    <div>
                      <h5 className="font-bold text-lg flex items-center gap-2">
                        {foodCheckResult.food}
                        <span className="text-xs uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/50 border border-black/5">
                          {foodCheckResult.status}
                        </span>
                      </h5>
                      <p className="mt-1 text-sm font-medium leading-relaxed opacity-90">
                        {foodCheckResult.reason}
                      </p>
                    </div>
                 </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Eat Column */}
            <div className="bg-sage-50/50 rounded-xl border border-sage-100 p-6">
              <div className="flex items-center mb-6">
                <div className="bg-sage-100 p-2 rounded-lg mr-3">
                  <CheckCircle2 className="h-5 w-5 text-sage-700" />
                </div>
                <h4 className="text-lg font-semibold text-sage-800">{t.beneficialEat}</h4>
              </div>
              
              <div className="space-y-4">
                {data.result.eat.map((item, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-sage-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sage-900">{item.food}</span>
                    </div>
                    <p className="text-sm text-sage-600 leading-relaxed">
                      {item.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Avoid Column */}
            <div className="bg-amber-50/30 rounded-xl border border-amber-100 p-6">
              <div className="flex items-center mb-6">
                <div className="bg-amber-100 p-2 rounded-lg mr-3">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <h4 className="text-lg font-semibold text-amber-900">{t.contraindicatedAvoid}</h4>
              </div>

              <div className="space-y-4">
                {data.result.avoid.map((item, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-amber-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-900">{item.food}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {item.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Lifestyle Tips */}
          <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-6">
             <div className="flex items-center mb-4">
                <Info className="h-5 w-5 text-blue-600 mr-2" />
                <h4 className="text-lg font-semibold text-blue-900">{t.lifestyleTips}</h4>
             </div>
             <ul className="space-y-2">
               {data.result.lifestyleTips.map((tip, idx) => (
                 <li key={idx} className="flex items-start text-sm text-blue-800">
                   <span className="mr-2 text-blue-400">•</span>
                   {tip}
                 </li>
               ))}
             </ul>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper icon component for tag list
const ActivityIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
);