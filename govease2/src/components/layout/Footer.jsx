import React, { useState } from 'react';
import { Building2, Shield, Phone, Mail, FileText, ChevronDown, ChevronUp } from 'lucide-react';
export const Footer = () => {
    const [expanded, setExpanded] = useState(false);
    return (<footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-xs mt-16">
      {/* Compact summary — always visible */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
        
        <div className="space-y-2 max-w-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center text-white font-bold">
              <Building2 className="w-5 h-5 text-amber-300"/>
            </div>
            <span className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
              VyaparSetu
              <span className="text-xs font-medium text-amber-400">व्यापारसेतु</span>
            </span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Government of Maharashtra's single-window platform for business approvals, inspections and compliance.
          </p>
          <div className="flex items-center gap-2 text-slate-400 text-[11px] pt-1">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0"/>
            <span>ISO 27001 Certified · State Encrypted Data Vault</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
          <Phone className="w-4 h-4 text-blue-400 shrink-0"/>
          <span>1800-345-5555 (Toll Free, 9am - 6pm)</span>
        </div>

        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-slate-400 hover:text-white text-[11px] font-semibold cursor-pointer shrink-0">
          <span>{expanded ? 'Show less' : 'Departments, statutes & more'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5"/> : <ChevronDown className="w-3.5 h-3.5"/>}
        </button>
      </div>

      {/* Detailed columns — collapsed by default */}
      {expanded && (<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-slate-800 pt-8">

          {/* Participating Statutory Departments */}
          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3">
              Participating Departments
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>· Maharashtra Industrial Development Corp (MIDC)</li>
              <li>· Maharashtra Pollution Control Board (MPCB)</li>
              <li>· Directorate of Industrial Safety & Health (DISH)</li>
              <li>· Maharashtra Fire & Emergency Services</li>
              <li>· Maharashtra State Electricity Distribution (MSEDCL)</li>
              <li>· Food & Drugs Administration Maharashtra (FDA)</li>
              <li>· Directorate of Industries, Govt. of Maharashtra</li>
            </ul>
          </div>

          {/* Regulatory Governance */}
          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3">
              Statutory Framework
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>· Maharashtra Right to Public Services Act (RTSA) 2015</li>
              <li>· Package Scheme of Incentives (PSI 2019 / Policy 2024)</li>
              <li>· Factories Act 1948 & Maharashtra Rules 1963</li>
              <li>· Water Act 1974 & Air Act 1981 (MPCB / CPCB)</li>
              <li>· Maharashtra Fire Prevention & Life Safety Act 2006</li>
              <li>· MAITRI Single Window Clearances Act</li>
            </ul>
          </div>

          {/* Help & Contact */}
          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3">
              Nodal Helpdesk & RTI
            </h4>
            <div className="space-y-2 text-slate-400">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400 shrink-0"/>
                <span>support.singlewindow@maharashtra.gov.in</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400 shrink-0"/>
                <span>Right to Information (RTI) Cell</span>
              </div>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                MAITRI Investor Facilitation Centre, World Trade Centre, Cuffe Parade, Mumbai 400005
              </p>
            </div>
          </div>

        </div>)}

      {/* Bottom Bar */}
      <div className="border-t border-slate-800 bg-slate-950 py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-[11px]">
          <div>
            © {new Date().getFullYear()} Government of Maharashtra · Maharashtra State Innovation Society (MSInS). All Rights Reserved.
          </div>
          <div className="flex items-center flex-wrap justify-center gap-x-4 gap-y-1.5">
            <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
            <span>·</span>
            <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
            <span>·</span>
            <span className="hover:text-white transition-colors cursor-pointer">Accessibility Statement</span>
          </div>
        </div>
      </div>
    </footer>);
};
