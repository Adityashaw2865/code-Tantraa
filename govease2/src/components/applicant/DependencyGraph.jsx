import React from 'react';
import { Share2, ShieldCheck, Flame, Leaf, Zap, Building2, FileCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
export const DependencyGraph = () => {
    const { applications, approvalTypes } = useApp();
    const getStatusBadge = (approvalId) => {
        const app = applications.find(a => a.approvalTypeId === approvalId);
        if (!app) {
            return { label: 'Not Started', color: 'bg-slate-100 text-slate-600 border-slate-300' };
        }
        switch (app.status) {
            case 'approved':
                return { label: '✓ Approved', color: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold' };
            case 'under_verification':
            case 'submitted':
                return { label: 'Under Review', color: 'bg-blue-100 text-blue-800 border-blue-300 font-medium' };
            case 'inspection_scheduled':
            case 'inspection_completed':
                return { label: 'Inspection Stage', color: 'bg-amber-100 text-amber-800 border-amber-300 font-medium' };
            case 'query_raised':
                return { label: 'Action Required', color: 'bg-red-100 text-red-800 border-red-300 font-bold' };
            default:
                return { label: 'Ready to Submit', color: 'bg-slate-100 text-slate-700 border-slate-300' };
        }
    };
    return (<div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-100 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-blue-800"/>
            <h3 className="font-bold text-sm text-slate-900">
              Parallel Clearance & Statutory Dependency Pipeline
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Single-window concurrent processing engine. Independent NOCs proceed simultaneously without waiting in serial queue.
          </p>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-emerald-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Approved
          </span>
          <span className="flex items-center gap-1 text-amber-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> In Scrutiny / Inspection
          </span>
          <span className="flex items-center gap-1 text-red-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-red-500"></span> Clarification Pending
          </span>
        </div>
      </div>

      {/* Graphical Flow Representation */}
      <div className="space-y-6">
        
        {/* Tier 1: Foundation Clearance */}
        <div className="relative">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Phase 1: Foundation & Industrial Site Clearance
          </div>
          
          <div className="p-4 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-blue-900 text-white flex items-center justify-center">
                <Building2 className="w-4 h-4"/>
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900">Industrial Building Plan Sanction & Land Allotment</h4>
                <p className="text-[11px] text-slate-500">MIDC / Town & Country Planning (Mandatory Base Clearance)</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className={`text-[11px] px-2.5 py-0.5 rounded-md border ${getStatusBadge('appr_building_plan').color}`}>
                {getStatusBadge('appr_building_plan').label}
              </span>
            </div>
          </div>
          
          {/* Connector Down */}
          <div className="flex justify-center my-2">
            <div className="h-6 w-0.5 bg-blue-300"></div>
          </div>
        </div>

        {/* Tier 2: Concurrent Parallel Clearances */}
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1">
              <span>Phase 2: Synchronized Parallel Clearances</span>
              <span className="text-slate-500 font-normal">(Concurrent Non-Blocking Processing)</span>
            </span>
            <span className="text-[10px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md border border-blue-200 font-mono font-semibold">
              3 Streams Active Simultaneously
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-blue-50/40 rounded-xl border border-blue-100">
            
            {/* Stream A: Fire NOC */}
            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Flame className="w-3.5 h-3.5"/>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-md border ${getStatusBadge('appr_fire_noc').color}`}>
                  {getStatusBadge('appr_fire_noc').label}
                </span>
              </div>
              <div>
                <h5 className="font-bold text-xs text-slate-900">Fire Safety NOC</h5>
                <p className="text-[11px] text-slate-500">Fire & Emergency Services</p>
              </div>
              <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                Static water tank + yard hydrant audit
              </p>
            </div>

            {/* Stream B: Pollution CTE */}
            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Leaf className="w-3.5 h-3.5"/>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-md border ${getStatusBadge('appr_spcb_cte').color}`}>
                  {getStatusBadge('appr_spcb_cte').label}
                </span>
              </div>
              <div>
                <h5 className="font-bold text-xs text-slate-900">Consent to Establish (CTE)</h5>
                <p className="text-[11px] text-slate-500">Pollution Control Board</p>
              </div>
              <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                Effluent treatment & emission vetting
              </p>
            </div>

            {/* Stream C: HT Power Sanction */}
            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5"/>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-md border ${getStatusBadge('appr_power_sanction').color}`}>
                  {getStatusBadge('appr_power_sanction').label}
                </span>
              </div>
              <div>
                <h5 className="font-bold text-xs text-slate-900">HT Power Feasibility</h5>
                <p className="text-[11px] text-slate-500">MSEDCL Substation Division</p>
              </div>
              <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                145 kVA industrial load grid link
              </p>
            </div>

          </div>

          {/* Connector Down */}
          <div className="flex justify-center my-2">
            <div className="h-6 w-0.5 bg-blue-300"></div>
          </div>
        </div>

        {/* Tier 3: Pre-Operational Converged Gate */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Phase 3: Pre-Operational Operational Licencing Gate
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            
            {/* Factory Licence */}
            <div className="p-4 rounded-lg border border-slate-200 bg-white shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4"/>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Factory Operating Licence</h4>
                    <p className="text-[10px] text-slate-500">Directorate of Factories (Sec 6)</p>
                  </div>
                </div>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-md border ${getStatusBadge('appr_factory_licence').color}`}>
                  {getStatusBadge('appr_factory_licence').label}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-md">
                Prerequisites: Building Sanction ✓ · Fire NOC ✓ · 48 Workers Verified
              </p>
            </div>

            {/* FSSAI Manufacturing Licence */}
            <div className="p-4 rounded-lg border border-slate-200 bg-white shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
                    <FileCheck className="w-4 h-4"/>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">FSSAI Food Manufacturing Licence</h4>
                    <p className="text-[10px] text-slate-500">Food Safety Authority (State Wing)</p>
                  </div>
                </div>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-md border ${getStatusBadge('appr_fssai_licence').color}`}>
                  {getStatusBadge('appr_fssai_licence').label}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-md">
                Prerequisites: Potable Water Test · Food Safety Management Plan
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>);
};
