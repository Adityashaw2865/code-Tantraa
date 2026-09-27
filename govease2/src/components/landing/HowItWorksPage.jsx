import React from 'react';
import { ClipboardList, FolderCheck, GitCompareArrows, BadgeCheck } from 'lucide-react';
const STEPS = [
    {
        icon: ClipboardList,
        title: 'Project Profiling & Discovery',
        desc: 'Enter basic project parameters (land, investment, workers, effluent category). The regulatory engine computes mandatory and potential clearances.'
    },
    {
        icon: FolderCheck,
        title: 'Document Pre-Validation',
        desc: 'Upload compliance files into your encrypted vault. Our automated pre-validator checks for missing documents and name discrepancies before submission.'
    },
    {
        icon: GitCompareArrows,
        title: 'Synchronized Parallel Review',
        desc: 'Fire NOC, Pollution CTE, and Power clearances run simultaneously. Department officers review dossiers, raise queries, and schedule field audits online.'
    },
    {
        icon: BadgeCheck,
        title: 'Digital Licencing & Renewal',
        desc: 'Receive QR-verified digital certificates. Track ongoing statutory validity with automated renewal alerts and 1-click renewal submission.'
    }
];
export const HowItWorksPage = () => {
    return (<div className="bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="max-w-2xl mx-auto mb-12 rounded-2xl bg-gradient-to-br from-blue-900 to-slate-900 text-white p-8 sm:p-10 shadow-lg">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-300 mb-2">Automated Statutory Flow</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            How VyaparSetu Simplifies Business Clearances
          </h1>
          <p className="text-sm text-slate-300 mt-3 leading-relaxed">
            A unified, transparent workflow that eliminates physical office visits.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (<div key={step.title} className="relative flex gap-4 bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FEF3C7' }}>
                <Icon className="w-5 h-5" style={{ color: 'var(--gov-navy)' }}/>
              </div>
              <div>
                <p className="text-[11px] font-mono font-bold text-amber-600 mb-0.5">STEP {String(idx + 1).padStart(2, '0')}</p>
                <h3 className="font-bold text-slate-900 text-sm mb-1">{step.title}</h3>
                <p className="text-slate-600 text-xs leading-relaxed">{step.desc}</p>
              </div>
            </div>);
          })}
        </div>
      </div>
    </div>);
};
