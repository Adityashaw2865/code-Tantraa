import React, { useState } from 'react';
import { Award, RotateCw, AlertTriangle, QrCode, Download, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getSession } from '../../services/authService';
import { downloadCertificate } from '../../services/dataService';
export const LicenceRenewalCenter = () => {
    const { licences, startRenewal, business } = useApp();
    const [selectedLicenceForCert, setSelectedLicenceForCert] = useState(null);
    const expiringSoonCount = licences.filter(l => l.daysToExpiry <= 60).length;
    return (<div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-900"/>
            <h3 className="font-bold text-base text-slate-900">
              Digital Licences & Continuous Renewal Governance
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Active statutory credentials for {business.businessName}. Proactive automated renewal notifications prevent production interruptions.
          </p>
        </div>

        {expiringSoonCount > 0 && (<div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold self-start sm:self-auto">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0"/>
            <span>{expiringSoonCount} licence requires renewal action within 60 days</span>
          </div>)}
      </div>

      {/* Licences List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {licences.map(lic => {
            const isUrgent = lic.daysToExpiry <= 60;
            return (<div key={lic.id} className={`p-5 rounded-xl border bg-white shadow-xs space-y-4 flex flex-col justify-between ${isUrgent ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'}`}>
              <div>
                
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-900 border border-blue-200">
                      {lic.licenceNumber}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 mt-1">
                      {lic.approvalName}
                    </h4>
                    <p className="text-[11px] text-slate-500">{lic.departmentName}</p>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase font-mono ${isUrgent
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'}`}>
                    {isUrgent ? `Expires in ${lic.daysToExpiry}d` : 'Active / In Order'}
                  </span>
                </div>

                {/* Validity Specs */}
                <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1.5 border border-slate-100 mt-3">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Issued Date:</span>
                    <span className="font-mono font-semibold text-slate-800">{lic.issueDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Valid Until:</span>
                    <span className="font-mono font-bold text-slate-900">{lic.expiryDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200">
                    <span>Statutory Status:</span>
                    <span className="font-semibold text-emerald-700">Digital Seal Verified</span>
                  </div>
                </div>

              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <button onClick={() => setSelectedLicenceForCert(lic)} className="text-blue-900 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer">
                  <QrCode className="w-3.5 h-3.5"/>
                  <span>View Certificate & QR</span>
                </button>

                {lic.canRenew && (<button onClick={() => startRenewal(lic.id)} className="px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors">
                    <RotateCw className="w-3 h-3"/>
                    <span>1-Click Renewal</span>
                  </button>)}
              </div>

            </div>);
        })}
      </div>

      {/* Digital Certificate Viewer Modal */}
      {selectedLicenceForCert && (<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600"/>
                <span className="font-bold text-sm text-slate-900">
                  Government of Maharashtra Digital Certificate
                </span>
              </div>
              <button onClick={() => setSelectedLicenceForCert(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer">
                ✕
              </button>
            </div>

            {/* Official Certificate Canvas Mockup */}
            <div className="border-4 border-double border-slate-300 p-6 rounded-lg bg-slate-50 text-center space-y-3 relative overflow-hidden">
              <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                MAITRI SINGLE WINDOW CLEARANCE & COMPLIANCE PORTAL
              </div>
              
              <h3 className="text-base font-extrabold text-blue-950 uppercase tracking-tight">
                {selectedLicenceForCert.approvalName}
              </h3>

              <p className="text-xs text-slate-700 italic">
                This is to officially certify that the manufacturing establishment:
              </p>

              <div className="py-2 border-y border-slate-200">
                <p className="font-bold text-sm text-slate-900">{selectedLicenceForCert.businessName}</p>
                <p className="text-[11px] text-slate-500">{business.address}, {business.district}, {business.state}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left text-xs bg-white p-3 rounded-md border border-slate-200 font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block">Licence Number</span>
                  <span className="font-bold text-slate-900">{selectedLicenceForCert.licenceNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Valid Until</span>
                  <span className="font-bold text-slate-900">{selectedLicenceForCert.expiryDate}</span>
                </div>
              </div>

              {/* QR Code and Seal */}
              <div className="flex items-center justify-between pt-2 px-4">
                <div className="text-left text-[10px] text-slate-500">
                  <p className="font-semibold text-slate-700">Digital Gazette Seal</p>
                  <p>Govt. of Maharashtra</p>
                </div>
                
                {/* QR Code Graphic */}
                <div className="w-16 h-16 bg-white border border-slate-300 p-1 flex items-center justify-center rounded-md">
                  <QrCode className="w-12 h-12 text-slate-800"/>
                </div>
              </div>

            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-mono text-[10px]">
                SHA-256: 4a9f8b...3e17c
              </span>

              <div className="flex gap-2">
                <button onClick={() => setSelectedLicenceForCert(null)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold cursor-pointer">
                  Close
                </button>
                <button onClick={async () => {
                const se = getSession();
                const lic = selectedLicenceForCert;
                if (se && /^[a-f0-9]{24}$/i.test(String(lic.id))) {
                    try {
                        await downloadCertificate(se.token, lic.id, lic.licenceNumber);
                    }
                    catch (e) {
                        alert(e.message);
                        return;
                    }
                }
                else {
                    alert(`Demo mode: certificate ${lic.licenceNumber}.pdf (log in with a real account to download the PDF).`);
                }
                setSelectedLicenceForCert(null);
            }} className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-md font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs">
                  <Download className="w-3.5 h-3.5"/>
                  <span>Download PDF Certificate</span>
                </button>
              </div>
            </div>

          </div>
        </div>)}

    </div>);
};
