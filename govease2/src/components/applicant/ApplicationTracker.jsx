import React, { useState } from 'react';
import { FileText, MessageSquare, Send, Paperclip, Calendar, ArrowLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge, applicationStatusTone, documentStatusTone } from '../common/Badge';
export const ApplicationTracker = ({ selectedAppId, onBackToList }) => {
    const { applications, approvalTypes, departments, documents, queries, inspections, applicantRespondToQuery, currentUser, submitApplication, uploadDocument } = useApp();
    const [submitting, setSubmitting] = useState(false);
    const [activeAppId, setActiveAppId] = useState(selectedAppId || applications[0]?.id || '');
    const [responseQueryText, setResponseQueryText] = useState('');
    const [selectedResponseDocId, setSelectedResponseDocId] = useState('doc_arch_04');
    const app = applications.find(a => a.id === activeAppId) || applications[0];
    if (!app) {
        return <div className="p-6 text-center text-slate-500">No applications found.</div>;
    }
    const approval = approvalTypes.find(a => a.id === app.approvalTypeId);
    const department = departments.find(d => d.id === app.departmentId);
    const appQueries = queries.filter(q => q.applicationId === app.id);
    const appInspection = inspections.find(i => i.applicationId === app.id);
    const attachedDocs = documents.filter(d => app.attachedDocumentIds.includes(d.id));
    // SLA Calculation
    const targetDate = app.targetSLADate ? new Date(app.targetSLADate) : null;
    const today = new Date();
    const daysRemaining = targetDate ? Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const handleSendClarification = (queryId) => {
        if (!responseQueryText.trim()) {
            alert('Please enter your response remarks.');
            return;
        }
        const chosenDoc = documents.find(d => d.id === selectedResponseDocId);
        applicantRespondToQuery(queryId, responseQueryText, chosenDoc?.id, chosenDoc?.name);
        setResponseQueryText('');
    };
    const statusSteps = [
        { key: 'draft', label: 'Draft' },
        { key: 'submitted', label: 'Submitted' },
        { key: 'under_verification', label: 'Scrutiny' },
        { key: 'inspection_scheduled', label: 'Inspection' },
        { key: 'under_final_review', label: 'Final Review' },
        { key: 'approved', label: 'Approved' }
    ];
    const getStepState = (stepKey) => {
        const order = ['draft', 'submitted', 'under_verification', 'inspection_scheduled', 'under_final_review', 'approved'];
        const currentIndex = order.indexOf(app.status === 'query_raised' ? 'under_verification' :
            app.status === 'inspection_completed' ? 'under_final_review' :
                app.status === 'documents_resubmitted' ? 'under_verification' :
                    app.status);
        const stepIndex = order.indexOf(stepKey);
        if (app.status === 'rejected')
            return 'failed';
        if (stepIndex < currentIndex || app.status === 'approved')
            return 'completed';
        if (stepIndex === currentIndex)
            return 'active';
        return 'upcoming';
    };
    return (<div className="space-y-6">
      
      {/* Top Bar & App Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBackToList} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer" title="Back to all">
            <ArrowLeft className="w-4 h-4"/>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-900 border border-blue-200">
                {app.applicationNumber}
              </span>
              <h2 className="font-bold text-base text-slate-900">
                {approval?.approvalName}
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Department: {department?.name} · Applied: {app.submissionDate || 'In Draft'}
            </p>
          </div>
        </div>

        {/* Quick App Select */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Switch Application:</label>
          <select value={activeAppId} onChange={e => setActiveAppId(e.target.value)} className="p-1.5 border border-slate-300 rounded-md text-xs bg-white font-mono">
            {applications.map(a => (<option key={a.id} value={a.id}>
                {a.applicationNumber} ({a.status.replace('_', ' ')})
              </option>))}
          </select>
        </div>
      </div>

      {/* SLA Status & Target Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-xs">
        <div>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Application Status</span>
          <Badge tone={applicationStatusTone(app.status)} className="mt-1">
            {app.status.toUpperCase().replace('_', ' ')}
          </Badge>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Statutory SLA Target</span>
          <span className="font-mono text-xs font-bold text-white block mt-1">
            {app.targetSLADate ? new Date(app.targetSLADate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Pending Submission'}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {daysRemaining > 0 ? `${daysRemaining} working days left` : 'On track'}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Assigned Scrutiny Officer</span>
          <span className="font-bold text-xs text-white block mt-1">
            {app.assignedOfficerName || 'Under Nodal Allocation'}
          </span>
          <span className="text-[11px] text-slate-400">MAITRI Nodal Directorate</span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Dossier Risk Rating</span>
          <span className={`inline-block text-xs font-bold font-mono px-2 py-0.5 rounded-md mt-1 ${app.riskLevel === 'Low' ? 'text-emerald-400 bg-emerald-950/50' :
            app.riskLevel === 'Medium' ? 'text-amber-400 bg-amber-950/50' : 'text-red-400 bg-red-950/50'}`}>
            {app.riskLevel} Risk Profile
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5 truncate">{app.riskFactors[0]}</span>
        </div>
      </div>

      {/* Draft: upload required documents, then submit */}
      {app.status === 'draft' && (<div className="bg-white p-5 rounded-xl border border-amber-200 shadow-xs space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Complete &amp; Submit Application</h3>
          {(() => {
                const keys = approval?.requiredDocumentKeys || [];
                const have = new Set(documents.map(d => d.documentKey));
                const missing = keys.filter(k => !have.has(k));
                return (<>
                <div className="space-y-2">
                  {keys.map(k => (<div key={k} className="flex items-center justify-between gap-3 text-xs border border-slate-100 rounded-md p-2">
                      <span className="font-semibold text-slate-700">{k.replace(/_/g, ' ')}</span>
                      {have.has(k) ? (<span className="text-emerald-600 font-bold">✓ Uploaded</span>) : (<input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="text-[11px] max-w-[220px]" onChange={e => {
                                const f = e.target.files?.[0];
                                if (f)
                                    uploadDocument({ file: f, documentKey: k, name: k.replace(/_/g, ' '), category: 'Identity & Proof' });
                            }}/>)}
                    </div>))}
                </div>
                <button disabled={missing.length > 0 || submitting} onClick={async () => { setSubmitting(true); await submitApplication(app.id); setSubmitting(false); }} className="px-4 py-2 bg-blue-900 text-white rounded-md text-xs font-bold disabled:opacity-40 cursor-pointer">
                  {missing.length > 0 ? `Upload ${missing.length} more document(s) to submit` : submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </>);
            })()}
        </div>)}

      {/* Interactive Process Stepper */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-4">
          Statutory Clearance Milestones
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {statusSteps.map((step, idx) => {
            const state = getStepState(step.key);
            return (<div key={step.key} className={`p-3 rounded-lg border text-center text-xs transition-colors ${state === 'completed'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    : state === 'active'
                        ? 'border-blue-900 bg-blue-50/70 text-blue-950 font-bold shadow-2xs'
                        : 'border-slate-100 bg-slate-50 text-slate-500'}`}>
                <div className="font-mono text-[10px] text-slate-500 mb-1">0{idx + 1}</div>
                <div className="font-semibold text-xs">{step.label}</div>
                <div className="text-[10px] mt-1">
                  {state === 'completed' && <span className="text-emerald-700 font-bold">✓ Cleared</span>}
                  {state === 'active' && <span className="text-blue-800 font-bold">● Active</span>}
                  {state === 'upcoming' && <span className="text-slate-500">Pending</span>}
                </div>
              </div>);
        })}
        </div>
      </div>

      {/* Critical Query Resolution Section (Section 14 & 39 of user prompt) */}
      {appQueries.length > 0 && (<div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-900"/>
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                Official Department Clarification Query Loop
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {appQueries.filter(q => !q.isResolved).length} Active Query Pending
            </span>
          </div>

          <div className="p-4 space-y-4">
            {appQueries.map(qry => (<div key={qry.id} className={`p-4 rounded-lg border space-y-3 ${qry.isResolved
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-red-200 bg-red-50/30'}`}>
                {/* Officer Query Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-900 text-white font-bold text-[10px] flex items-center justify-center">
                      OFF
                    </span>
                    <div>
                      <span className="font-bold text-xs text-slate-900">{qry.officerName}</span>
                      <span className="text-[10px] text-slate-500 ml-2 font-mono">Raised: {qry.raisedDate}</span>
                    </div>
                  </div>
                  <Badge tone={qry.isResolved ? 'success' : 'danger'}>
                    {qry.isResolved ? 'RESOLVED' : `RESPONSE DUE BY ${qry.deadlineDate}`}
                  </Badge>
                </div>

                <div className="text-xs text-slate-800 bg-white p-3 rounded-md border border-slate-200 space-y-1">
                  <p className="font-bold text-slate-900">{qry.subject}</p>
                  <p className="text-slate-700 leading-relaxed">{qry.queryText}</p>
                </div>

                {/* If applicant already responded */}
                {qry.applicantResponse ? (<div className="bg-emerald-50/70 p-3 rounded-md border border-emerald-200 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-emerald-900 font-bold">
                      <span>✓ Clarification Submitted by Applicant ({qry.applicantResponse.responseDate})</span>
                    </div>
                    <p className="text-slate-800">{qry.applicantResponse.responseText}</p>
                    {qry.applicantResponse.attachedDocumentName && (<div className="flex items-center gap-1.5 text-[11px] text-blue-900 font-semibold pt-1">
                        <Paperclip className="w-3.5 h-3.5"/>
                        <span>Attached File: {qry.applicantResponse.attachedDocumentName}</span>
                      </div>)}
                  </div>) : (
                /* Interactive Response Form */
                <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">
                        Submit Official Clarification & Supporting Document
                      </span>
                      <span className="text-[10px] text-slate-500">Statutory SLA will resume upon submission</span>
                    </div>

                    <textarea rows={3} value={responseQueryText} onChange={e => setResponseQueryText(e.target.value)} placeholder="Explain how the query is addressed, citing revised blueprint, structural certification, or site adjustments..." className="w-full p-2 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-900"/>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-3.5 h-3.5 text-slate-500"/>
                        <span className="text-xs text-slate-600">Attach Document:</span>
                        <select value={selectedResponseDocId} onChange={e => setSelectedResponseDocId(e.target.value)} className="p-1 border border-slate-300 rounded-md text-xs bg-slate-50">
                          <option value="doc_arch_04">Factory_Layout_Plan_Chakan_Unit_Rev4_Certified.pdf</option>
                          <option value="doc_pan_01">Company_PAN_Card.pdf</option>
                          <option value="doc_fire_layout">Fire_Hydrant_Isometric_Layout_Approved.pdf</option>
                        </select>
                      </div>

                      <button onClick={() => handleSendClarification(qry.id)} className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors">
                        <Send className="w-3.5 h-3.5"/>
                        <span>Submit Response to Department</span>
                      </button>
                    </div>
                  </div>)}
              </div>))}
          </div>
        </div>)}

      {/* Field Inspection Details (if scheduled) */}
      {appInspection && (<div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600"/>
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                Statutory On-Site Inspection ({appInspection.inspectionNumber})
              </h3>
            </div>
            <Badge tone={appInspection.status === 'completed' ? 'success' : 'warning'}>
              {appInspection.status.toUpperCase()}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-md border border-slate-100">
              <span className="text-[10px] text-slate-500 block">Scheduled Date & Slot</span>
              <span className="font-bold text-slate-800">{appInspection.scheduledDate} ({appInspection.scheduledTimeSlot})</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-md border border-slate-100">
              <span className="text-[10px] text-slate-500 block">Assigned Inspector</span>
              <span className="font-bold text-slate-800">{appInspection.assignedInspectorName}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-md border border-slate-100">
              <span className="text-[10px] text-slate-500 block">Compliance Audit Result</span>
              <span className="font-bold text-emerald-700">{appInspection.overallComplianceOutcome || 'Awaiting field visit'}</span>
            </div>
          </div>
        </div>)}

      {/* Attached Documents Vault Records */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">
          Attached Compliance Dossier Records ({attachedDocs.length})
        </h3>

        <div className="divide-y divide-slate-100">
          {attachedDocs.map(doc => (<div key={doc.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-blue-900 shrink-0"/>
                <div>
                  <span className="font-semibold text-slate-900">{doc.name}</span>
                  <span className="text-[11px] text-slate-500 ml-2 font-mono">{doc.fileName} ({doc.fileSize})</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge tone={documentStatusTone(doc.verificationStatus)} className="font-normal">
                  {doc.verificationStatus.toUpperCase().replace('_', ' ')}
                </Badge>
              </div>
            </div>))}
        </div>
      </div>

      {/* Immutable Audit Log History */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">
          Immutable Application Event Log
        </h3>

        <div className="space-y-2">
          {app.history.map(item => (<div key={item.id} className="text-xs flex items-start gap-3 p-2 rounded-md hover:bg-slate-50">
              <span className="font-mono text-[10px] text-slate-500 whitespace-nowrap">{item.timestamp}</span>
              <div>
                <span className="font-bold text-slate-800">{item.action}</span>
                <span className="text-slate-500 text-[11px] ml-2">by {item.actorName} ({item.actorRole})</span>
                <p className="text-slate-600 text-[11px] mt-0.5">{item.details}</p>
              </div>
            </div>))}
        </div>
      </div>

    </div>);
};
