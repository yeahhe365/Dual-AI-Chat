
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { AiModel } from '../constants';

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  models: AiModel[];
  icon: React.ElementType;
  disabled: boolean;
  colorTheme: 'teal' | 'fuchsia' | 'indigo';
  label: string;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  value,
  onChange,
  models,
  icon: Icon,
  disabled,
  colorTheme,
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedModel = models.find(m => m.apiName === value) || models[0];

  const themeColors = {
    teal: {
      text: 'text-teal-700',
      bg: 'bg-teal-50',
      border: 'border-teal-200',
      hoverBorder: 'hover:border-teal-300',
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600',
      check: 'text-teal-600',
      ring: 'focus:ring-teal-500/30'
    },
    fuchsia: {
      text: 'text-fuchsia-700',
      bg: 'bg-fuchsia-50',
      border: 'border-fuchsia-200',
      hoverBorder: 'hover:border-fuchsia-300',
      iconBg: 'bg-fuchsia-100',
      iconColor: 'text-fuchsia-600',
      check: 'text-fuchsia-600',
      ring: 'focus:ring-fuchsia-500/30'
    },
    indigo: {
      text: 'text-indigo-700',
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      hoverBorder: 'hover:border-indigo-300',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      check: 'text-indigo-600',
      ring: 'focus:ring-indigo-500/30'
    }
  }[colorTheme];

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`group flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 bg-white border rounded-lg shadow-sm transition-all duration-200 outline-none
          ${disabled 
            ? 'opacity-60 cursor-not-allowed border-slate-200' 
            : `${themeColors.hoverBorder} border-slate-200 hover:shadow-md active:scale-[0.98] ${themeColors.ring} focus:ring-2`
          }
        `}
        title={`选择 ${label} 模型`}
      >
         <div className={`p-1 rounded-md ${themeColors.iconBg} ${themeColors.iconColor} transition-transform group-hover:scale-105 duration-200`}>
            <Icon size={14} strokeWidth={2.5} />
         </div>
         
         <span className={`text-sm font-semibold ${themeColors.text} truncate max-w-[140px]`}>
            {selectedModel.name}
         </span>
         
         <ChevronDown 
            size={14} 
            className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`} 
         />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-xl z-50 p-1.5 origin-top-left animate-in fade-in zoom-in-95 duration-150">
           <div className="text-[10px] font-bold text-slate-400 px-3 py-2 uppercase tracking-wider border-b border-slate-50 mb-1">
              {label} 模型
           </div>
           <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {models.map(model => (
                <button
                  key={model.id}
                  onClick={() => {
                    onChange(model.apiName);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between group transition-all duration-150 mb-0.5 last:mb-0
                    ${model.apiName === value 
                      ? `${themeColors.bg} ${themeColors.text} font-bold` 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `}
                >
                  <span className="truncate mr-2">{model.name}</span>
                  {model.apiName === value && (
                    <Check size={14} className={`${themeColors.check} shrink-0`} strokeWidth={2.5} />
                  )}
                </button>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
