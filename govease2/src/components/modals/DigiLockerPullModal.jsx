import React, { useState } from 'react';
import { FolderSync, CheckCircle2, ShieldCheck, FileCheck2, Sparkles, Database, Building, Zap, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
export const DigiLockerPullModal = ({ isOpen, onClose }) => {
    const { uploadDocument, business } = useApp();
    const [selectedDocs, setSelectedDocs] = useState({
        satbara_712: true,
        udyam_cert: true,
        pan_corp: true,
        msedcl_bill: true,
        gst_cert: true
    });
    const [pulling, setPulling] = useState(false);
    const [successCount, setSuccessCount] = useState(null);
    if (!isOpen)
        return null;
    const mockAvailableDocs = [
        {
            id: 'satbara_712',
            title: '7/12 Extract (Satbara Utara) — Mahabhulekh',
            issuer: 'Revenue & Forest Department, Govt. of Maharashtra',
            identifier: `${business.address || ''}, Dist. ${business.district || ''}`,
            docKey: 'doc_land_deed',
            category: 'Land & Building',
            badge: 'Mahabhulekh Digitally Signed (e-Ferfar)',
            date: '12 Jan 2026',
            icon: Building
        },
        {
            id: 'udyam_cert',
            title: 'MSME Udyam Registration Certificate',
            issuer: 'Ministry of Micro, Small and Medium Enterprises',
            identifier: business.udyamNumber || 'Not on file',
            docKey: 'doc_udyam',
            category: 'Statutory Identity',
            badge: 'DigiLocker Verified Credential',
            date: '04 Oct 2025',
            icon: ShieldCheck
        },
        {
            id: 'pan_corp',
            title: 'Company Permanent Account Number (PAN)',
            issuer: 'Income Tax Department, Directorate of Systems',
            identifier: business.panNumber || 'Not on file',
            docKey: 'doc_pan',
            category: 'Statutory Identity',
            badge: 'NSDL / e-Filing Authenticated',
            date: '15 Aug 2024',
            icon: FileCheck2
        },
        {
            id: 'msedcl_bill',
            title: 'HT Industrial Power Bill & Consumer Receipt',
            issuer: 'Maharashtra State Electricity Distribution Co. (MSEDCL)',
            identifier: `Premises: ${business.address || ''}`,
            docKey: 'doc_electricity_bill',
            category: 'Technical & Utilities',
            badge: 'MSEDCL Billing Gateway Sync',
            date: '01 Feb 2026',
            icon: Zap
        },
        {
            id: 'gst_cert',
            title: 'GST Registration Certificate (Form GST REG-06)',
            issuer: 'Goods and Services Tax Network (GSTN Maharashtra)',
            identifier: business.gstin || 'Not on file',
            docKey: 'doc_gst_reg',
            category: 'Statutory Identity',
            badge: 'GSTN Verified',
            date: '20 Sep 2024',
            icon: FileText
        }
    ];
    const handleToggle = (id) => {
        setSelectedDocs(prev => ({ ...prev, [id]: !prev[id] }));
    };
    const handleImport = () => {
        setPulling(true);
        let count = 0;
        setTimeout(() => {
            mockAvailableDocs.forEach(item => {
                if (selectedDocs[item.id]) {
                    uploadDocument({
                        name: `${item.title} [DigiLocker Verified]`,
                        category: item.category,
                        documentKey: item.docKey,
                        fileSize: '1.4 MB',
                        verificationStatus: 'verified',
                        verifiedBy: 'DigiLocker (Demo Mode)',
                        notes: `[Demo data - not a live DigiLocker record] Sample document representing ${item.issuer}. ID: ${item.identifier}`
                    });
                    count++;
                }
            });
            setPulling(false);
            setSuccessCount(count);
            setTimeout(() => {
                setSuccessCount(null);
                onClose();
            }, 1800);
        }, 1200);
    };
    return (<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 border border-slate-200 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5 text-amber-300"/>
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span>Fetch from DigiLocker & Mahabhulekh</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200">
                  Demo Mode
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Sample documents shown below - not a live pull from a government server
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer text-lg p-1">
            ✕
          </button>
        </div>

        {/* Demo-mode notice */}
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0"/>
          <p className="text-[11px] leading-relaxed">
            <strong>Demo Mode:</strong> this pulls realistic sample documents instead of calling a live government API. Real DigiLocker integration needs API Setu credentials (a Requester registration at apisetu.gov.in) - see <code className="font-mono">DIGILOCKER_CLIENT_ID</code> in <code className="font-mono">backend/.env.example</code>.
          </p>
        </div>

        {/* Benefits banner */}
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0"/>
          <p className="text-[11px] leading-relaxed">
            Documents pulled via DigiLocker are <strong>statutorily pre-verified</strong> under Information Technology Act 2000. Officers cannot raise rejection queries on verified digital signatures.
          </p>
        </div>

        {/* List of Available Verified Records */}
        <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
          {mockAvailableDocs.map(doc => {
            const Icon = doc.icon;
            const isChecked = selectedDocs[doc.id];
            return (<div key={doc.id} onClick={() => handleToggle(doc.id)} role="checkbox" aria-checked={isChecked} tabIndex={0} onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleToggle(doc.id);
                    }
                }} className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${isChecked
                    ? 'border-blue-500 bg-blue-50/50 shadow-2xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 opacity-70'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isChecked ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Icon className="w-4 h-4"/>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{doc.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{doc.issuer}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-[10px] text-blue-900 font-medium bg-white px-1.5 py-0.5 rounded-md border border-slate-200">
                        {doc.identifier}
                      </span>
                      <span className="text-[9px] text-emerald-700 font-bold bg-emerald-100/70 px-1.5 py-0.5 rounded-md">
                        {doc.badge}
                      </span>
                    </div>
                  </div>
                </div>

                <input type="checkbox" checked={isChecked} onChange={() => { }} className="w-4 h-4 text-blue-600 rounded-md border-slate-300 pointer-events-none"/>
              </div>);
        })}
        </div>

        {/* Success Alert */}
        {successCount !== null && (<div className="p-3 bg-emerald-100 border border-emerald-300 rounded-lg text-xs text-emerald-900 font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-700"/>
            <span>Success! {successCount} Verified Documents successfully added to your Document Vault.</span>
          </div>)}

        {/* Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            {Object.values(selectedDocs).filter(Boolean).length} documents selected
          </span>

          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium cursor-pointer">
              Cancel
            </button>

            <button disabled={pulling || Object.values(selectedDocs).filter(Boolean).length === 0} onClick={handleImport} className="px-4 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold flex items-center gap-2 cursor-pointer shadow-xs transition-colors">
              {pulling ? (<>
                  <Sparkles className="w-3.5 h-3.5 animate-spin"/>
                  <span>Syncing with DigiLocker...</span>
                </>) : (<>
                  <FolderSync className="w-3.5 h-3.5"/>
                  <span>Import Verified Documents</span>
                </>)}
            </button>
          </div>
        </div>

      </div>
    </div>);
};
