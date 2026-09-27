import React, { useState } from 'react';
import { Building2, CheckCircle2, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Sparkles } from 'lucide-react';
export const FeaturesPage = ({ onStartOnboarding, onOpenAssistant }) => {
    const { departments } = useApp();
    const [quickSector, setQuickSector] = useState('Food Processing');
    const [quickEmployees, setQuickEmployees] = useState(45);
    const calculateQuickEstimate = () => {
        const list = ['Local Municipal Trade Licence', 'Industrial Building Plan Sanction'];
        if (quickEmployees >= 10)
            list.push('Factory Operating Licence (Factories Act 1948)');
        if (quickSector === 'Food Processing')
            list.push('FSSAI State Food Manufacturing Licence');
        if (quickSector !== 'Information Technology & ITES')
            list.push('Consent to Establish (CTE) — MPCB');
        list.push('Fire Safety Recommendation & NOC (Maharashtra Fire Services)');
        if (quickEmployees >= 20)
            list.push('Contract Labour Registration');
        return list;
    };
    const estimatedApprovals = calculateQuickEstimate();
    return (<div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-16">

        {/* Quick Approval Estimator */}
        <section>
          <div className="max-w-2xl mx-auto mb-8 rounded-2xl bg-gradient-to-br from-blue-900 to-slate-900 text-white p-8 sm:p-10 shadow-lg text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-300 mb-2">Instant Pre-Check</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Quick Approval Estimator</h1>
            <p className="text-sm text-slate-300 mt-3">Answer two questions to see which clearances your business likely needs.</p>
          </div>

          <div className="max-w-xl mx-auto bg-slate-50 rounded-xl p-6 border border-slate-200">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Industry Sector</label>
                <select value={quickSector} onChange={e => setQuickSector(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800 text-xs">
                  <option value="Food Processing">Food Processing</option>
                  <option value="Textiles & Apparel">Textiles & Apparel</option>
                  <option value="Chemicals & Pharmaceuticals">Chemicals & Pharmaceuticals</option>
                  <option value="Engineering & Machinery">Engineering & Machinery</option>
                  <option value="Information Technology & ITES">IT & ITES</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Total Workers</label>
                <input type="number" value={quickEmployees} onChange={e => setQuickEmployees(Math.max(1, parseInt(e.target.value) || 1))} className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800 text-xs font-mono"/>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs">
              <p className="font-semibold text-blue-900 mb-2">Likely Required Approvals ({estimatedApprovals.length}):</p>
              <ul className="space-y-1.5 text-slate-700 text-[11px]">
                {estimatedApprovals.map(item => (<li key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0"/>
                    <span>{item}</span>
                  </li>))}
              </ul>
            </div>

            <button onClick={() => onStartOnboarding(quickSector, quickEmployees)} className="w-full mt-4 py-2.5 rounded-md bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center gap-1">
              <span>Launch Full Compliance Wizard</span>
              <ChevronRight className="w-3.5 h-3.5"/>
            </button>
          </div>
        </section>

        {/* Connected Departments */}
        <section>
          <div className="text-center max-w-2xl mx-auto mb-8">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">Single Window Integration</p>
            <h2 className="text-2xl font-bold text-slate-900">Connected Regulatory Departments</h2>
          </div>

          <div className="max-w-3xl mx-auto divide-y divide-slate-100 border-t border-b border-slate-100">
            {departments.map(dept => (<div key={dept.id} className="flex items-start gap-3 py-3">
                <Building2 className="w-4 h-4 text-blue-800 mt-0.5 shrink-0"/>
                <p className="text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold text-slate-900">{dept.shortCode}</span> — {dept.name}, {dept.jurisdiction}
                </p>
              </div>))}
          </div>
        </section>

      </div>

      {/* Floating AI Assistant Launcher */}
      {onOpenAssistant && (<button onClick={onOpenAssistant} className="fixed bottom-6 right-6 z-40 flex items-center gap-2 pl-4 pr-5 py-3 rounded-full bg-blue-900 hover:bg-blue-800 text-white shadow-lg shadow-blue-900/30 cursor-pointer transition-colors" title="Open VyaparSetu Regulatory Intelligence Assistant">
          <Sparkles className="w-4 h-4 text-amber-300"/>
          <span className="text-left leading-tight">
            <span className="block text-[11px] font-bold uppercase tracking-wide">Ask VyaparSetu</span>
            <span className="block text-[9px] text-blue-200 font-medium -mt-0.5">AI Assistant</span>
          </span>
        </button>)}
    </div>);
};
