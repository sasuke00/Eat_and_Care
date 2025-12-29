import React, { useState, useEffect } from 'react';
import { Search, ThumbsUp, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { Button } from './Button';
import { CompatibilityResult } from '../types';
import { useLanguage } from '../LanguageContext';

interface CompatibilityCheckProps {
  data: {
    query: string;
    result: CompatibilityResult | null;
    loading: boolean;
    error: string | null;
  };
  onSearch: (query: string) => void;
}

export const CompatibilityCheck: React.FC<CompatibilityCheckProps> = ({ data, onSearch }) => {
  const { t } = useLanguage();
  // Local input state to allow typing without triggering parent search immediately
  const [localQuery, setLocalQuery] = useState(data.query);

  // Sync local query if parent query changes (e.g. initial load)
  useEffect(() => {
    setLocalQuery(data.query);
  }, [data.query]);

  const handleSearchClick = () => {
    onSearch(localQuery);
  };

  // Sort logic for harmful interactions: High -> Medium -> Low
  const sortedHarmful = data.result ? [...data.result.harmful].sort((a, b) => {
    const severityScore = { high: 3, medium: 2, low: 1 };
    // @ts-ignore - in case API returns mixed case or undefined, fallback safely handled by optional chaining in usage
    const scoreA = severityScore[a.severity] || 0;
    // @ts-ignore
    const scoreB = severityScore[b.severity] || 0;
    return scoreB - scoreA;
  }) : [];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-sage-900 mb-4 flex justify-center items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-sage-600" />
          {t.safetyTitle}
        </h2>
        <p className="text-sage-500 max-w-lg mx-auto">
          {t.safetySubtitle}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-sage-100 p-8 mb-8">
        <div className="flex gap-4">
          <div className="relative flex-1">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-sage-300" />
              </div>
            <input
              type="text"
              className="block w-full pl-10 pr-4 py-4 border border-sage-700 rounded-lg text-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-500 bg-sage-800 text-white placeholder-sage-400"
              placeholder={t.enterFoodPlaceholder}
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
            />
          </div>
          <Button 
            size="lg" 
            onClick={handleSearchClick} 
            isLoading={data.loading}
            className="px-8"
            disabled={!localQuery.trim()}
          >
            {t.analyze}
          </Button>
        </div>
        {data.error && (
          <div className="mt-4 text-red-600 bg-red-50 p-3 rounded-lg text-sm flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {data.error}
          </div>
        )}
      </div>

      {data.result && (
        <div className="space-y-6 animate-fade-in">
          {/* Text Only Header */}
          <div className="bg-white p-6 rounded-xl border border-sage-100 shadow-sm">
            <div className="flex items-center justify-between border-b border-sage-200 pb-4 mb-2">
              <h3 className="text-2xl font-bold text-sage-900 capitalize">
                Analysis: {data.result.food}
              </h3>
              <span className="text-xs font-semibold text-sage-500 bg-sage-50 px-3 py-1 rounded-full uppercase tracking-wider">
                {t.analysisReport}
              </span>
            </div>
            <p className="text-sage-500 text-sm">
              Clinical assessment of biochemical interactions, synergies, and contraindications for {data.result.food}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Beneficial Column */}
            <div className="bg-sage-50/50 rounded-xl border border-sage-100 p-6">
              <div className="flex items-center mb-6">
                <div className="bg-sage-100 p-2 rounded-lg mr-3">
                  <ThumbsUp className="h-5 w-5 text-sage-700" />
                </div>
                <h4 className="text-lg font-semibold text-sage-800">{t.synergisticPairings}</h4>
              </div>
              
              <div className="space-y-4">
                {data.result.beneficial.map((item, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-sage-100 flex gap-4 items-start transition-transform hover:translate-y-[-2px]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sage-900 truncate pr-2">{item.pair}</span>
                        <Activity className="h-3 w-3 text-sage-400 flex-shrink-0" />
                      </div>
                      <p className="text-xs text-sage-600 leading-relaxed">
                        {item.reason}
                      </p>
                    </div>
                  </div>
                ))}
                {data.result.beneficial.length === 0 && (
                   <p className="text-sm text-sage-500 italic">{t.noSynergies}</p>
                )}
              </div>
            </div>

            {/* Harmful Column - Sorted by Risk */}
            <div className="bg-red-50/30 rounded-xl border border-red-100 p-6">
              <div className="flex items-center mb-6">
                <div className="bg-red-100 p-2 rounded-lg mr-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <h4 className="text-lg font-semibold text-red-900">{t.contraindicationsRisk}</h4>
              </div>

              <div className="space-y-4">
                {sortedHarmful.map((item, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-red-100 flex gap-4 items-start transition-transform hover:translate-y-[-2px]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-900 truncate pr-2">{item.pair}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex-shrink-0 ${
                          item.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {item.severity}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {item.reason}
                      </p>
                    </div>
                  </div>
                ))}
                 {sortedHarmful.length === 0 && (
                   <p className="text-sm text-sage-500 italic">{t.noConflicts}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};