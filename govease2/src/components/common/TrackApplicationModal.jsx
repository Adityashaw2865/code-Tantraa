import React, { useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
export const TrackApplicationModal = ({ isOpen, onClose, onNavigateToApp }) => {
    const { applications, approvalTypes, departments, business } = useApp();
    const [searchVal, setSearchVal] = useState('');
    const [searchedApp, setSearchedApp] = useState(null);
    if (!isOpen)
        return null;
    const handleSearch = () => {
        const clean = searchVal.trim().toLowerCase();
        const match = applications.find(a => a.applicationNumber.toLowerCase().includes(clean) ||
            a.id.toLowerCase().includes(clean));
        setSearchedApp(match || null);
    };
    const getApproval = (id) => approvalTypes.find(a => a.id === id);
    const getDept = (id) => departments.find(d => d.id === id);
    return (<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-900"/>
            <h3 className="font-bold text-sm text-slate-900">
              Statutory Application Status Tracker
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <input type="text" value={searchVal} onChange={e => setSearchVal(e.target.value)} placeholder="Enter Application ID (e.g. APP-2026-00006)" className="flex-1 p-2.5 border border-slate-300 rounded-lg text-xs font-mono"/>
            <button onClick={handleSearch} className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors">
              Track
            </button>
          </div>
        </div>

        {searchedApp ? (<div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] font-bold text-blue-900 bg-white px-2 py-0.5 rounded-md border border-blue-200">
                  {searchedApp.applicationNumber}
                </span>
                <h4 className="font-bold text-sm text-slate-900 mt-1">
                  {getApproval(searchedApp.approvalTypeId)?.approvalName}
                </h4>
              </div>

              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border uppercase ${searchedApp.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                searchedApp.status === 'query_raised' ? 'bg-red-100 text-red-800 border-red-200' :
                    'bg-blue-100 text-blue-800 border-blue-200'}`}>
                {searchedApp.status.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-white p-3 rounded-md border border-slate-200">
              <div>Entity: <strong>{business.businessName}</strong></div>
              <div>Department: <strong>{getDept(searchedApp.departmentId)?.shortCode}</strong></div>
              <div>Submitted: <span className="font-mono">{searchedApp.submissionDate || 'Draft'}</span></div>
              <div>RTSA Target: <span className="font-mono">{searchedApp.targetSLADate || 'Active'}</span></div>
            </div>

            {onNavigateToApp && (<button onClick={() => {
                    onNavigateToApp(searchedApp.id);
                    onClose();
                }} className="w-full py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-md font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer">
                <span>Open Full Application Workbench</span>
                <ArrowRight className="w-3.5 h-3.5"/>
              </button>)}
          </div>) : (searchVal && (<p className="text-center text-xs text-slate-400 py-4">
              No application found with that ID. Check the number and try again.
            </p>))}

      </div>
    </div>);
};
