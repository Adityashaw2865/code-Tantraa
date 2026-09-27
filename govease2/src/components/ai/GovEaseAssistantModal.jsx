import React, { useState } from 'react';
import { Sparkles, Send } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { askGovEaseAssistant } from '../../services/aiService';
export const GovEaseAssistantModal = ({ isOpen, onClose, onNavigateToChecklist }) => {
    const { business, applications } = useApp();
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState([
        {
            sender: 'assistant',
            text: `Hello! I am the **VyaparSetu Regulatory Intelligence Assistant** (व्यापारसेतु).\n\nI am configured for **${business.businessName}** (${business.industrySector}, ${business.environmentalCategory} Category, ${business.state}). You can ask me any question regarding statutory compliance, legal Acts, document requirements, or query resolutions.`,
            references: [
                'Factories Act 1948 & Maharashtra Factories Rules 1963',
                'Water & Air (Pollution Prevention) Acts - MPCB Guidelines',
                'Maharashtra Fire Prevention & Life Safety Measures Act 2006',
                'MAITRI Single Window Clearances Rules & RTSA 2015'
            ],
            nextStep: 'Try asking about your active query or required environmental clearances.'
        }
    ]);
    if (!isOpen)
        return null;
    const quickChips = [
        'Why do I need Consent to Establish (CTE)?',
        'Explain Fire NOC static water & hydrant rules',
        'How to resolve the Building Sanction stairwell query?',
        'What state subsidies am I eligible for?',
        'How does 60-day licence renewal work?'
    ];
    const handleSend = async (queryText) => {
        const textToSend = queryText || prompt;
        if (!textToSend.trim())
            return;
        const userMsg = { sender: 'user', text: textToSend };
        setMessages(prev => [...prev, userMsg]);
        setPrompt('');
        setLoading(true);
        try {
            const activeAppNames = applications.map(a => a.applicationNumber);
            const res = await askGovEaseAssistant(textToSend, {
                businessName: business.businessName,
                sector: business.industrySector,
                state: business.state,
                investmentCr: business.investmentAmountCr,
                employees: business.numberOfEmployees,
                activeApplications: activeAppNames
            });
            setMessages(prev => [
                ...prev,
                {
                    sender: 'assistant',
                    text: res.answer,
                    references: res.legalReferences,
                    nextStep: res.suggestedNextStep
                }
            ]);
        }
        catch (e) {
            setMessages(prev => [
                ...prev,
                {
                    sender: 'assistant',
                    text: 'Encountered temporary difficulty querying statutory knowledge base. Please try rephrasing your query.'
                }
            ]);
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full h-[620px] max-h-[90vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4 text-amber-300"/>
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                VyaparSetu AI Regulatory Guide
                <span className="text-[10px] text-amber-400 font-medium">व्यापारसेतु</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Grounded in Indian Statutory Acts & Single-Window Gazette Notifications
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer p-1">
            ✕
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2 bg-slate-50 border-b border-slate-200 overflow-x-auto flex items-center gap-1.5 text-[11px]">
          <span className="font-semibold text-slate-500 whitespace-nowrap pl-1">Ask:</span>
          {quickChips.map((chip, idx) => (<button key={idx} onClick={() => handleSend(chip)} className="px-2.5 py-1 rounded-full bg-white hover:bg-blue-50 hover:text-blue-900 text-slate-700 border border-slate-200 whitespace-nowrap transition-colors cursor-pointer">
              {chip}
            </button>))}
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
          {messages.map((m, idx) => (<div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 space-y-2 leading-relaxed ${m.sender === 'user'
                ? 'bg-blue-900 text-white rounded-br-xs'
                : 'bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200'}`}>
                <div className="whitespace-pre-line text-xs font-normal">
                  {m.text}
                </div>

                {/* Grounded Legal References */}
                {m.references && m.references.length > 0 && (<div className="pt-2 border-t border-slate-200/60 text-[10px] space-y-1">
                    <span className="font-bold uppercase tracking-wider text-slate-500 block">
                      Statutory Citations:
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-600 font-mono">
                      {m.references.map((ref, i) => (<li key={i}>{ref}</li>))}
                    </ul>
                  </div>)}

                {/* Next Step */}
                {m.nextStep && (<div className="pt-1 text-[11px] font-semibold text-blue-800 flex items-center gap-1">
                    <span>Recommendation:</span>
                    <span>{m.nextStep}</span>
                  </div>)}
              </div>
            </div>))}

          {loading && (<div className="flex justify-start">
              <div className="bg-slate-100 rounded-2xl p-3 text-xs text-slate-500 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-blue-700"/>
                <span>VyaparSetu AI analyzing statutory legal citations...</span>
              </div>
            </div>)}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input type="text" value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Ask a compliance or regulatory question..." className="flex-1 p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-blue-900"/>
          <button onClick={() => handleSend()} disabled={!prompt.trim() || loading} className="p-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl cursor-pointer disabled:opacity-40 transition-colors shadow-2xs">
            <Send className="w-4 h-4"/>
          </button>
        </div>

        <div className="bg-slate-50 px-4 py-1.5 text-[10px] text-slate-400 text-center border-t border-slate-100">
          Statutory intelligence advisory only. Formal clearances issued exclusively by gazetted department officers.
        </div>

      </div>
    </div>);
};
