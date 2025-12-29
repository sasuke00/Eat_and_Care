import React, { useState, useRef } from 'react';
import { Plus, X, Search, Save, Camera, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { useLanguage } from '../LanguageContext';

interface PantryProps {
  items: string[];
  onAddItem: (item: string) => void;
  onRemoveItem: (item: string) => void;
  onGenerate: () => void;
  onScan?: (file: File) => Promise<void>;
  isGenerating: boolean;
}

export const Pantry: React.FC<PantryProps> = ({ 
  items, 
  onAddItem, 
  onRemoveItem, 
  onGenerate,
  onScan,
  isGenerating 
}) => {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      onAddItem(input.trim());
      setInput('');
    }
  };

  const handleAdd = () => {
    if (input.trim()) {
      onAddItem(input.trim());
      setInput('');
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onScan) {
      setIsScanning(true);
      try {
        await onScan(file);
      } finally {
        setIsScanning(false);
        // Reset file input so same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-sage-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-sage-900">{t.ingredientStore}</h2>
          <p className="text-xs text-sage-400 mt-0.5 flex items-center">
             {t.autoSaved} <Save size={10} className="ml-1" />
          </p>
        </div>
        <span className="text-xs font-medium text-sage-500 bg-sage-50 px-2 py-1 rounded-full">
          {items.length} {t.items}
        </span>
      </div>
      
      <div className="relative mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-sage-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-10 py-3 border border-sage-200 rounded-lg leading-5 bg-white placeholder-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-sage-500 sm:text-sm transition-colors"
              placeholder={t.addItemPlaceholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleAdd}
                disabled={!input.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            capture="environment"
            onChange={handleFileChange}
          />
          <Button 
            variant="outline" 
            className={`px-3 ${isScanning ? 'bg-sage-50' : ''}`}
            onClick={handleCameraClick}
            disabled={isScanning}
            title={t.scanCamera}
          >
            {isScanning ? <Loader2 className="h-5 w-5 animate-spin text-sage-600" /> : <Camera className="h-5 w-5" />}
          </Button>
        </div>
        {isScanning && <p className="text-xs text-sage-500 mt-1 ml-1 animate-pulse">{t.analyzingImage}</p>}
      </div>

      <div className="min-h-[120px] mb-6">
        {items.length === 0 ? (
          <div className="text-center py-8 text-sage-400 text-sm border-2 border-dashed border-sage-100 rounded-lg">
            {t.emptyStore}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <span 
                key={item} 
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-sage-50 text-sage-700 border border-sage-200 transition-all hover:bg-sage-100 hover:border-sage-300"
              >
                {item}
                <button
                  onClick={() => onRemoveItem(item)}
                  className="ml-2 inline-flex flex-shrink-0 h-4 w-4 text-sage-400 hover:text-red-500 focus:outline-none"
                >
                  <X className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <Button 
        variant="primary" 
        className="w-full"
        size="lg"
        onClick={onGenerate}
        isLoading={isGenerating}
        disabled={items.length === 0}
      >
        {t.analyzeGenerate}
      </Button>
    </div>
  );
};