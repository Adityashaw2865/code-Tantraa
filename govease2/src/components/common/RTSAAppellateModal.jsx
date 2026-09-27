import React, { useState } from 'react';
import { X, Scale, CheckCircle2, AlertTriangle, Send, Gavel } from 'lucide-react';
import { useApp } from '../../context/AppContext';
export const RTSAAppellateModal = ({ isOpen, onClose, defaultAppId }) => {
    const { applications, business, submitGrievance } = useApp();
    const [selectedAppId, setSelectedAppId] = useState(defaultAppId || applications[2]?.id || applications[0]?.id || '');
    const [appellateLevel, setAppellateLevel] = useState('first');
    const [appealGrounds, setAppealGrounds] = useState('Officer query raised repeatedly contrary to Single Scrutiny Norms (Sec 8)');
    const [appealDescription, setAppealDescription] = useState('The architectural drawing Rev 2 with 1.45m stairwell width was uploaded adhering to MIDC industrial standards. Multiple queries have delayed the civil works beyond the 30-day statutory SLA window under RTSA 2015. Requesting deemed approval or urgent joint hearing.');
    const [reliefSought, setReliefSought] = useState('Immediate grant of Building Plan Sanction or personal hearing before the First Appellate Authority.');
    const [declaredTruthful, setDeclaredTruthful] = useState(true);
    const [submittedCase, setSubmittedCase] = useState(null);
    if (!isOpen)
        return null;
    const currentApp = applications.find(a => a.id === selectedAppId);
    const handleSubmitAppeal = (e) => {
        e.preventDefault();
        if (!declaredTruthful)
            return;
        const caseNum = `RTSA-APL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const hearingDate = new Date();
        hearingDate.setDate(hearingDate.getDate() + 14);
        const hearingDateStr = hearingDate.toISOString().slice(0, 10);
        const authorityName = appellateLevel === 'first'
            ? 'Dr. P. R. Khade, IAS (Joint Director of Industries & First Appellate Authority)'
            : 'Shri Deven Bharti, IAS (Divisional Commissioner & Second Appellate Authority)';
        submitGrievance({
            category: 'SLA Delay / Breach',
            subject: `[RTSA Statutory Appeal ${caseNum}] ${appealGrounds}`,
            description: `${appealDescription}\n\nRelief Sought: ${reliefSought}\nAuthority: ${authorityName}\nStatutory Hearing Scheduled: ${hearingDateStr}`,
            priority: 'Escalated to Secretary',
            relatedApplicationId: selectedAppId
        });
        setSubmittedCase({
            caseNumber: caseNum,
            hearingDate: hearingDateStr,
            authorityName
        });
    };
    return (<div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-2xl my-6 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <Scale className="w-6 h-6"/>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white tracking-tight">
                  RTSA Statutory Appellate Tribunal
                </h3>
                <span className="text-[10px] font-bold bg-red-500/30 text-red-300 px-2 py-0.5 rounded-md border border-red-500/40">
                  MAHARASHTRA ACT NO. XXXI OF 2015
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Maharashtra Right to Public Services Act (RTSA) · Section 8 & 9 Legal Appeal
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {submittedCase ? (
        /* Successful Appeal Submission Card */
        <div className="space-y-4">
              <div className="bg-emerald-50 border-2 border-emerald-500/40 rounded-xl p-5 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-7 h-7"/>
                </div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                  Statutory Appeal Formally Registered
                </span>
                <h3 className="text-xl font-black text-slate-900 font-mono">
                  {submittedCase.caseNumber}
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Your appeal has been assigned under Section 8 of RTSA 2015. The designated appellate officer has been served with statutory notice.
                </p>
              </div>

              {/* Hearing Notice Schedule */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Gavel className="w-4 h-4 text-red-700"/>
                    Notice of Statutory Hearing
                  </span>
                  <span className="font-mono text-[11px] bg-red-100 text-red-800 px-2 py-0.5 rounded-md font-bold">
                    30-Day Mandatory Disposal
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-400 block font-semibold">Appellate Authority:</span>
                    <span className="font-bold text-slate-900">{submittedCase.authorityName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">First Hearing Date:</span>
                    <span className="font-bold text-slate-900 font-mono">{submittedCase.hearingDate} (11:00 AM IST)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Hearing Venue:</span>
                    <span className="text-slate-700">Chamber of Joint Director of Industries, Pune</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Status:</span>
                    <span className="text-amber-700 font-bold">Summons Dispatched to Scrutiny Officer</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-center">
                <button type="button" onClick={onClose} className="px-6 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs">
                  Return to Dashboard
                </button>
              </div>
            </div>) : (
        /* Appeal Filing Form */
        <form onSubmit={handleSubmitAppeal} className="space-y-4 text-xs">
              
              {/* RTSA Legal Context Box */}
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"/>
                <div className="text-[11px] leading-relaxed">
                  <span className="font-bold">Legal Guarantee under RTSA 2015: </span>
                  Every business applicant has a statutory right to receive transparent clearances within the notified time limit (SLA). Officers causing willful delay are liable for disciplinary action and statutory penalties up to ₹5,000 under Section 10.
                </div>
              </div>

              {/* Appeal Level Switch */}
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setAppellateLevel('first')} className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${appellateLevel === 'first'
                ? 'border-blue-700 bg-blue-50/60 text-blue-950 font-bold'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                  <span className="block text-xs">First Appeal (Section 8)</span>
                  <span className="block text-[10px] text-slate-500 font-normal">Before Joint Director of Industries</span>
                </button>
                <button type="button" onClick={() => setAppellateLevel('second')} className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${appellateLevel === 'second'
                ? 'border-blue-700 bg-blue-50/60 text-blue-950 font-bold'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                  <span className="block text-xs">Second Appeal (Section 9)</span>
                  <span className="block text-[10px] text-slate-500 font-normal">Before Divisional Commissioner / Secretary</span>
                </button>
              </div>

              {/* Application Selector */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Select Aggrieved Application / Service:
                </label>
                <select value={selectedAppId} onChange={(e) => setSelectedAppId(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:outline-hidden">
                  {applications.map((app) => (<option key={app.id} value={app.id}>
                      {app.applicationNumber} — {app.approvalTypeId} (Current Status: {app.status})
                    </option>))}
                </select>
              </div>

              {/* Grounds of Appeal */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Grounds of Statutory Appeal:
                </label>
                <select value={appealGrounds} onChange={(e) => setAppealGrounds(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden">
                  <option value="SLA Time Limit Exceeded beyond 30 Statutory Days">
                    SLA Time Limit Exceeded beyond 30 Statutory Days (Deemed Clearance Default)
                  </option>
                  <option value="Officer query raised repeatedly contrary to Single Scrutiny Norms (Sec 8)">
                    Officer query raised repeatedly contrary to Single Scrutiny Norms (Sec 8)
                  </option>
                  <option value="Arbitrary rejection without providing statutory 7-day personal hearing notice">
                    Arbitrary rejection without providing statutory 7-day personal hearing notice
                  </option>
                  <option value="Physical On-Site inspection delayed causing commercial detriment">
                    Physical On-Site inspection delayed causing commercial detriment
                  </option>
                </select>
              </div>

              {/* Statement of Facts */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Statement of Facts & Evidence:
                </label>
                <textarea rows={3} value={appealDescription} onChange={(e) => setAppealDescription(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-hidden" placeholder="Summarize the chronological sequence of events..."/>
              </div>

              {/* Relief Sought */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Prayer / Relief Sought from Appellate Authority:
                </label>
                <input type="text" value={reliefSought} onChange={(e) => setReliefSought(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"/>
              </div>

              {/* Declaration Checkbox */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-start gap-2.5">
                <input type="checkbox" id="rtsa_declaration" checked={declaredTruthful} onChange={(e) => setDeclaredTruthful(e.target.checked)} className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-blue-900 focus:ring-blue-600 cursor-pointer"/>
                <label htmlFor="rtsa_declaration" className="text-[11px] text-slate-600 leading-normal cursor-pointer select-none">
                  I, the authorized representative of <strong className="text-slate-800">{business?.businessName || 'Business'}</strong>, solemnly declare under Section 10 of Maharashtra Act No. XXXI of 2015 that the statements made herein are true to my knowledge and submitted for statutory redressal.
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={!declaredTruthful} className="px-5 py-2 bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs">
                  <Send className="w-3.5 h-3.5"/>
                  <span>File Statutory RTSA Appeal</span>
                </button>
              </div>

            </form>)}

        </div>

        {/* Modal Bottom Bar */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>Statutory Authority: Maharashtra State Right to Public Services Commission</span>
          <span>Helpline: 1800-120-8040</span>
        </div>

      </div>
    </div>);
};
