import React, { useRef } from 'react';
import { Building2, Printer, X, CheckCircle2, QrCode, ShieldCheck, Award } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { evaluateRequiredApprovals } from '../../services/rulesEngine';
export const OfficialDocumentModal = ({ isOpen, onClose, documentType, business, application, licence }) => {
    const printRef = useRef(null);
    const { approvalTypes, documents, departments } = useApp();
    if (!isOpen)
        return null;
    const handlePrint = () => {
        window.print();
    };
    const arn = application?.applicationNumber || `MH-CAF-${new Date().getFullYear()}-${String(business.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase().padStart(6, '0')}`;
    const bundle = evaluateRequiredApprovals(business, approvalTypes, documents).filter(e => e.confidence !== 'Not Applicable');
    const issueDate = licence?.issueDate || new Date().toISOString().split('T')[0];
    const expiryDate = licence?.expiryDate || new Date(new Date().setFullYear(new Date().getFullYear() + 3)).toISOString().split('T')[0];
    return (<div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Top Control Bar */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400"/>
            <div>
              <span className="font-bold text-sm">
                {documentType === 'caf'
            ? 'Official Maharashtra Common Application Form (CAF-1)'
            : 'Government Statutory Clearance Certificate (NOC)'}
              </span>
              <span className="text-[11px] text-slate-400 block -mt-0.5">
                Digitally authenticated under Maharashtra Right to Public Services Act, 2015
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer">
              <Printer className="w-3.5 h-3.5"/>
              <span>Print / Save as PDF</span>
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors">
              <X className="w-4 h-4"/>
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div ref={printRef} className="p-6 sm:p-10 overflow-y-auto bg-white text-slate-900 font-sans print:p-0 print:m-0">
          
          {/* Official Document Header */}
          <div className="border-b-2 border-slate-900 pb-5 text-center relative">
            {/* Seal / Emblem Watermark representation */}
            <div className="w-16 h-16 mx-auto mb-2 rounded-full border-2 border-blue-900 p-1 flex items-center justify-center bg-blue-50">
              <Building2 className="w-9 h-9 text-blue-900"/>
            </div>
            
            <span className="text-xs font-bold tracking-widest text-slate-600 uppercase block">
              Government of Maharashtra
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase mt-0.5">
              MAITRI Single Window Clearance Gateway
            </h1>
            <p className="text-xs font-semibold text-blue-900">
              Department of Skills, Employment, Entrepreneurship & Innovation
            </p>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">
              In collaboration with Maharashtra State Innovation Society (MSInS)
            </p>

            {/* ARN Barcode representation */}
            <div className="absolute top-0 right-0 hidden sm:block text-right">
              <div className="font-mono text-[10px] text-slate-400">STATE APPLICATION REF (ARN)</div>
              <div className="font-mono font-bold text-xs bg-slate-100 px-2.5 py-1 rounded-md border border-slate-300 inline-block mt-0.5">
                {arn}
              </div>
              <div className="text-[9px] text-emerald-600 font-bold flex items-center justify-end gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3"/>
                <span>Digitally Signed</span>
              </div>
            </div>
          </div>

          {/* DOCUMENT BODY - CONDITIONAL */}
          {documentType === 'caf' ? (
        /* CAF-1 Content */
        <div className="mt-6 space-y-6 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                  FORM CAF-1: CONSOLIDATED APPLICATION FOR INDUSTRIAL SANCTION & APPROVALS
                </h2>
                <p className="text-[11px] text-slate-600">
                  Formulated under Maharashtra Single Window Clearances Act & Business Reform Action Plan (BRAP)
                </p>
              </div>

              {/* Section 1: Enterprise Profile */}
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-blue-900 border-b border-slate-200 pb-1 mb-2">
                  1. Enterprise & Commercial Particulars
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50/50 rounded-md border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Name of Industrial Undertaking</span>
                    <span className="font-bold text-slate-900">{business.businessName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Constitution</span>
                    <span className="font-semibold text-slate-800">{business.businessType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Sector Classification</span>
                    <span className="font-semibold text-slate-800">{business.industrySector}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">PAN / GSTIN</span>
                    <span className="font-mono font-semibold text-slate-800">{business.panNumber} / {business.gstin}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">MSME Udyam Registration</span>
                    <span className="font-mono font-semibold text-slate-800">{business.udyamNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Total Capital Investment</span>
                    <span className="font-bold text-blue-900">{business.investmentAmountText}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Location & Industrial Utilities */}
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-blue-900 border-b border-slate-200 pb-1 mb-2">
                  2. Site Location, Land Tenure & Utilities
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50/50 rounded-md border border-slate-100">
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-slate-500 uppercase block">Factory Site Address</span>
                    <span className="font-semibold text-slate-800">{business.address}, {business.district}, {business.state} - {business.pincode}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Land Tenure Type</span>
                    <span className="font-semibold text-slate-800">{business.landType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Built-up Industrial Area</span>
                    <span className="font-semibold text-slate-800">{business.builtUpAreaSqFt.toLocaleString()} Sq. Ft.</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Connected Power Load</span>
                    <span className="font-semibold text-slate-800">{business.connectedPowerLoadKVA} kVA (MSEDCL)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Water Requirement</span>
                    <span className="font-semibold text-slate-800">{business.waterRequirementKLD} KLD (MIDC Water Works)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">MPCB Pollution Classification</span>
                    <span className="font-bold text-amber-700">{business.environmentalCategory} Category</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Workforce Engaged</span>
                    <span className="font-semibold text-slate-800">{business.numberOfEmployees} Workers (Factories Act)</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Statutory Approvals Bundled */}
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-blue-900 border-b border-slate-200 pb-1 mb-2">
                  3. Clearances Requested in Single-Window Bundle
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border border-slate-200 text-xs min-w-[480px]">
                  <thead className="bg-slate-100 text-slate-700 font-semibold">
                    <tr>
                      <th className="p-2 border border-slate-200">Department</th>
                      <th className="p-2 border border-slate-200">Statutory Clearance</th>
                      <th className="p-2 border border-slate-200">Act / Legal Rule</th>
                      <th className="p-2 border border-slate-200">RTSA SLA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bundle.map((e, i) => (<tr key={e.approval.id} className={i % 2 ? 'bg-slate-50/50' : ''}>
                        <td className="p-2 border border-slate-200 font-medium">{departments.find(d => d.id === e.approval.departmentId)?.shortCode || '-'}</td>
                        <td className="p-2 border border-slate-200">{e.approval.approvalName}</td>
                        <td className="p-2 border border-slate-200">{e.approval.legalActReference}</td>
                        <td className="p-2 border border-slate-200 font-mono text-emerald-700 font-bold">{e.approval.processingSLADays} Days</td>
                      </tr>))}
                    {bundle.length === 0 && (<tr><td colSpan={4} className="p-2 border border-slate-200 text-slate-500">No clearances applicable for this profile.</td></tr>)}
                  </tbody>
                </table>
                </div>
              </div>

              {/* Statutory Undertaking & Signatures */}
              <div className="pt-4 border-t border-slate-200">
                <p className="text-[10px] text-slate-500 leading-relaxed italic">
                  Declaration: I hereby solemnly declare that all particulars stated above and in the accompanying pre-validated documents are authentic and true to the best of my knowledge. Any misrepresentation shall render the clearances liable for immediate cancellation under Section 14 of the Maharashtra Single Window Clearances Act.
                </p>

                <div className="flex items-end justify-between mt-8 pt-4">
                  <div className="text-center">
                    <div className="w-24 h-24 border border-dashed border-slate-300 rounded-md p-1 flex items-center justify-center bg-slate-50">
                      <QrCode className="w-20 h-20 text-slate-800"/>
                    </div>
                    <span className="text-[9px] text-slate-400 block mt-1 font-mono">Scan to Verify CAF-1</span>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="w-48 border-b border-slate-900 pb-1 text-center font-serif text-sm italic font-bold text-blue-900">
                      Digitally Signed via Aadhaar eSign
                    </div>
                    <div className="font-bold text-slate-900 text-xs">{'Authorized Signatory'}</div>
                    <div className="text-[10px] text-slate-500">Director, {business.businessName}</div>
                    <div className="text-[9px] text-slate-400 font-mono">Timestamp: {new Date().toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>) : (
        /* Statutory Certificate Content */
        <div className="mt-8 space-y-6 text-xs relative">
              {/* Gold border decorative frame */}
              <div className="border-4 border-double border-amber-500/60 p-6 sm:p-8 rounded-xl bg-gradient-to-b from-amber-50/20 via-white to-amber-50/20 shadow-xs relative">
                
                <div className="text-center space-y-2 mb-6">
                  <span className="inline-block px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                    STATUTORY CLEARANCE ISSUED
                  </span>
                  <h2 className="text-lg sm:text-xl font-extrabold text-blue-950 uppercase tracking-tight">
                    {licence?.approvalName || 'Fire & Life Safety No-Objection Certificate (NOC)'}
                  </h2>
                  <p className="text-xs font-semibold text-slate-700">
                    Issued under Maharashtra Fire Prevention & Life Safety Measures Act, 2006 (Section 3)
                  </p>
                  <p className="font-mono text-xs font-bold text-blue-900">
                    CERTIFICATE REGISTRATION NO: {licence?.licenceNumber || 'MH-FES-NOC-2026-99214'}
                  </p>
                </div>

                <div className="space-y-4 text-xs text-slate-800 leading-relaxed">
                  <p>
                    This is to certify that the manufacturing establishment of <strong>M/s. {business.businessName}</strong>, situated at <strong>{business.address}, {business.district}, Maharashtra - {business.pincode}</strong>, has complied with the prescribed fire safety measures, hydraulic hydrant testing, static water reservoir capacity (100,000 Litres), and emergency exit regulations.
                  </p>

                  <p>
                    A joint on-site inspection was carried out by the designated Divisional Fire Inspector under Inspection Reference <strong>#INS-2026-0042</strong>, and the installation has been found <strong>Satisfactory & Recommended for Operation</strong>.
                  </p>

                  {/* Conditions Box */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
                    <span className="font-bold text-slate-900 text-[11px] uppercase tracking-wider block">
                      Conditions of Sanction:
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
                      <li>The internal ring hydrant network shall maintain continuous standby pressure of not less than 7.0 bar.</li>
                      <li>Fire detection smoke alarms and manual call points shall undergo bi-annual testing.</li>
                      <li>This clearance shall remain valid for a statutory period of <strong>3 Years</strong> from date of issue.</li>
                    </ul>
                  </div>

                  {/* Dates & Validity */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100 font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 font-sans block">DATE OF GRANT</span>
                      <span className="font-bold text-slate-900">{issueDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-sans block">VALID UNTIL</span>
                      <span className="font-bold text-emerald-700">{expiryDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-sans block">RENEWAL WINDOW</span>
                      <span className="font-bold text-amber-700">60 Days Prior to Expiry</span>
                    </div>
                  </div>
                </div>

                {/* Signatures & Dynamic QR Verification */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mt-8 pt-6 border-t border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-20 bg-white p-1 rounded-md border border-slate-300 shadow-2xs">
                      <QrCode className="w-full h-full text-slate-900"/>
                    </div>
                    <div className="text-[10px] text-slate-600">
                      <span className="font-bold text-slate-900 block">QR Security Code</span>
                      <span>Scan via mobile camera to authenticate state digital signature ledger.</span>
                      <span className="block font-mono text-[9px] text-slate-400 mt-0.5">Hash: e8f9...4c21a</span>
                    </div>
                  </div>

                  <div className="text-right space-y-0.5">
                    <div className="w-12 h-12 ml-auto rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold text-xs mb-1">
                      <ShieldCheck className="w-7 h-7 text-blue-900"/>
                    </div>
                    <p className="font-bold text-slate-900 text-xs">Er. Sachin Deshmukh</p>
                    <p className="text-[10px] text-slate-600">Divisional Fire Officer & Competent Authority</p>
                    <p className="text-[10px] text-slate-500">Government of Maharashtra</p>
                    <p className="text-[9px] text-emerald-700 font-mono font-bold">DIGITALLY ATTESTED: {issueDate}</p>
                  </div>
                </div>

              </div>
            </div>)}

        </div>

        {/* Modal Bottom Close bar */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 print:hidden shrink-0">
          <span>Official Document generated via VyaparSetu (व्यापारसेतु) State Single Window Gateway</span>
          <button onClick={onClose} className="px-4 py-1.5 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold cursor-pointer transition-colors">
            Close Viewer
          </button>
        </div>

      </div>
    </div>);
};
