import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import heroImage from '../../assets/images/hero_government_portal_1790107787523.jpg';
const FAQS = [
    {
        q: 'What is the VyaparSetu Single Window Portal?',
        a: 'VyaparSetu (व्यापारसेतु) is an integrated government digital portal that streamlines all pre-establishment and pre-operational clearances required by industrial and manufacturing units in Maharashtra. Instead of visiting multiple departments physically, entrepreneurs discover, apply, track, and receive statutory certificates digitally.'
    },
    {
        q: 'Can multiple departmental approvals move in parallel?',
        a: 'Yes. Independent approvals such as Fire Safety NOC, Pollution Consent to Establish (CTE), and HT Power Sanction proceed concurrently once your foundational Land and Building Plan is registered.'
    },
    {
        q: 'Are the processing timelines legally binding on department officers?',
        a: 'Yes, all services are notified under the Maharashtra Right to Public Services Act (RTSA) 2015 with strict statutory SLAs. Applications exceeding SLA are automatically escalated.'
    },
    {
        q: 'Does the VyaparSetu AI Assistant make legal decisions?',
        a: 'No. The AI Assistant is strictly an advisory regulatory knowledge layer. Official inspections, document verifications, and clearance decrees are exercised solely by authorized government officers.'
    }
];
export const AboutPage = ({ onOpenAssistant }) => {
    const { schemes } = useApp();
    const [activeFaqIndex, setActiveFaqIndex] = useState(0);
    return (<div className="bg-white">

      {/* Mission */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900 to-slate-900 text-white p-8 sm:p-10 shadow-lg text-center bg-cover bg-center"
          style={{ backgroundImage: `linear-gradient(to bottom right, rgba(30,58,138,0.92), rgba(15,23,42,0.94)), url(${heroImage})` }}
        >
          <p className="text-xs font-bold uppercase tracking-wider text-blue-300 mb-2">About the Initiative</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">
            Empowering Maharashtra's Industrial Horizon
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            VyaparSetu eliminates compliance opacity by replacing fragmented portals with a unified, intelligent
            single-window orchestration engine — empowering every entrepreneur to start, operate, and scale with
            statutory confidence.
          </p>
        </div>
      </section>

      {/* Schemes */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-slate-100">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">Industrial Subsidies & Benefits</p>
          <h2 className="text-2xl font-bold text-slate-900">State & Central Incentive Schemes</h2>
        </div>

        <div className="max-w-3xl mx-auto divide-y divide-slate-100 border-t border-b border-slate-100">
          {schemes.map(sch => (<div key={sch.id} className="py-5">
              <span className="text-[11px] text-blue-800 font-semibold">{sch.stateOrCentral}</span>
              <h3 className="font-bold text-sm text-slate-900 mt-1 mb-1.5 leading-snug">{sch.name}</h3>
              <p className="text-slate-600 text-xs mb-2 leading-relaxed">{sch.description}</p>
              <p className="text-xs text-slate-700">
                Max financial benefit: <span className="font-bold font-mono">{sch.maxBenefitAmount}</span>
              </p>
            </div>))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-100">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => (<div key={faq.q} className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                <button onClick={() => setActiveFaqIndex(activeFaqIndex === idx ? null : idx)} className="w-full text-left p-4 hover:bg-slate-50 flex items-center justify-between gap-4 font-semibold text-xs text-slate-900 cursor-pointer">
                  <span>{faq.q}</span>
                  <span className="text-slate-500 font-mono text-sm">{activeFaqIndex === idx ? '−' : '+'}</span>
                </button>
                {activeFaqIndex === idx && (<div className="p-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                    {faq.a}
                  </div>)}
              </div>))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-amber-300"/>
              </div>
              <p className="font-bold text-blue-950">Have a specific compliance question?</p>
            </div>
            <button onClick={onOpenAssistant} className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-md shrink-0 cursor-pointer transition-colors">
              Ask VyaparSetu AI
            </button>
          </div>
        </div>
      </section>

    </div>);
};
