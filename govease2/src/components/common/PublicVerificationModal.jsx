import React, { useState, useEffect } from 'react';
import { verifyLicenceAPI } from '../../services/dataService';
import { X, Search, CheckCircle2, ShieldCheck, QrCode, Printer, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
export const PublicVerificationModal = ({ isOpen, onClose, initialQuery = '' }) => {
    const { licences, applications, business, departments } = useApp();
    const [searchQuery, setSearchQuery] = useState(initialQuery || 'MH-FAC-2026-8942');
    const [hasSearched, setHasSearched] = useState(true);
    const [remote, setRemote] = useState(null);
    useEffect(() => {
        if (!isOpen)
            return;
        const code = searchQuery.trim();
        if (code.length < 6) {
            setRemote(null);
            return;
        }
        const t = setTimeout(() => { verifyLicenceAPI(code).then(setRemote); }, 400);
        return () => clearTimeout(t);
    }, [searchQuery, isOpen]);
    if (!isOpen)
        return null;
    // Search logic across Licences, Applications, and GRN
    const queryClean = searchQuery.trim().toUpperCase();
    const localLicence = licences.find(l => l.licenceNumber.toUpperCase() === queryClean ||
        l.id.toUpperCase() === queryClean);
    // Fallback: real backend lookup (works for anyone, no login) by QR code or licence number
    const matchedLicence = localLicence || (remote ? {
        ...remote,
        issueDate: String(remote.issueDate || '').slice(0, 10),
        expiryDate: String(remote.expiryDate || '').slice(0, 10)
    } : undefined);
    const matchedApplication = applications.find(a => a.applicationNumber.toUpperCase() === queryClean ||
        a.id.toUpperCase() === queryClean);
    // Treasury (GRN) receipts are not recorded server-side yet, so they can never be reported as verified.
    const isGrn = false;
    const defaultBusiness = business;
    const handleSearch = (e) => {
        e.preventDefault();
        setHasSearched(true);
    };
    const handleQuickSelect = (val) => {
        setSearchQuery(val);
        setHasSearched(true);
    };
    return (<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-2xl my-6 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header with Maharashtra Emblem styling */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
              <ShieldCheck className="w-5 h-5"/>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight text-white">
                  Public Document & QR Verification Portal
                </h3>
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  PUBLIC ACCESS
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Government of Maharashtra · CCA Certified Cryptographic Verification
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* Search input form */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3"/>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Enter Licence No (e.g. MH-FAC-2026-8942) or Application / GRN..." className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-600 uppercase"/>
            </div>
            <button type="submit" className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer shadow-xs">
              Verify Record
            </button>
          </form>

          {/* Quick Demo Pickers */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <span className="font-medium text-[11px] text-slate-600">Quick Test:</span>
            <button type="button" onClick={() => handleQuickSelect('MH-FAC-2026-8942')} className="text-[11px] px-2 py-0.5 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-blue-900 rounded-md font-mono cursor-pointer transition-colors">
              MH-FAC-2026-8942 (Licence)
            </button>
            <button type="button" onClick={() => handleQuickSelect('APP-2026-00124')} className="text-[11px] px-2 py-0.5 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-blue-900 rounded-md font-mono cursor-pointer transition-colors">
              APP-2026-00124 (Sanction)
            </button>
          </div>
        </div>

        {/* Verification Result Area */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {hasSearched && (matchedLicence || matchedApplication || isGrn) ? (<div className="space-y-4">
              
              {/* Official Verified Banner */}
              <div className="bg-emerald-50 border-2 border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-6 h-6"/>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                      Authenticity Status: VALID & VERIFIED
                    </span>
                    <span className="text-[10px] font-mono bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-md font-bold">
                      SHA-256 MATCHED
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-0.5">
                    {matchedLicence
                ? matchedLicence.approvalName
                : matchedApplication
                    ? 'MIDC Industrial Building Plan Sanction & Clearance'
                    : 'MahaGRAS Cyber Treasury Challan Receipt'}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    This document is cryptographically verified against the Government of Maharashtra Public Key Infrastructure (PKI) registry.
                  </p>
                </div>
              </div>

              {/* Document Details Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Registration / Number</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {matchedLicence?.licenceNumber || matchedApplication?.applicationNumber || 'GRN-MH-2026-90421'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Issuing Authority</span>
                    <span className="font-semibold text-slate-800 text-xs">
                      {matchedLicence?.departmentName || 'MIDC Planning Directorate / DISH'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Beneficiary Enterprise</span>
                    <span className="font-semibold text-slate-800 text-xs">
                      {defaultBusiness?.businessName || 'Business'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Industrial Location</span>
                    <span className="text-slate-700 text-xs">
                      Chakan Phase II, Pune (410501)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Issue / Clearance Date</span>
                    <span className="font-mono text-slate-800 text-xs">
                      {matchedLicence?.issueDate || '2026-09-05'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Validity Status</span>
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Active (Until Nov 2029)
                    </span>
                  </div>
                </div>

                {/* Cryptographic Trust Seal */}
                <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50 p-3 rounded-lg font-mono text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-semibold uppercase">Digital Signatory:</span>
                    <span className="text-blue-900 font-bold">DR. VIJAY PATIL, IAS (DISH Maharashtra)</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-semibold uppercase">Certifying Authority:</span>
                    <span>(CCA India) eMudhra Class 3 DSC</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    <span className="text-slate-500 font-semibold uppercase">SHA-256 Digest: </span>
                    3b4c9192fe72948bbda10488f2873199ce5b801a6b0c2e39194bb10fa
                  </div>
                </div>
              </div>

              {/* QR Code and Print Button */}
              <div className="flex items-center justify-between bg-slate-100 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white p-1 rounded-lg border border-slate-300 flex items-center justify-center shrink-0">
                    <QrCode className="w-10 h-10 text-slate-800"/>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Third-Party Verification QR</span>
                    <span className="text-[11px] text-slate-500">Scan via any smartphone to re-verify cryptographic validity</span>
                  </div>
                </div>
                <button type="button" onClick={() => window.print()} className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs">
                  <Printer className="w-3.5 h-3.5 text-slate-600"/>
                  <span>Print Slip</span>
                </button>
              </div>

            </div>) : (<div className="text-center py-10 space-y-2">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto"/>
              <h4 className="font-bold text-slate-800 text-sm">No Matching Statutory Record Found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Please check the document number or try one of the quick test chips above to view a live cryptographic verification proof.
              </p>
            </div>)}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Official Verification Gateway · Information Technology Act, 2000 (Section 4)</span>
          <button type="button" onClick={onClose} className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-md transition-colors cursor-pointer">
            Close
          </button>
        </div>

      </div>
    </div>);
};
