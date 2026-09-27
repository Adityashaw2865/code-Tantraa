import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { evaluateRequiredApprovals } from '../../services/rulesEngine';
const humanize = (k) => k.replace(/^doc_/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
export const RequiredDocsPanel = () => {
    const { business, approvalTypes, documents } = useApp();
    const evaluated = evaluateRequiredApprovals(business, approvalTypes, documents)
        .filter(e => e.confidence !== 'Not Applicable');
    const map = new Map();
    evaluated.forEach(e => e.approval.requiredDocumentKeys.forEach(k => {
        map.set(k, [...(map.get(k) || []), e.approval.shortCode || e.approval.approvalName]);
    }));
    const have = new Set(documents.filter(d => d.verificationStatus !== 'rejected').map(d => d.documentKey));
    const nameOf = (k) => documents.find(d => d.documentKey === k)?.name || humanize(k);
    const items = Array.from(map.entries());
    const done = items.filter(([k]) => have.has(k)).length;
    return (<div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Required for your business</h3>
          <p className="text-[11px] text-slate-500">
            Based on {business.industrySector} sector &amp; your project profile
          </p>
        </div>
        <span className="text-xs font-semibold text-blue-900">{done} / {items.length} uploaded</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map(([key, forApprovals]) => {
            const ok = have.has(key);
            return (<div key={key} className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs ${ok ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/50'}`}>
              {ok ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0"/> : <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0"/>}
              <div>
                <div className="font-semibold text-slate-800">{nameOf(key)}</div>
                <div className="text-[11px] text-slate-500">Needed for: {forApprovals.join(', ')}</div>
              </div>
            </div>);
        })}
      </div>
    </div>);
};
