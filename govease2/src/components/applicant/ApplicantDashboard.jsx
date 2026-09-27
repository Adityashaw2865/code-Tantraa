import { evaluateRequiredApprovals } from '../../services/rulesEngine';
import React, { useState } from 'react';
import { Layers, FileText, FolderLock, Award, AlertTriangle, Sparkles, Share2, Send, Sliders, DollarSign } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ApprovalChecklist } from './ApprovalChecklist';
import { DependencyGraph } from './DependencyGraph';
import { ApplicationTracker } from './ApplicationTracker';
import { DocumentVault } from './DocumentVault';
import { LicenceRenewalCenter } from './LicenceRenewalCenter';
import { OfficialDocumentModal } from '../modals/OfficialDocumentModal';
import { DigiLockerPullModal } from '../modals/DigiLockerPullModal';
import { MahaGrasPaymentModal } from '../modals/MahaGrasPaymentModal';
import { SmsNotificationDrawer } from '../modals/SmsNotificationDrawer';
import { RoleHeaderBanner } from '../common/RoleHeaderBanner';
import { TRANSLATIONS } from '../../data/translations';
import { Printer, Receipt, Database, Smartphone } from 'lucide-react';
export const ApplicantDashboard = ({ onStartOnboarding, onAddBusiness, onOpenAssistant, initialTab = 'checklist' }) => {
    const { business, businesses, switchBusiness, applications, approvalTypes, documents, queries, licences, schemes, grievances, submitGrievance, language } = useApp();
    const applicableCount = evaluateRequiredApprovals(business, approvalTypes, documents)
        .filter(e => e.confidence !== 'Not Applicable').length;
    const t = TRANSLATIONS[language];
    const [activeTab, setActiveTab] = useState(initialTab);
    const [selectedAppIdForTracker, setSelectedAppIdForTracker] = useState(null);
    // High-impact feature modal states
    const [showDocModal, setShowDocModal] = useState(false);
    const [docModalType, setDocModalType] = useState('caf');
    const [showDigiLocker, setShowDigiLocker] = useState(false);
    const [showMahaGras, setShowMahaGras] = useState(false);
    const [showSmsDrawer, setShowSmsDrawer] = useState(false);
    // Grievance form state
    const [grvSubject, setGrvSubject] = useState('');
    const [grvDesc, setGrvDesc] = useState('');
    const [grvCategory, setGrvCategory] = useState('SLA Delay / Breach');
    // Counters
    const totalApprovals = approvalTypes.length;
    const inProgressApps = applications.filter(a => a.status !== 'approved' && a.status !== 'draft');
    const queryRaisedApps = applications.filter(a => a.status === 'query_raised');
    const approvedLicences = licences.filter(l => l.status === 'Active');
    const expiringLicence = licences.find(l => l.daysToExpiry <= 60);
    const handleSelectApplication = (appId) => {
        setSelectedAppIdForTracker(appId);
        setActiveTab('tracker');
    };
    const handleSubmitNewGrievance = (e) => {
        e.preventDefault();
        if (!grvSubject.trim() || !grvDesc.trim())
            return;
        submitGrievance({
            subject: grvSubject,
            description: grvDesc,
            category: grvCategory,
            priority: 'High'
        });
        setGrvSubject('');
        setGrvDesc('');
        alert('Statutory Grievance successfully filed under Maharashtra RTSA 2015.');
    };
    return (<div className="space-y-6">
      
      {/* Enterprise Dossier Banner */}
      <RoleHeaderBanner role="applicant">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/10 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase">
                {business.businessType}
              </span>
              <span className="text-xs text-slate-400 font-mono">PAN: {business.panNumber}</span>
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              {business.businessName}
            </h1>
            <p className="text-xs text-slate-300">
              {business.industrySector} · {business.address}, {business.district}, {business.state} - {business.pincode}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Export Official CAF-1 Form */}
            <button onClick={() => {
            setDocModalType('caf');
            setShowDocModal(true);
        }} className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors" title="Download official consolidated common application form with QR code">
              <Printer className="w-3.5 h-3.5"/>
              <span>{t.actions.downloadCAF}</span>
            </button>

            {/* MahaGRAS Consolidated Fee Gateway */}
            <button onClick={() => setShowMahaGras(true)} className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors" title="Consolidated payment across all departmental clearance heads">
              <Receipt className="w-3.5 h-3.5"/>
              <span>{t.actions.payMahaGras}</span>
            </button>

            {/* DigiLocker / 7/12 Pull */}
            <button onClick={() => setShowDigiLocker(true)} className="px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors" title="Pull verified 7/12 land records and Udyam MSME credentials">
              <Database className="w-3.5 h-3.5"/>
              <span>{t.actions.pullDigiLocker}</span>
            </button>

            {/* Citizen SMS/WhatsApp Feed */}
            <button onClick={() => setShowSmsDrawer(true)} className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors" title="View simulated SMS & WhatsApp Citizen notification feeds">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400"/>
              <span>Citizen SMS / WhatsApp</span>
            </button>

            <button onClick={onOpenAssistant} className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors">
              <Sparkles className="w-3.5 h-3.5 text-amber-300"/>
              <span>{t.actions.askAI}</span>
            </button>

            <button onClick={onStartOnboarding} className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors">
              <Sliders className="w-3.5 h-3.5 text-slate-400"/>
              <span>Edit Project Wizard</span>
            </button>

            {businesses.length > 1 && (<select value={business.id} onChange={(e) => switchBusiness(e.target.value)} className="px-2 py-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-xs cursor-pointer">
                {businesses.map(b => (<option key={b.id} value={b.id}>{b.businessName}</option>))}
              </select>)}

            <button onClick={onAddBusiness} className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors">
              <span>+ Add Business</span>
            </button>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 text-xs">
          <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Mandated Approvals</span>
            <span className="text-xl font-bold font-mono text-white tabular-nums">{applicableCount} Clearances</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Based on sector & size</span>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">In Scrutiny / Review</span>
            <span className="text-xl font-bold font-mono text-blue-400 tabular-nums">{inProgressApps.length} Active</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Moving in parallel</span>
          </div>

          <div className={`p-3 rounded-lg border ${queryRaisedApps.length > 0
            ? 'bg-red-950/40 border-red-500/40 text-red-300'
            : 'bg-slate-800/60 border-slate-700/60'}`}>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Queries Pending</span>
            <span className="text-xl font-bold font-mono text-red-400 tabular-nums">
              {queryRaisedApps.length} Action Req.
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Under 7-day RTSA limit</span>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Digital Licences</span>
            <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">{approvedLicences.length} Active</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Digital QR certified</span>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Next Renewal</span>
            <span className="text-xl font-bold font-mono text-amber-400 tabular-nums">
              {expiringLicence ? `${expiringLicence.daysToExpiry} Days` : 'In Order'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Factory Operating Licence</span>
          </div>
        </div>
      </RoleHeaderBanner>

      {/* Urgent Clarification Action Banner (Section 14 & 39) */}
      {queryRaisedApps.length > 0 && (<div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5"/>
            <div>
              <h4 className="font-bold text-xs text-red-900">
                Action Required: Department Clarification Query Raised on {queryRaisedApps[0].applicationNumber}
              </h4>
              <p className="text-xs text-red-800 mt-0.5">
                The department officer has raised a query on your application. Submit clarification to avoid SLA pause.
              </p>
            </div>
          </div>

          <button onClick={() => handleSelectApplication(queryRaisedApps[0].id)} className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold text-xs whitespace-nowrap cursor-pointer transition-colors shadow-2xs self-start sm:self-auto">
            Respond to Query Now →
          </button>
        </div>)}

      {/* Left Sidebar + Content Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* Left Sidebar Navigation */}
        <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-20">
          <nav className="bg-white rounded-xl border border-slate-200 shadow-xs p-3 space-y-4 text-xs">
            {[
                { heading: 'Overview', items: [
                        { id: 'checklist', label: 'Approval Journey & Checklist', icon: Layers },
                    ] },
                { heading: 'My Industrial Journey', items: [
                        { id: 'pipeline', label: 'Parallel Dependency Pipeline', icon: Share2 },
                        { id: 'tracker', label: `Active Applications (${applications.length})`, icon: FileText },
                    ] },
                { heading: 'Application & Documents', items: [
                        { id: 'vault', label: `Document Vault (${documents.length})`, icon: FolderLock },
                        { id: 'renewals', label: `Digital Licences & Renewals (${licences.length})`, icon: Award },
                        { id: 'schemes', label: `Government Subsidies (${schemes.length})`, icon: DollarSign },
                    ] },
                { heading: 'Support & Account', items: [
                        { id: 'grievances', label: `RTSA Grievances (${grievances.length})`, icon: AlertTriangle },
                    ] },
            ].map(group => (<div key={group.heading}>
                <p className="px-2.5 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{group.heading}</p>
                <div className="space-y-1">
                  {group.items.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full text-left px-2.5 py-2 rounded-lg font-semibold flex items-center gap-2 cursor-pointer transition-colors ${isActive
                                ? 'bg-blue-900 text-white shadow-2xs'
                                : 'hover:bg-slate-100 text-slate-700'}`}>
                        <Icon className="w-3.5 h-3.5 shrink-0"/>
                        <span>{tab.label}</span>
                      </button>);
                    })}
                </div>
              </div>))}

            {/* Quick Actions */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5">
              <button onClick={onAddBusiness} className="w-full px-2.5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                <span>+ Start New Application</span>
              </button>
              <button onClick={onOpenAssistant} className="w-full px-2.5 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                <Sparkles className="w-3.5 h-3.5 text-blue-700"/>
                <span>Ask AI Assistant</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Tab Content Display */}
        <div className="flex-1 min-w-0">
        {activeTab === 'checklist' && (<ApprovalChecklist onSelectApplication={handleSelectApplication} onNavigateToVault={() => setActiveTab('vault')}/>)}

        {activeTab === 'pipeline' && (<DependencyGraph />)}

        {activeTab === 'tracker' && (<ApplicationTracker selectedAppId={selectedAppIdForTracker} onBackToList={() => setActiveTab('checklist')}/>)}

        {activeTab === 'vault' && (<DocumentVault />)}

        {activeTab === 'renewals' && (<LicenceRenewalCenter />)}

        {/* Subsidies Tab */}
        {activeTab === 'schemes' && (<div className="space-y-4">
            <div className="pb-2 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900">
                Matched Government Subsidies & Incentives for {business.businessName}
              </h3>
              <p className="text-xs text-slate-500">
                Automatically filtered for Food Processing units investing ₹{business.investmentAmountCr} Crore in Maharashtra (Package Scheme of Incentives PSI 2019 / Policy 2024).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {schemes.map(sch => (<div key={sch.id} className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-blue-900 font-semibold mb-1">
                      <span>{sch.stateOrCentral}</span>
                      <span className="font-mono text-emerald-700">100% Eligible</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">{sch.name}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{sch.description}</p>
                    
                    <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-100 mt-3 text-xs">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase block">Maximum Financial Benefit</span>
                      <span className="font-bold text-blue-950 font-mono text-sm">{sch.maxBenefitAmount}</span>
                    </div>
                  </div>

                  <button onClick={() => alert(`Pre-filled subsidy dossier generated for ${sch.name} using your verified vault documents.`)} className="w-full py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-md text-xs font-semibold cursor-pointer shadow-2xs">
                    Generate Pre-Filled Subsidy Dossier
                  </button>
                </div>))}
            </div>
          </div>)}

        {/* Grievances Tab */}
        {activeTab === 'grievances' && (<div className="space-y-6">
            <div className="pb-2 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900">
                Right to Public Services Act (RTSA 2013) Grievance Escalation
              </h3>
              <p className="text-xs text-slate-500">
                If your application exceeds statutory SLA or you observe departmental irregularity, file a legally-binding appeal to the State Nodal Secretary.
              </p>
            </div>

            {/* Lodge New Grievance Form */}
            <form onSubmit={handleSubmitNewGrievance} className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                Lodge Statutory RTSA Appeal
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Grievance Category</label>
                  <select value={grvCategory} onChange={e => setGrvCategory(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md text-xs bg-white">
                    <option value="SLA Delay / Breach">Statutory SLA Deadline Exceeded</option>
                    <option value="Officer Query Discrepancy">Officer Query Outside Legal Mandate</option>
                    <option value="Document Rejection Appeal">Arbitrary Document Rejection Appeal</option>
                    <option value="Portal Technical Issue">Portal / Payment Technical Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Appeal Subject</label>
                  <input type="text" value={grvSubject} onChange={e => setGrvSubject(e.target.value)} placeholder="e.g. Application APP-2026-00127 SLA delay escalation" className="w-full p-2 border border-slate-300 rounded-md text-xs" required/>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Grievance Rationale</label>
                <textarea rows={3} value={grvDesc} onChange={e => setGrvDesc(e.target.value)} placeholder="State the application number, department involved, and specific statutory remedy sought..." className="w-full p-2 border border-slate-300 rounded-md text-xs" required/>
              </div>

              <div className="flex justify-end pt-1">
                <button type="submit" className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors">
                  <Send className="w-3.5 h-3.5"/>
                  <span>Submit Grievance to State Appellate Authority</span>
                </button>
              </div>
            </form>

            {/* Existing Grievances */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600">
                Registered Appeals & Grievances ({grievances.length})
              </h4>

              {grievances.map(grv => (<div key={grv.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-red-900 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                        {grv.grievanceNumber}
                      </span>
                      <h5 className="font-bold text-slate-900">{grv.subject}</h5>
                    </div>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                      {grv.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs">{grv.description}</p>
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
                    <span>Category: {grv.category}</span>
                    <span>Filed: {grv.createdDate}</span>
                  </div>
                </div>))}
            </div>
          </div>)}
        </div>
      </div>

      {/* High-Impact Feature Modals */}
      <OfficialDocumentModal isOpen={showDocModal} onClose={() => setShowDocModal(false)} documentType={docModalType} business={business} application={applications[0]} licence={licences[0]}/>

      <DigiLockerPullModal isOpen={showDigiLocker} onClose={() => setShowDigiLocker(false)}/>

      <MahaGrasPaymentModal isOpen={showMahaGras} onClose={() => setShowMahaGras(false)} business={business}/>

      <SmsNotificationDrawer isOpen={showSmsDrawer} onClose={() => setShowSmsDrawer(false)} onOpenQuery={() => handleSelectApplication(queryRaisedApps[0]?.id || applications[0]?.id)}/>

    </div>);
};
