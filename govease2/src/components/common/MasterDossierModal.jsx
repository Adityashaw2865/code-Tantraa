import React, { useState } from 'react';
import { X, Printer, ShieldCheck, CheckCircle2, Layers, Landmark, BadgeCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
export const MasterDossierModal = ({ isOpen, onClose }) => {
    const { business, applications, licences, documents } = useApp();
    const [activeSection, setActiveSection] = useState('all');
    const [isExporting, setIsExporting] = useState(false);
    if (!isOpen)
        return null;
    const handlePrint = () => {
        setIsExporting(true);
        setTimeout(() => {
            window.print();
            setIsExporting(false);
        }, 400);
    };
    return (<div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-4xl my-6 overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Layers className="w-6 h-6"/>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-white tracking-tight">
                  Master Industrial Regulatory Dossier
                </h3>
                <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                  OFFICIAL BANK & BOARD BUNDLE
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Government of Maharashtra · MAITRI Single Window Certified Comprehensive Clearance Record
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} disabled={isExporting} className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm" title="Print or Save as PDF">
              <Printer className="w-3.5 h-3.5"/>
              <span>{isExporting ? 'Compiling Dossier...' : 'Export / Print PDF'}</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer">
              <X className="w-5 h-5"/>
            </button>
          </div>
        </div>

        {/* Dossier Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
          
          {/* Institutional Cover Card */}
          <div className="bg-white border-2 border-slate-300 rounded-xl p-6 shadow-xs relative overflow-hidden">
            {/* Watermark */}
            <div className="absolute right-4 bottom-2 text-slate-100 font-extrabold text-7xl select-none pointer-events-none opacity-40">
              MAHARASHTRA
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
              <div>
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest block">
                  DOSSIER REF: MH-DOS-2026-CHAKAN-0042
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-0.5">
                  {business?.businessName || 'Business'}
                </h2>
                <p className="text-xs text-slate-600">
                  Plot A-14, Chakan Industrial Area, Phase II, Pune, Maharashtra - 410501
                </p>
              </div>

              <div className="text-left sm:text-right font-mono text-xs text-slate-600 space-y-0.5">
                <p><span className="text-slate-400">PAN:</span> <span className="font-bold text-slate-900">AAACS7842M</span></p>
                <p><span className="text-slate-400">GSTIN:</span> <span className="font-bold text-slate-900">27AAACS7842M1Z8</span></p>
                <p><span className="text-slate-400">Udyam No:</span> <span className="font-bold text-slate-900">UDYAM-MH-26-0048192</span></p>
                <p><span className="text-slate-400">Compiled On:</span> <span className="font-bold text-slate-900">22 Sep 2026</span></p>
              </div>
            </div>

            {/* Quick Status Bar */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Total Clearances</span>
                <span className="font-bold text-emerald-900 text-sm">5 Mandated (3 Active, 2 In-Progress)</span>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Treasury Fees Paid</span>
                <span className="font-bold text-blue-900 text-sm">₹39,500 via MahaGRAS</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Land Title Clearance</span>
                <span className="font-bold text-amber-900 text-sm">Mahabhulekh 7/12 Verified</span>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-2.5">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">RTSA 2015 SLA Health</span>
                <span className="font-bold text-purple-900 text-sm">100% On-Time Record</span>
              </div>
            </div>
          </div>

          {/* Section 1: Verified Corporate & Land Identity */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-blue-700"/>
                <span>Section 1: Verified Corporate & Land Title Portfolio</span>
              </h4>
              <span className="text-[10px] bg-blue-50 text-blue-800 font-semibold px-2 py-0.5 rounded-md border border-blue-200">
                DIGILOCKER & MAHABHULEKH VERIFIED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <span className="font-semibold text-slate-700 block">MCA Certificate of Incorporation</span>
                <span className="text-slate-500 text-[11px] block mt-0.5">CIN: U15100MH2024PTC291840</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 mt-2">
                  <CheckCircle2 className="w-3 h-3"/> Registrar of Companies (Pune)
                </span>
              </div>

              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <span className="font-semibold text-slate-700 block">Mahabhulekh 7/12 Land Extract</span>
                <span className="text-slate-500 text-[11px] block mt-0.5">Survey No. 142/2A, Khed Taluka, Pune</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 mt-2">
                  <CheckCircle2 className="w-3 h-3"/> Revenue Dept, Maharashtra
                </span>
              </div>

              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <span className="font-semibold text-slate-700 block">MIDC Plot Allotment Letter</span>
                <span className="text-slate-500 text-[11px] block mt-0.5">Plot A-14 (0.85 Acres / 37,000 sq ft)</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 mt-2">
                  <CheckCircle2 className="w-3 h-3"/> MIDC Regional Office (Pune)
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Statutory Clearances & Permissions Ledger */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700"/>
                <span>Section 2: Statutory Clearances & Digital Licenses Ledger</span>
              </h4>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-md border border-emerald-200">
                LEGAL COMPLIANCE READY
              </span>
            </div>

            <div className="space-y-2">
              {applications.map((app) => (<div key={app.id} className="border border-slate-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{app.applicationNumber}</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-semibold text-slate-800">{app.approvalTypeId}</span>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Target SLA: <span className="font-mono font-medium text-slate-700">{app.targetSLADate}</span> | 
                      {app.licenceNumber && (<span className="ml-1 text-emerald-800 font-bold">Licence No: {app.licenceNumber}</span>)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${app.status === 'approved'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : app.status === 'under_verification'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : app.status === 'query_raised'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-800 border border-slate-200'}`}>
                      {app.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>))}
            </div>
          </div>

          {/* Section 3: MahaGRAS Cyber Treasury Challan Receipts */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-amber-700"/>
                <span>Section 3: MahaGRAS Treasury Challan Audit Trail</span>
              </h4>
              <span className="text-[10px] bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded-md border border-amber-200">
                FINANCE DEPT, GOVT OF MAHARASHTRA
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-1">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-slate-500 font-semibold">GRN: GRN-MH-2026-90421</span>
                  <span className="text-emerald-700 font-bold">PAID</span>
                </div>
                <div className="text-sm font-bold text-slate-900">₹14,500.00</div>
                <p className="text-[11px] text-slate-600">DISH Factory Licence Statutory Scrutiny Fee</p>
                <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-200">
                  Bank CIN: SBIN26090510429 | Date: 05 Sep 2026
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-1">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-slate-500 font-semibold">GRN: GRN-MH-2026-31980</span>
                  <span className="text-emerald-700 font-bold">PAID</span>
                </div>
                <div className="text-sm font-bold text-slate-900">₹25,000.00</div>
                <p className="text-[11px] text-slate-600">MPCB Consent to Establish (Orange Category)</p>
                <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-200">
                  Bank CIN: HDFC26091244810 | Date: 12 Sep 2026
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Certification Statement */}
          <div className="bg-slate-900 text-slate-200 rounded-xl p-5 text-xs space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <ShieldCheck className="w-4 h-4"/>
              <span>STATUTORY CERTIFICATION OF ACCURACY & ENFORCEABILITY</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              This Master Dossier is electronically generated under Section 6 of the Information Technology Act, 2000 and Section 12 of the Maharashtra Right to Public Services Act, 2015. All clearings, challan receipts, and digital approvals contained herein have been verified against authoritative State Databases (MAITRI, MahaGRAS, Bhunaksha, and MPCB e-Samadhan). No physical ink signature is required.
            </p>
            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
              <span>Cryptographic Fingerprint: SHA256: 7e99a19c5b4d4a821e29</span>
              <span>MAITRI State Single Window Authority, Mumbai</span>
            </div>
          </div>

        </div>

        {/* Modal Bottom Bar */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Prepared for Commercial Banks, Statutory Auditors & Board Review</span>
          <button onClick={onClose} className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-md transition-colors cursor-pointer">
            Close Dossier
          </button>
        </div>

      </div>
    </div>);
};
