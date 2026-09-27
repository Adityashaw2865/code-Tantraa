import React, { useState, useEffect } from 'react';
import { ClipboardCheck, MapPin, Camera, CheckCircle2, XCircle, Send } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RoleHeaderBanner } from '../common/RoleHeaderBanner';
export const InspectorDashboard = () => {
    const { inspections, inspectorUpdateChecklist, currentUser } = useApp();
    const [selectedInsId, setSelectedInsId] = useState(inspections[0]?.id || '');
    const selectedIns = inspections.find(i => i.id === selectedInsId) || inspections[0];
    const [checklistState, setChecklistState] = useState(selectedIns?.checklist || []);
    const [remarks, setRemarks] = useState(selectedIns?.inspectorRemarks || '');
    const [outcome, setOutcome] = useState(selectedIns?.overallComplianceOutcome || 'Satisfactory / Recommended');
    const [photoCount, setPhotoCount] = useState(selectedIns?.evidencePhotosCount || 4);
    // Inspections arrive from the server after mount; load the first one when they do.
    useEffect(() => {
        if (!selectedInsId && inspections[0])
            handleSelectInspection(inspections[0].id);
    }, [inspections.length]);
    // Sync when selected inspection changes
    const handleSelectInspection = (id) => {
        setSelectedInsId(id);
        const ins = inspections.find(i => i.id === id);
        if (ins) {
            setChecklistState(ins.checklist);
            setRemarks(ins.inspectorRemarks || '');
            if (ins.overallComplianceOutcome)
                setOutcome(ins.overallComplianceOutcome);
        }
    };
    const handleToggleCompliance = (itemId, compliant) => {
        setChecklistState(prev => prev.map(item => {
            if (item.id === itemId) {
                return { ...item, isCompliant: compliant };
            }
            return item;
        }));
    };
    const handleRemarkChange = (itemId, text) => {
        setChecklistState(prev => prev.map(item => {
            if (item.id === itemId) {
                return { ...item, findingsRemarks: text };
            }
            return item;
        }));
    };
    const handleSubmitAuditReport = () => {
        if (!selectedIns)
            return;
        inspectorUpdateChecklist(selectedIns.id, checklistState, remarks, outcome);
        alert(`Inspection report for ${selectedIns.inspectionNumber} has been officially recorded and submitted to Department Officer.`);
    };
    return (<div className="space-y-6">
      
      {/* Inspector Workspace Banner */}
      <RoleHeaderBanner role="inspector">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30">
                FIELD INSPECTOR PORTAL
              </span>
              <span className="text-xs text-slate-400">Mobile On-Site Audit System</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              Field Inspector {currentUser.name}
            </h2>
            <p className="text-xs text-slate-400">State Fire & Safety Inspection Wing</p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
              Assigned Audits: {inspections.length}
            </span>
          </div>
        </div>

        {/* Inspections Selection Bar */}
        <div className="flex items-center gap-3 pt-3 overflow-x-auto text-xs">
          {inspections.length === 0 ? (<div className="px-3 py-2 text-white/60 text-xs">No inspections scheduled for you right now.</div>) : inspections.map(ins => (<button key={ins.id} onClick={() => handleSelectInspection(ins.id)} className={`px-3 py-1.5 rounded-lg border font-mono font-semibold cursor-pointer transition-colors whitespace-nowrap ${ins.id === selectedIns?.id
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}>
              {ins.inspectionNumber} ({ins.status.toUpperCase()})
            </button>))}
        </div>
      </RoleHeaderBanner>

      {/* Selected Inspection Card & Checklist */}
      {selectedIns && (<div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-6">
          
          {/* Site & Assignment Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  {selectedIns.inspectionNumber}
                </span>
                <h3 className="font-bold text-base text-slate-900">
                  {selectedIns.businessName}
                </h3>
              </div>
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0"/>
                <span>{selectedIns.siteAddress}</span>
              </p>
            </div>

            <div className="text-left sm:text-right text-xs">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">Inspection Date</span>
              <span className="font-bold text-slate-900 font-mono">{selectedIns.scheduledDate}</span>
              <span className="text-slate-500 block">{selectedIns.scheduledTimeSlot}</span>
            </div>
          </div>

          {/* Interactive Checklist */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-amber-700"/>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  Statutory Field Checklist (NBC 2016 & Factories Act)
                </h4>
              </div>
              <span className="text-xs text-slate-500">
                {checklistState.filter(c => c.isCompliant === true).length} of {checklistState.length} verified
              </span>
            </div>

            <div className="space-y-3">
              {checklistState.map((chk, idx) => (<div key={chk.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-500">0{idx + 1}.</span>
                        <span className="font-bold text-slate-900">{chk.itemText}</span>
                      </div>
                      <p className="text-[11px] text-blue-900 font-mono font-medium pl-5">
                        Statutory Reference: {chk.standardReference}
                      </p>
                    </div>

                    {/* Compliant Toggles */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button type="button" onClick={() => handleToggleCompliance(chk.id, true)} className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${chk.isCompliant === true
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}>
                        <CheckCircle2 className="w-3.5 h-3.5"/>
                        <span>Satisfactory</span>
                      </button>

                      <button type="button" onClick={() => handleToggleCompliance(chk.id, false)} className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${chk.isCompliant === false
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}>
                        <XCircle className="w-3.5 h-3.5"/>
                        <span>Deficient</span>
                      </button>
                    </div>
                  </div>

                  {/* Findings input */}
                  <div className="pt-2 pl-5">
                    <input type="text" value={chk.findingsRemarks || ''} onChange={e => handleRemarkChange(chk.id, e.target.value)} placeholder="Record exact meter readings, pressures, or field observations..." className="w-full p-2 border border-slate-300 rounded-md bg-white text-xs font-mono"/>
                  </div>
                </div>))}
            </div>
          </div>

          {/* Evidence Photos Section */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-slate-700"/>
                <span className="font-bold text-slate-900">Geo-Tagged Site Evidence Photographs</span>
              </div>
              <span className="font-mono text-slate-600">{photoCount} Photos Attached</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                'Underground_Water_Reservoir_120KL.jpg',
                'Yard_Hydrant_Standpost_Pressure_Test.jpg',
                'Optical_Smoke_Alarm_Loop_Panel.jpg',
                'Emergency_Exit_Panic_Bar_Check.jpg'
            ].map((pic, i) => (<div key={i} className="p-2 bg-white rounded-md border border-slate-200 text-center space-y-1">
                  <div className="h-16 bg-slate-100 rounded-md flex items-center justify-center text-slate-500">
                    <Camera className="w-6 h-6"/>
                  </div>
                  <p className="text-[10px] text-slate-600 font-mono truncate">{pic}</p>
                </div>))}
            </div>
          </div>

          {/* Final Outcome Recommendation */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
              Official Inspection Finding Recommendation
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {[
                'Satisfactory / Recommended',
                'Conditional Approval with Observations',
                'Non-Compliant / Re-inspection Mandated'
            ].map(opt => (<button key={opt} type="button" onClick={() => setOutcome(opt)} className={`p-3 rounded-lg border text-left font-bold cursor-pointer transition-colors ${outcome === opt
                    ? 'bg-blue-900 text-white border-blue-900 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                  {opt}
                </button>))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Field Inspection Report Remarks & Technical Findings
              </label>
              <textarea rows={3} value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Comprehensive summary of physical audit findings..." className="w-full p-2.5 border border-slate-300 rounded-md text-xs"/>
            </div>
          </div>

          {/* Submit Button */}
          <div className="border-t border-slate-100 pt-4 flex justify-end">
            <button onClick={handleSubmitAuditReport} className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs transition-colors">
              <Send className="w-3.5 h-3.5"/>
              <span>Sign & Submit Official Field Report to Department</span>
            </button>
          </div>

        </div>)}

    </div>);
};
