import React from 'react';
import { Phone } from 'lucide-react';
import { useApp } from '../../context/AppContext';
/**
 * Kept minimal on purpose: just the official identity line, a language
 * switcher, and the helpline. The clock, text-resizer, high-contrast
 * toggle and demo-reset button were removed — they weren't earning
 * their place in the header for day-to-day use.
 */
export const GovAccessibilityBar = () => {
    const { language, setLanguage } = useApp();
    return (<div className="bg-slate-950 text-slate-200 border-b border-slate-800 text-[11px] py-1.5 px-3 sm:px-6 flex flex-wrap items-center justify-between gap-y-1.5 z-40">

      <span className="font-extrabold text-white uppercase tracking-wider">
        महाराष्ट्र शासन | Government of Maharashtra
      </span>

      <div className="flex items-center gap-3">
        <div className="flex items-center bg-slate-900 rounded-md p-0.5 border border-slate-700">
          {['mr', 'en', 'hi'].map(lang => (<button key={lang} type="button" onClick={() => setLanguage(lang)} className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${language === lang
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:text-white'}`}>
              {lang === 'mr' ? 'मराठी' : lang === 'hi' ? 'हिंदी' : 'EN'}
            </button>))}
        </div>

        <span className="hidden sm:flex items-center gap-1 text-slate-400 font-mono text-[10px]">
          <Phone className="w-3 h-3 text-emerald-400"/>
          <span>1800-120-8040</span>
        </span>
      </div>
    </div>);
};
