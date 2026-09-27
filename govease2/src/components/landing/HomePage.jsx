import React, { useState } from 'react';
import { ArrowRight, Search, Flame, Factory, Zap, Landmark, FileCheck2, Building2, FileText, FolderLock, Clock, BadgePercent, ShieldCheck, MapPinned, Users, XCircle, CheckCircle2, Sparkles, MessageSquareWarning } from 'lucide-react';
import avatarEntrepreneur from '../../assets/images/avatar_entrepreneur_1790107807405.jpg';
import avatarOfficer from '../../assets/images/avatar_officer_1790107797293.jpg';

export const HomePage = ({ onStartOnboarding, onOpenTrackModal, setActiveNavTab, onSearchDirectory }) => {
    const [heroSearch, setHeroSearch] = useState('');
    const popularClearances = ['MIDC Land Allotment', 'MPCB Consent', 'Fire NOC', 'Factory Licence', 'HT Power Sanction', 'Labour Licence'];
    const departments = [
        { icon: Landmark, label: 'Municipal' },
        { icon: Flame, label: 'Fire Services' },
        { icon: Factory, label: 'MPCB Pollution' },
        { icon: Zap, label: 'Electricity' },
        { icon: MapPinned, label: 'MIDC Land' },
        { icon: Users, label: 'Labour & CL' }
    ];

    const features = [
        { icon: Building2, tag: '1', title: 'Approvals & Clearances', desc: 'Find every approval your project requires across MIDC, MPCB, Fire, DISH, and state utility providers in one consolidated inventory.', link: 'Browse Catalog' },
        { icon: FileText, tag: '2', title: 'Guided Applications', desc: 'Know exactly what to fill, upload, and submit. One Common Application Form maps across every departmental portal.', link: 'Open Common Form' },
        { icon: FolderLock, tag: '3', title: 'Document Management', desc: 'Upload once, verify with OCR, and securely reuse documents across all clearance requests without repeated submissions.', link: 'Document Vault' },
        { icon: Clock, tag: '4', title: 'Application Tracking', desc: 'Track status, SLA countdowns, and desk reviews with full transparency, backed by the Right to Public Services Act.', link: 'Track Now' },
        { icon: BadgePercent, tag: '5', title: 'Incentives & Schemes', desc: 'Discover eligible financial incentives, electricity duty waivers, stamp duty exemptions, and capital subsidies.', link: 'View Schemes' },
        { icon: ShieldCheck, tag: '6', title: 'Compliance', desc: 'Stay ahead of mandatory renewals, annual returns, joint inspections, and statutory factory audits.', link: 'Compliance Center' },
        { icon: Sparkles, tag: '7', title: 'AI Regulatory Assistant', desc: 'Ask sector-specific compliance questions in plain language and get answers grounded in the actual applicable Acts — not a generic FAQ.', link: 'Ask VyaparSetu' },
        { icon: MessageSquareWarning, tag: '8', title: 'Grievance & RTS Escalation', desc: 'If a department misses its statutory deadline under the Right to Public Services Act, escalate directly from the portal — no separate complaint process.', link: 'Raise a Grievance' },
    ];

    const lifecycle = [
        { n: '01', t: 'PLAN', d: 'Understand project requirements & KYA assessment' },
        { n: '02', t: 'LAND & ESTABLISH', d: 'Identify MIDC plots & zone building bylaws' },
        { n: '03', t: 'APPROVALS', d: 'Apply for statutory CTE, Fire NOC & licences' },
        { n: '04', t: 'OPERATE', d: 'Manage DISH safety licences & factory compliance' },
        { n: '05', t: 'INCENTIVES', d: 'Discover & claim eligible PSI 2019 financial support' },
        { n: '06', t: 'EXPAND', d: 'Scale capacity & file amendment applications' },
    ];

    return (<div className="bg-white text-slate-800">
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ backgroundColor: 'var(--gov-navy)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 grid lg:grid-cols-[1.1fr_0.9fr] gap-14 items-center">
          <div className="text-white">
            <p className="text-sm font-semibold text-amber-400 mb-4">
              Government of Maharashtra, Single Window Portal
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1]">
              Every approval.<br />One window. Zero delays.
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed mt-6 max-w-lg">
              File your municipal, fire, pollution and power clearances once. We
              route the same documents to every department and track each one against
              its legal deadline until you're approved.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); onSearchDirectory?.(heroSearch); }} className="mt-8 max-w-lg flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-lg p-1.5 shadow-lg">
              <Search className="w-4 h-4 text-slate-400 ml-2 shrink-0"/>
              <input value={heroSearch} onChange={e => setHeroSearch(e.target.value)} placeholder="Search approvals, licences, departments…" className="flex-1 min-w-0 text-sm text-slate-800 placeholder-slate-400 focus:outline-none py-1.5"/>
              <button type="submit" className="px-4 py-2 rounded-md bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold cursor-pointer transition-colors shrink-0">
                Explore All
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-4 mt-6">
              <button onClick={onStartOnboarding} className="px-6 py-3.5 rounded-md bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-sm transition-colors flex items-center gap-2 cursor-pointer">
                Start your application
                <ArrowRight className="w-4 h-4"/>
              </button>
              <button onClick={onOpenTrackModal} className="px-5 py-3.5 rounded-md border border-white/25 text-white font-semibold text-sm hover:bg-white/5 transition-colors flex items-center gap-2 cursor-pointer">
                <Search className="w-4 h-4"/>
                Track an application
              </button>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <div className="flex -space-x-2">
                <img src={avatarEntrepreneur} alt="Entrepreneur using VyaparSetu" className="w-8 h-8 rounded-full border-2 border-[var(--gov-navy)] object-cover"/>
                <img src={avatarOfficer} alt="Department officer using VyaparSetu" className="w-8 h-8 rounded-full border-2 border-[var(--gov-navy)] object-cover"/>
              </div>
              <p className="text-xs text-slate-300">Trusted by entrepreneurs and department officers across Maharashtra</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-6">
              <span className="text-xs font-semibold text-amber-400 mr-1">Popular Clearances:</span>
              {popularClearances.map(tag => (<button key={tag} onClick={() => onSearchDirectory?.(tag)} className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-[11px] font-semibold cursor-pointer transition-colors">
                  {tag}
                </button>))}
            </div>
          </div>

          {/* Visual: departments as cards, converging into one certificate badge */}
          <div className="relative h-80 sm:h-[26rem] flex items-center justify-center" aria-hidden="true">
            <div className="grid grid-cols-3 gap-4 w-full max-w-md">
              {departments.map((dept) => {
                const Icon = dept.icon;
                return (
                  <div key={dept.label} className="bg-white/5 border border-white/15 rounded-xl p-4 flex flex-col items-center gap-2 backdrop-blur-sm hover:bg-white/10 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                      <Icon className="w-[18px] h-[18px] text-amber-400"/>
                    </div>
                    <span className="text-[11px] font-semibold text-white text-center leading-tight">{dept.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-amber-400 text-slate-900 font-bold text-sm px-5 py-3 rounded-full shadow-lg shadow-amber-400/30 whitespace-nowrap">
              <FileCheck2 className="w-4 h-4"/>
              One certificate
            </div>
          </div>
        </div>
      </section>

      {/* Credibility strip */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 border-b border-slate-200">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[['12+','Departments connected'],['300+','Clearances covered'],['1','Document upload, reused everywhere'],['RTS Act','Statutory deadline on every application']].map(([n,l]) => (
            <div key={l}>
              <p className="text-2xl font-extrabold" style={{ color: 'var(--gov-navy)' }}>{n}</p>
              <p className="text-xs text-slate-500 mt-1">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold text-amber-600 text-center tracking-wide uppercase mb-3">Single-Window Core Architecture</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 text-center mb-3">
            One platform for your entire industrial journey.
          </h2>
          <p className="text-sm text-slate-500 text-center mb-12 max-w-lg mx-auto">
            Integrated statutory workflows designed to eliminate bureaucratic silos and accelerate industrial commissioning.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
                  <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#FEF3C7' }}>
                    <Icon className="w-5 h-5" style={{ color: 'var(--gov-navy)' }}/>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-2">{f.tag}. {f.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">{f.desc}</p>
                  <button onClick={() => setActiveNavTab && setActiveNavTab('directory')} className="text-sm font-semibold flex items-center gap-1 cursor-pointer" style={{ color: 'var(--gov-navy)' }}>
                    {f.link} <ArrowRight className="w-3.5 h-3.5"/>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why VyaparSetu vs Udyam / generic portals */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-amber-600 text-center tracking-wide uppercase mb-3">Why VyaparSetu</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 text-center mb-3">
            Udyam gets you registered. VyaparSetu gets you operational.
          </h2>
          <p className="text-sm text-slate-500 text-center mb-12 max-w-xl mx-auto">
            Udyam Registration confirms your MSME identity — it stops there. Every statutory clearance you
            still need to legally start production is a separate, disconnected process. That's the gap VyaparSetu closes.
          </p>

          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200 text-xs sm:text-sm font-bold text-slate-700">
              <div className="p-3 sm:p-4">Capability</div>
              <div className="p-3 sm:p-4 text-center">Udyam Registration</div>
              <div className="p-3 sm:p-4 text-center" style={{ color: 'var(--gov-navy)' }}>VyaparSetu</div>
            </div>
            {[
                ['Scope', 'One-time MSME identity number', 'Full lifecycle: Municipal, Fire, MPCB, Power, Land & Labour clearances'],
                ['After registration', 'Certificate issued — journey ends', 'SLA-tracked applications, joint inspections & renewals continue'],
                ['Documents', 'Re-upload separately on every dept portal', 'One vault, reused automatically across every clearance'],
                ['Regulatory guidance', 'None — self-navigate each department', 'Built-in AI assistant answers sector-specific compliance questions'],
                ['Deadline transparency', 'No statutory SLA shown', 'Right to Public Services Act countdown on every application'],
                ['Financial incentives', 'Not surfaced', 'Auto-matched PSI 2019 subsidies, duty & stamp duty waivers'],
            ].map(([label, udyam, vs], i) => (<div key={label} className={`grid grid-cols-3 text-xs sm:text-sm ${i % 2 ? 'bg-white' : 'bg-slate-50/50'}`}>
                <div className="p-3 sm:p-4 font-semibold text-slate-800">{label}</div>
                <div className="p-3 sm:p-4 text-slate-500 flex items-start gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-slate-300 mt-0.5 shrink-0"/>
                  <span>{udyam}</span>
                </div>
                <div className="p-3 sm:p-4 text-slate-800 flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0"/>
                  <span>{vs}</span>
                </div>
              </div>))}
          </div>
        </div>
      </section>

      {/* Regulatory lifecycle */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--gov-navy)' }}>
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold text-amber-400 text-center tracking-wide uppercase mb-3">Regulatory Lifecycle</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-3">
            From idea to expansion — we stay with you.
          </h2>
          <p className="text-sm text-slate-300 text-center mb-12 max-w-lg mx-auto">
            A continuous regulatory companion guiding your enterprise through every milestone.
          </p>

          <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {lifecycle.map((s) => (
              <div key={s.n} className="rounded-xl p-5 border" style={{ backgroundColor: 'var(--gov-navy-light)', borderColor: 'rgba(255,255,255,0.1)' }}>
                <p className="text-amber-400 font-extrabold text-lg mb-2">{s.n}</p>
                <p className="text-white font-bold text-xs tracking-wide mb-2">{s.t}</p>
                <p className="text-slate-300 text-xs leading-relaxed mb-3">{s.d}</p>
                <button className="text-amber-400 text-xs font-semibold flex items-center gap-1 cursor-pointer">
                  Explore <ArrowRight className="w-3 h-3"/>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 text-center mb-2">
            From application to certificate
          </h2>
          <p className="text-sm text-slate-500 text-center mb-14 max-w-md mx-auto">
            No office visit at any stage — every step happens on the portal.
          </p>
          <div className="relative grid sm:grid-cols-4 gap-10 sm:gap-6">
            <div className="hidden sm:block absolute top-4 left-[12.5%] right-[12.5%] h-px bg-slate-200"/>
            {[
              { t: 'Tell us your business', d: 'Sector, scale and location — we map the exact approvals you need.' },
              { t: 'Upload once', d: 'Documents go into one vault, reused across every department.' },
              { t: 'Departments review in parallel', d: 'Fire, pollution, power and municipal checks run together, not one by one.' },
              { t: 'Get your certificate', d: 'A QR-verified licence, with renewal reminders before it expires.' },
            ].map((step, i) => (<div key={step.t} className="relative">
                <div className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center text-xs font-bold text-white mb-4 relative z-10" style={{ backgroundColor: 'var(--gov-navy)' }}>
                  {i + 1}
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-1.5">{step.t}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{step.d}</p>
              </div>))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200">
        <div className="max-w-4xl mx-auto text-center rounded-2xl py-14 px-6" style={{ backgroundColor: 'var(--gov-navy)' }}>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
            Ready to see what your business needs?
          </h2>
          <p className="text-sm text-slate-300 mb-7">Takes two minutes to find out which approvals apply to you.</p>
          <button onClick={onStartOnboarding} className="px-6 py-3 rounded-md bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-sm transition-colors inline-flex items-center gap-2 cursor-pointer">
            Start your application
            <ArrowRight className="w-4 h-4"/>
          </button>
        </div>
      </section>
    </div>);
};