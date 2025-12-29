import React, { useState } from 'react';
import { Shield, ThumbsDown, X, ChevronDown, ChevronUp, UserCircle } from 'lucide-react';
import { Button } from './Button';
import { UserProfile as UserProfileType } from '../types';
import { useLanguage } from '../LanguageContext';

interface UserProfileProps {
  profile: UserProfileType;
  onChange: (profile: UserProfileType) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ profile, onChange }) => {
  const { t } = useLanguage();
  const [allergyInput, setAllergyInput] = useState('');
  const [dislikeInput, setDislikeInput] = useState('');
  
  // Collapsible states
  const [isAllergiesOpen, setIsAllergiesOpen] = useState(true);
  const [isDislikesOpen, setIsDislikesOpen] = useState(false);

  const addAllergy = () => {
    if (allergyInput.trim()) {
      onChange({
        ...profile,
        allergies: [...profile.allergies, allergyInput.trim()]
      });
      setAllergyInput('');
    }
  };

  const addDislike = () => {
    if (dislikeInput.trim()) {
      onChange({
        ...profile,
        dislikes: [...profile.dislikes, dislikeInput.trim()]
      });
      setDislikeInput('');
    }
  };

  const removeAllergy = (item: string) => {
    onChange({
      ...profile,
      allergies: profile.allergies.filter(a => a !== item)
    });
  };

  const removeDislike = (item: string) => {
    onChange({
      ...profile,
      dislikes: profile.dislikes.filter(d => d !== item)
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-sage-100 overflow-hidden">
      <div className="p-5 bg-sage-50/50 border-b border-sage-100 flex items-center gap-3">
        <div className="bg-white p-2 rounded-full border border-sage-100 text-sage-600">
           <UserCircle size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-sage-900 leading-none">{t.clinicalProfile}</h2>
          <p className="text-xs text-sage-500 mt-1">{t.exclusionsPreferences}</p>
        </div>
      </div>

      <div className="p-2">
        {/* Allergies Section */}
        <div className="border border-sage-100 rounded-lg mb-2 overflow-hidden">
          <button 
            onClick={() => setIsAllergiesOpen(!isAllergiesOpen)}
            className="w-full flex items-center justify-between p-3 bg-white hover:bg-sage-50 transition-colors"
          >
            <div className="flex items-center text-sm font-semibold text-sage-800">
              <Shield className="h-4 w-4 mr-2 text-red-500" />
              {t.contraindications}
              {profile.allergies.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded-full">
                  {profile.allergies.length}
                </span>
              )}
            </div>
            {isAllergiesOpen ? <ChevronUp size={16} className="text-sage-400" /> : <ChevronDown size={16} className="text-sage-400" />}
          </button>
          
          {isAllergiesOpen && (
            <div className="p-3 bg-sage-50/30 border-t border-sage-100 animate-fade-in">
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  className="block w-full px-3 py-1.5 border border-sage-300 rounded-md text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white placeholder-sage-400"
                  placeholder={t.addAllergyPlaceholder}
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addAllergy()}
                />
                <Button variant="outline" size="sm" onClick={addAllergy} className="px-3 border-sage-300 text-sage-700 hover:text-red-700 hover:border-red-300">
                  +
                </Button>
              </div>
              
              <div className="max-h-32 overflow-y-auto pr-1 space-y-1">
                {profile.allergies.length === 0 && (
                  <p className="text-xs text-sage-400 italic text-center py-2">{t.noAllergies}</p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {profile.allergies.map(item => (
                    <span key={item} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-800 border border-red-100">
                      {item}
                      <button onClick={() => removeAllergy(item)} className="ml-1.5 text-red-400 hover:text-red-600 focus:outline-none">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dislikes Section */}
        <div className="border border-sage-100 rounded-lg overflow-hidden">
          <button 
            onClick={() => setIsDislikesOpen(!isDislikesOpen)}
            className="w-full flex items-center justify-between p-3 bg-white hover:bg-sage-50 transition-colors"
          >
            <div className="flex items-center text-sm font-semibold text-sage-800">
              <ThumbsDown className="h-4 w-4 mr-2 text-amber-500" />
              {t.dislikes}
              {profile.dislikes.length > 0 && (
                <span className="ml-2 bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded-full">
                  {profile.dislikes.length}
                </span>
              )}
            </div>
            {isDislikesOpen ? <ChevronUp size={16} className="text-sage-400" /> : <ChevronDown size={16} className="text-sage-400" />}
          </button>
          
          {isDislikesOpen && (
            <div className="p-3 bg-sage-50/30 border-t border-sage-100 animate-fade-in">
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  className="block w-full px-3 py-1.5 border border-sage-300 rounded-md text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-white placeholder-sage-400"
                  placeholder={t.addDislikePlaceholder}
                  value={dislikeInput}
                  onChange={(e) => setDislikeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addDislike()}
                />
                <Button variant="outline" size="sm" onClick={addDislike} className="px-3 border-sage-300 text-sage-700 hover:text-amber-700 hover:border-amber-300">
                  +
                </Button>
              </div>
              
              <div className="max-h-32 overflow-y-auto pr-1">
                 {profile.dislikes.length === 0 && (
                  <p className="text-xs text-sage-400 italic text-center py-2">{t.noDislikes}</p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {profile.dislikes.map(item => (
                    <span key={item} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-100">
                      {item}
                      <button onClick={() => removeDislike(item)} className="ml-1.5 text-amber-400 hover:text-amber-600 focus:outline-none">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};