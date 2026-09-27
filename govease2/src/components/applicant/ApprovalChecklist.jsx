import React, { useState } from 'react';
import { ChevronRight, Info, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { evaluateRequiredApprovals } from '../../services/rulesEngine';
import { Badge, applicationStatusTone } from '../common/Badge';
export const ApprovalChecklist = ({ onSelectApplication, onNavigateToVault }) => {
    const { business, approvalTypes, documents, applications, createApplication } = useApp();
    const [activeFilter, setActiveFilter] = useState('all');
    const [selectedApprovalDetail, setSelectedApprovalDetail] = useState(null);
    const evaluatedList = evaluateRequiredApprovals(business, approvalTypes, documents)
        .filter(e => e.confidence !== 'Not Applicable');
    const filteredList = evaluatedList.filter(item => {
        const existingApp = applications.find(a => a.approvalTypeId === item.approval.id);
        if (activeFilter === 'mandatory')
            return item.isPreOperationMandatory;
        if (activeFilter === 'ready')
            return item.readinessStatus === 'Ready to Submit';
        if (activeFilter === 'in_progress')
            return existingApp && existingApp.status !== 'approved';
        return true;
    });
    const handleStartApplication = async (approvalId) => {
        try {
            const app = await createApplication(approvalId);
            onSelectApplication(app.id);
        }
        catch (e) {
            alert(e.message || 'Could not create application');
        }
    };
    return (<div className="space-y-4">
      
      {/* Top Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-3">
        <div>
          <h3 className="font-bold text-base text-slate-900">
            Personalized Statutory Clearances Checklist
          </h3>
          <p className="text-xs text-slate-500">
            Computed by VyaparSetu Rules Engine for {business.businessName} ({business.industrySector}, {business.environmentalCategory} Category)
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { id: 'all', label: `All Evaluated (${evaluatedList.length})` },
            { id: 'mandatory', label: 'Mandatory Pre-Op' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'ready', label: 'Ready to Submit' }
        ].map(tab => (<button key={tab.id} onClick={() => setActiveFilter(tab.id)} className={`px-3 py-1.5 rounded-md font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap ${activeFilter === tab.id
                ? 'bg-blue-900 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>
              {tab.label}
            </button>))}
        </div>
      </div>

      {/* Grid of Approvals */}
      <div className="space-y-3">
        {filteredList.map(item => {
            const existingApp = applications.find(a => a.approvalTypeId === item.approval.id);
            const isApproved = existingApp?.status === 'approved';
            const isQueryRaised = existingApp?.status === 'query_raised';
            return (<div key={item.approval.id} className={`p-4 rounded-xl border transition-all ${isQueryRaised
                    ? 'border-red-300 bg-red-50/30'
                    : isApproved
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : existingApp
                            ? 'border-blue-200 bg-white shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                {/* Left Info */}
                <div className="space-y-2 flex-1">
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {item.approval.shortCode}
                    </span>

                    <h4 className="font-bold text-sm text-slate-900">
                      {item.approval.approvalName}
                    </h4>

                    {item.isPreOperationMandatory && (<span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                        Mandatory Pre-Operation
                      </span>)}

                    {existingApp && (<Badge tone={applicationStatusTone(existingApp.status)}>
                        {existingApp.status.toUpperCase().replace('_', ' ')}
                      </Badge>)}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.approval.description}
                  </p>

                  {/* Statutory Reason */}
                  <div className="flex items-start gap-1.5 text-[11px] text-slate-700 bg-slate-50 p-2 rounded-md border border-slate-100">
                    <Info className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5"/>
                    <div>
                      <span className="font-semibold text-slate-900">Statutory Trigger: </span>
                      {item.reasons.join(' ')}
                    </div>
                  </div>

                  {/* Meta Specs: Department, SLA, Fees, Legal Act */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                    <span>
                      <strong>SLA:</strong> {item.approval.processingSLADays} Statutory Working Days
                    </span>
                    <span>•</span>
                    <span>
                      <strong>Govt Fee:</strong> {item.approval.estimatedFeesText || `₹${item.approval.statutoryFeeINR.toLocaleString('en-IN')}`}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-slate-600">
                      {item.approval.legalActReference}
                    </span>
                  </div>

                </div>

                {/* Right Action & Readiness */}
                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 gap-3 shrink-0">
                  
                  {/* Readiness status */}
                  <div className="text-left lg:text-right">
                    <span className="text-[11px] text-slate-500 block">Dossier Readiness</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-bold text-slate-800">
                        {item.availableDocumentsCount} / {item.approval.requiredDocumentKeys.length} Docs
                      </span>
                      <span className="text-[11px] font-semibold text-blue-700">
                        ({item.readinessPercentage}%)
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedApprovalDetail(item)} className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md font-medium cursor-pointer" title="View Legal Citation & Gazette Reference">
                      Legal Details
                    </button>

                    {existingApp ? (<button onClick={() => onSelectApplication(existingApp.id)} className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs ${existingApp.status === 'query_raised'
                        ? 'bg-red-700 hover:bg-red-600 text-white'
                        : 'bg-blue-900 hover:bg-blue-800 text-white'}`}>
                        <span>{existingApp.status === 'query_raised' ? 'Respond to Query' : 'View Application'}</span>
                        <ChevronRight className="w-3.5 h-3.5"/>
                      </button>) : (<button onClick={() => handleStartApplication(item.approval.id)} className="px-3 py-1.5 rounded-md text-xs font-semibold bg-blue-900 hover:bg-blue-800 text-white flex items-center gap-1 cursor-pointer transition-colors shadow-2xs">
                        <Plus className="w-3.5 h-3.5"/>
                        <span>Apply Online</span>
                      </button>)}
                  </div>

                </div>

              </div>
            </div>);
        })}
      </div>

      {/* Detailed Modal: Statutory Act & Gazette Detail */}
      {selectedApprovalDetail && (<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 border border-slate-200 shadow-xl space-y-4">
            
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  {selectedApprovalDetail.approval.shortCode}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedApprovalDetail.approval.approvalName}
                </h3>
              </div>
              <button onClick={() => setSelectedApprovalDetail(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer p-1">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div>
                <span className="font-bold text-slate-900 block mb-1">Legal Mandate & Statutory Gazette:</span>
                <p className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono text-[11px] leading-relaxed">
                  {selectedApprovalDetail.approval.legalActReference}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-1">Detailed Evaluation Rationale:</span>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  {selectedApprovalDetail.reasons.map((r, i) => (<li key={i}>{r}</li>))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-100">
                  <span className="font-bold text-blue-950 block">Statutory Processing SLA:</span>
                  <span className="text-blue-900 font-mono">{selectedApprovalDetail.approval.processingSLADays} Working Days (RTSA Act 2013)</span>
                </div>
                <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-100">
                  <span className="font-bold text-blue-950 block">Official Application Fee:</span>
                  <span className="text-blue-900 font-mono">{selectedApprovalDetail.approval.estimatedFeesText || `₹${selectedApprovalDetail.approval.statutoryFeeINR.toLocaleString('en-IN')}`}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-1">Prerequisites & Parallel Clearances:</span>
                <div className="text-[11px] text-slate-600 space-y-1">
                  <p>• <strong>Upstream Prerequisites:</strong> {selectedApprovalDetail.prerequisiteNames.length > 0 ? selectedApprovalDetail.prerequisiteNames.join(', ') : 'None (Independent Base Clearance)'}</p>
                  <p>• <strong>Parallel Approvals:</strong> {selectedApprovalDetail.parallelNames.length > 0 ? selectedApprovalDetail.parallelNames.join(', ') : 'None'}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-end gap-2">
              <button onClick={() => setSelectedApprovalDetail(null)} className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer">
                Close
              </button>
              <button onClick={() => {
                const apprId = selectedApprovalDetail.approval.id;
                setSelectedApprovalDetail(null);
                handleStartApplication(apprId);
            }} className="px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-xs font-semibold text-white cursor-pointer shadow-xs">
                Proceed to Online Application
              </button>
            </div>

          </div>
        </div>)}

    </div>);
};
