import { getSession } from '../../services/authService';
import { openDocumentFile } from '../../services/dataService';
import React, { useState } from 'react';
import { CheckCircle2, XCircle, MessageSquare, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RoleHeaderBanner } from '../common/RoleHeaderBanner';
import { Badge, applicationStatusTone } from '../common/Badge';
export const OfficerDashboard = () => {
    const { applications, approvalTypes, documents, queries, inspections, officerVerifyDocument, officerRaiseQuery, officerScheduleInspection, officerFinalDecision, currentUser, inspectors, business } = useApp();
    const [inspectorId, setInspectorId] = useState('');
    const [selectedAppId, setSelectedAppId] = useState(applications[0]?.id || '');
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    // Modals
    const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
    // Form states
    const [querySubject, setQuerySubject] = useState('');
    const [queryText, setQueryText] = useState('');
    const [inspectionDate, setInspectionDate] = useState('2026-09-28');
    const [inspectionTimeSlot, setInspectionTimeSlot] = useState('11:00 AM - 01:00 PM');
    const [decisionType, setDecisionType] = useState('approved');
    const [decisionRemarks, setDecisionRemarks] = useState('All statutory parameters verified. Physical infrastructure conforms to NBC 2016 and departmental standards.');
    const selectedApp = applications.find(a => a.id === selectedAppId) || applications[0];
    const selectedApproval = approvalTypes.find(a => a.id === selectedApp?.approvalTypeId);
    const appDocs = documents.filter(d => selectedApp?.attachedDocumentIds.includes(d.id));
    const appQueries = queries.filter(q => q.applicationId === selectedApp?.id);
    const appInspection = inspections.find(i => i.applicationId === selectedApp?.id);
    // Counters
    const pendingScrutiny = applications.filter(a => a.status === 'submitted' || a.status === 'under_verification').length;
    const activeQueries = queries.filter(q => !q.isResolved).length;
    const pendingDecisions = applications.filter(a => a.status === 'under_final_review').length;
    const handleRaiseQuery = () => {
        if (!querySubject.trim() || !queryText.trim()) {
            alert('Please fill out query subject and deficiency details.');
            return;
        }
        officerRaiseQuery(selectedApp.id, querySubject, queryText);
        setIsQueryModalOpen(false);
        setQuerySubject('');
        setQueryText('');
    };
    const handleScheduleInspection = () => {
        officerScheduleInspection(selectedApp.id, inspectionDate, inspectionTimeSlot, inspectorId || inspectors[0]?.id || '');
        setIsScheduleModalOpen(false);
    };
    const handleExecuteDecision = () => {
        officerFinalDecision(selectedApp.id, decisionType, decisionRemarks);
        setIsDecisionModalOpen(false);
    };
    return (<div className="space-y-6">
      
      {/* Officer Header & KPIS */}
      <RoleHeaderBanner role="officer">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30">
                OFFICER WORKBENCH
              </span>
              <span className="text-xs text-slate-400">MAITRI State Single Window Clearances</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              Welcome, {currentUser.name}
            </h2>
            <p className="text-xs text-slate-400">{currentUser.designation}</p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
              Assigned Applications: {applications.length}
            </span>
          </div>
        </div>

        {/* Operational Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Under Scrutiny</span>
            <span className="text-2xl font-bold font-mono text-white tabular-nums">{pendingScrutiny}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Clarifications Active</span>
            <span className="text-2xl font-bold font-mono text-amber-400 tabular-nums">{activeQueries}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Final Decisions Pending</span>
            <span className="text-2xl font-bold font-mono text-blue-400 tabular-nums">{pendingDecisions}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Approved (This Quarter)</span>
            <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">{applications.filter(a => a.status === 'approved').length}</span>
          </div>
        </div>
      </RoleHeaderBanner>

      {/* Main Review Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Applications Queue */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Department Scrutiny Queue ({applications.length})
            </h3>
          </div>

          <div className="space-y-2">
            {applications.length === 0 ? (<div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                No applications assigned to your desk right now.
              </div>) : applications.map(app => {
            const approval = approvalTypes.find(a => a.id === app.approvalTypeId);
            const isSelected = app.id === selectedApp?.id;
            return (<div key={app.id} onClick={() => setSelectedAppId(app.id)} role="button" tabIndex={0} aria-pressed={isSelected} onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedAppId(app.id);
                    }
                }} className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${isSelected
                    ? 'border-blue-900 bg-blue-50/60 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-blue-900 bg-white px-1.5 py-0.5 rounded-md border border-blue-200">
                        {app.applicationNumber}
                      </span>
                      <h4 className="font-bold text-slate-900 mt-1">{approval?.approvalName}</h4>
                      <p className="text-[11px] text-slate-500">{business.businessName}</p>
                    </div>

                    <Badge tone={applicationStatusTone(app.status)}>
                      {app.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Risk: <strong className={app.riskLevel === 'Low' ? 'text-emerald-700' : 'text-amber-700'}>{app.riskLevel}</strong></span>
                    <span>SLA: {app.targetSLADate || 'Active'}</span>
                  </div>
                </div>);
        })}
          </div>
        </div>

        {/* Right Column: Detailed Application Review Workspace */}
        {selectedApp && (<div className="lg:col-span-8 space-y-5">
            
            {/* Top Application Card */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      {selectedApp.applicationNumber}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">
                      {selectedApproval?.approvalName}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Applicant: {business.businessName} ({business.industrySector}) · Investment: {business.investmentAmountText}
                  </p>
                </div>

                {/* Officer Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => setIsQueryModalOpen(true)} className="px-3 py-1.5 rounded-md bg-red-50 text-red-800 border border-red-200 hover:bg-red-100 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors">
                    <MessageSquare className="w-3.5 h-3.5 text-red-700"/>
                    <span>Raise Query</span>
                  </button>

                  <button onClick={() => setIsScheduleModalOpen(true)} className="px-3 py-1.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors">
                    <Calendar className="w-3.5 h-3.5 text-amber-700"/>
                    <span>Schedule Inspection</span>
                  </button>

                  <button onClick={() => setIsDecisionModalOpen(true)} className="px-3 py-1.5 rounded-md bg-blue-900 text-white hover:bg-blue-800 text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-xs transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400"/>
                    <span>Final Decision</span>
                  </button>
                </div>
              </div>

              {/* Risk Assessment Box */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">
                    Statutory Risk Profile: <span className={selectedApp.riskLevel === 'Low' ? 'text-emerald-700' : 'text-amber-700'}>{selectedApp.riskLevel} Risk</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Mandatory Legal Reference: {selectedApproval?.legalActReference}
                  </span>
                </div>
                <ul className="text-slate-600 text-[11px] list-disc pl-4 space-y-0.5">
                  {selectedApp.riskFactors.map((rf, idx) => (<li key={idx}>{rf}</li>))}
                </ul>
              </div>

              {/* Document Scrutiny Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    Mandatory Dossier Verification ({appDocs.length} files attached)
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Click to endorse or mark deficient
                  </span>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                  {appDocs.map(doc => {
                const isVerified = doc.verificationStatus === 'verified';
                const isRejected = doc.verificationStatus === 'rejected';
                return (<div key={doc.id} className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{doc.name}</span>
                            <span className="text-[10px] font-mono text-slate-500">({doc.fileName})</span>
                          </div>
                          {doc.rejectionReason && (<p className="text-[11px] text-red-700 font-semibold mt-0.5">
                              Deficiency Note: {doc.rejectionReason}
                            </p>)}
                          {doc.verifiedBy && (<p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                              Verified by {doc.verifiedBy} on {doc.verificationDate}
                            </p>)}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => { const se = getSession(); if (se)
                    openDocumentFile(se.token, doc.id).catch((e) => alert(e.message)); }} className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 cursor-pointer">
                            View
                          </button>
                          <button onClick={() => officerVerifyDocument(doc.id, 'verified')} className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${isVerified
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'}`}>
                            <CheckCircle2 className="w-3.5 h-3.5"/>
                            <span>{isVerified ? 'Verified' : 'Verify'}</span>
                          </button>

                          <button onClick={() => {
                        const reason = prompt('Specify document deficiency reason:') || 'Incomplete submission';
                        officerVerifyDocument(doc.id, 'rejected', reason);
                    }} className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${isRejected
                        ? 'bg-red-600 text-white'
                        : 'bg-red-50 text-red-800 hover:bg-red-100 border border-red-200'}`}>
                            <XCircle className="w-3.5 h-3.5"/>
                            <span>Deficient</span>
                          </button>
                        </div>
                      </div>);
            })}
                </div>
              </div>

              {/* Inspection Status (if any) */}
              {appInspection && (<div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-amber-900 font-bold">
                    <span>Field Inspection #{appInspection.inspectionNumber}</span>
                    <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded-md border border-amber-200">
                      {appInspection.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-700">
                    Assigned Inspector: <strong>{appInspection.assignedInspectorName}</strong> · Scheduled: {appInspection.scheduledDate} ({appInspection.scheduledTimeSlot})
                  </p>
                  {appInspection.overallComplianceOutcome && (<p className="text-emerald-800 font-semibold border-t border-amber-200 pt-1">
                      Inspector Findings: {appInspection.overallComplianceOutcome} — "{appInspection.inspectorRemarks}"
                    </p>)}
                </div>)}

            </div>

          </div>)}

      </div>

      {/* Modal: Raise Query */}
      {isQueryModalOpen && (<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">
                Raise Official Clarification Query on #{selectedApp.applicationNumber}
              </h3>
              <button onClick={() => setIsQueryModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Query Subject</label>
                <input type="text" value={querySubject} onChange={e => setQuerySubject(e.target.value)} placeholder="e.g. Fire exit staircase width discrepancy with Rule 44" className="w-full p-2 border border-slate-300 rounded-md text-xs"/>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Specific Deficiency Details</label>
                <textarea rows={4} value={queryText} onChange={e => setQueryText(e.target.value)} placeholder="Specify statutory clause non-compliance and requested corrective documentation..." className="w-full p-2 border border-slate-300 rounded-md text-xs"/>
              </div>

              <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-md border border-slate-200">
                * Note: Under MAITRI & Maharashtra RTSA 2015 statutory protocols, the applicant is granted 7 working days to resolve queries before statutory SLA timers pause.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-end gap-2 text-xs">
              <button onClick={() => setIsQueryModalOpen(false)} className="px-3 py-1.5 bg-slate-100 rounded-md text-slate-700 cursor-pointer">Cancel</button>
              <button onClick={handleRaiseQuery} className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-md font-semibold cursor-pointer shadow-xs">
                Issue Clarification Query
              </button>
            </div>
          </div>
        </div>)}

      {/* Modal: Schedule Inspection */}
      {isScheduleModalOpen && (<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Schedule Field Safety Inspection</h3>
              <button onClick={() => setIsScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Inspection Date</label>
                <input type="date" value={inspectionDate} onChange={e => setInspectionDate(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md text-xs font-mono"/>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Time Slot</label>
                <select value={inspectionTimeSlot} onChange={e => setInspectionTimeSlot(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md text-xs bg-white">
                  <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                  <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM</option>
                  <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Field Inspector</label>
                <select value={inspectorId || inspectors[0]?.id || ''} onChange={e => setInspectorId(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md text-xs bg-white font-semibold">
                  {inspectors.length === 0 && <option value="">No inspectors available</option>}
                  {inspectors.map(i => <option key={i.id} value={i.id}>{i.name}{i.designation ? ` (${i.designation})` : ''}</option>)}
                </select>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-end gap-2 text-xs">
              <button onClick={() => setIsScheduleModalOpen(false)} className="px-3 py-1.5 bg-slate-100 rounded-md text-slate-700 cursor-pointer">Cancel</button>
              <button onClick={handleScheduleInspection} className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-semibold cursor-pointer shadow-xs">
                Confirm & Notify Inspector
              </button>
            </div>
          </div>
        </div>)}

      {/* Modal: Final Decision */}
      {isDecisionModalOpen && (<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Statutory Final Clearance Decision</h3>
              <button onClick={() => setIsDecisionModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setDecisionType('approved')} className={`p-3 rounded-lg border font-bold text-center cursor-pointer transition-colors ${decisionType === 'approved' ? 'bg-emerald-50 text-emerald-900 border-emerald-500 ring-1 ring-emerald-500' : 'bg-slate-50 text-slate-600'}`}>
                  ✓ Grant Statutory Approval
                </button>
                <button type="button" onClick={() => setDecisionType('rejected')} className={`p-3 rounded-lg border font-bold text-center cursor-pointer transition-colors ${decisionType === 'rejected' ? 'bg-red-50 text-red-900 border-red-500 ring-1 ring-red-500' : 'bg-slate-50 text-slate-600'}`}>
                  ✕ Reject Application
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gazette Order / Endorsement Remarks</label>
                <textarea rows={3} value={decisionRemarks} onChange={e => setDecisionRemarks(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md text-xs"/>
              </div>

              {decisionType === 'approved' && (<p className="text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-md border border-emerald-200">
                  Approval will immediately generate a tamper-evident Digital Licence Certificate with QR code and notify the applicant.
                </p>)}
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-end gap-2 text-xs">
              <button onClick={() => setIsDecisionModalOpen(false)} className="px-3 py-1.5 bg-slate-100 rounded-md text-slate-700 cursor-pointer">Cancel</button>
              <button onClick={handleExecuteDecision} className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-md font-semibold cursor-pointer shadow-xs">
                Seal & Issue Order
              </button>
            </div>
          </div>
        </div>)}

    </div>);
};
