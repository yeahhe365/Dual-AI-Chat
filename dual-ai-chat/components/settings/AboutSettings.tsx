
import React, { useEffect, useState } from 'react';
import { Github, Star, Info, ExternalLink, Layers } from 'lucide-react';

const REPO_URL = "https://github.com/yeahhe365/Dual-AI-Chat";
const VERSION = "2.0.0";

const AboutSettings: React.FC = () => {
  const [starCount, setStarCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchStars = async () => {
      try {
        const response = await fetch('https://api.github.com/repos/yeahhe365/Dual-AI-Chat');
        if (response.ok) {
          const data = await response.json();
          setStarCount(data.stargazers_count);
        }
      } catch (error) {
        console.error('Failed to fetch stars:', error);
      }
    };
    fetchStars();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-2 mb-4">
           <Info size={18} className="text-slate-400" />
           <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">关于</h4>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center flex flex-col items-center relative overflow-hidden">
         {/* Glow Effect */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-r from-sky-400/20 to-indigo-400/20 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

         <div className="relative group mb-4">
             <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
             <div className="relative w-16 h-16 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-200 text-white">
                 <Layers size={32} strokeWidth={2.5} />
             </div>
         </div>
         
         <h2 className="text-2xl font-bold text-slate-800 mb-2 relative z-10">Dual AI Chat</h2>
         <p className="text-slate-500 mb-6 max-w-md relative z-10">
            一个基于 Google Gemini 的协作式 AI 聊天应用。Cognito (逻辑) 和 Muse (创意) 协同工作，为您提供最佳答案。
         </p>
         
         <div className="flex items-center justify-center gap-2 mb-8 relative z-10">
            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium border border-slate-200">
               版本 v{VERSION}
            </span>
         </div>

         <a 
            href={REPO_URL} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 group relative z-10"
         >
            <Github size={20} />
            <span className="font-medium">GitHub Repository</span>
            {starCount !== null && (
               <div className="flex items-center gap-1.5 pl-3 border-l border-slate-700 ml-1">
                  <Star size={14} className="text-amber-400 fill-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-semibold">{starCount}</span>
               </div>
            )}
            <ExternalLink size={14} className="text-slate-400 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
         </a>
      </div>
      
      <div className="text-center text-xs text-slate-400 mt-4">
         <p>Copyright © {new Date().getFullYear()} Dual AI Chat.</p>
      </div>
    </div>
  );
};

export default AboutSettings;
