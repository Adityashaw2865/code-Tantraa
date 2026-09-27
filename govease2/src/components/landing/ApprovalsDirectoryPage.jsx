import React, { useEffect, useMemo, useState } from 'react';
import { Search, Clock, FileText, ChevronDown, ChevronUp, ArrowRight, Landmark } from 'lucide-react';
import { fetchPublicApprovalTypes } from '../../services/dataService';

const FILTERS = ['All', 'Pre-Establishment', 'Pre-Operation'];

export const ApprovalsDirectoryPage = ({ onStartOnboarding, initialSearch = '' }) => {
    const [approvalTypes, setApprovalTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(initialSearch);
    const [filter, setFilter] = useState('All');
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        fetchPublicApprovalTypes().then(list => {
            setApprovalTypes(list);
            setLoading(false);
        });
    }, []);

    const filtered = useMemo(() => {
        return approvalTypes.filter(a => {
            const stage = a.isMandatoryPreOperation ? 'Pre-Operation' : 'Pre-Establishment';
            if (filter !== 'All' && stage !== filter)
                return false;
            if (!search.trim())
                return true;
            const q = search.trim().toLowerCase();
            return a.approvalName?.toLowerCase().includes(q) ||
                a.departmentId?.name?.toLowerCase().includes(q) ||
                a.departmentId?.shortCode?.toLowerCase().includes(q) ||
                a.category?.toLowerCase().includes(q);
        });
    }, [approvalTypes, search, filter]);

    return (<div className="bg-white text-slate-800">
      {/* Header */}
      <section className="px-4 sm:px-6 lg:px-8 py-12" style={{ backgroundColor: 'var(--gov-navy)' }}>
        <div className="max-w-6xl mx-auto text-white">
          <p className="text-sm font-semibold text-amber-400 mb-2">Approvals Directory</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
            Every statutory approval, licence & clearance in one place.
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            Search the full catalog of approvals across every department. See the statutory SLA,
            required documents, and legal basis for each before you apply.
          </p>
        </div>
      </section>

      {/* Search + Filters */}
      <section className="px-4 sm:px-6 lg:px-8 -mt-7">
        <div className="max-w-6xl mx-auto bg-white rounded-xl border border-slate-200 shadow-lg p-4 sm:p-5 flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search approval, licence or department name..." className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/20"/>
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(f => (<button key={f} onClick={() => setFilter(f)} className={`px-3.5 py-2 rounded-full text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${filter === f ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {f}
              </button>))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm text-slate-500 mb-5">
            {loading ? 'Loading approvals catalog…' : `${filtered.length} approval${filtered.length === 1 ? '' : 's'} found`}
          </p>

          {!loading && filtered.length === 0 && (<div className="text-center py-16 text-slate-400 text-sm">
              No approvals match your search. Try a different keyword or filter.
            </div>)}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(a => {
                const stage = a.isMandatoryPreOperation ? 'Pre-Operation' : 'Pre-Establishment';
                const isExpanded = expandedId === a._id;
                return (<div key={a._id} className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                      <Landmark className="w-4 h-4 text-amber-600"/>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full whitespace-nowrap ${stage === 'Pre-Operation' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                      {stage}
                    </span>
                  </div>

                  <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">
                    {a.departmentId?.shortCode || a.departmentId?.name || 'Dept'}
                  </p>
                  <h3 className="font-bold text-sm text-slate-900 mt-0.5 leading-snug">{a.approvalName}</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed flex-1">
                    {isExpanded ? a.description : `${(a.description || '').slice(0, 100)}${(a.description || '').length > 100 ? '…' : ''}`}
                  </p>

                  {isExpanded && (<div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                      <p><span className="font-semibold text-slate-800">Legal basis:</span> {a.legalActReference || '—'}</p>
                      <p><span className="font-semibold text-slate-800">Statutory fee:</span> {a.statutoryFeeINR ? `₹${a.statutoryFeeINR.toLocaleString('en-IN')}` : (a.estimatedFeesText || 'As applicable')}</p>
                      <p><span className="font-semibold text-slate-800">Documents required:</span> {(a.requiredDocumentKeys || []).length} mandatory</p>
                    </div>)}

                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{a.processingSLADays} Working Days</span>
                    <span className="flex items-center gap-1"><FileText className="w-3 h-3"/>{(a.requiredDocumentKeys || []).length} Docs</span>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <button onClick={() => setExpandedId(isExpanded ? null : a._id)} className="text-xs font-semibold text-slate-600 hover:text-blue-900 cursor-pointer flex items-center gap-1">
                      {isExpanded ? 'Hide details' : 'View Requirements'}
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5"/> : <ChevronDown className="w-3.5 h-3.5"/>}
                    </button>
                    <button onClick={onStartOnboarding} className="px-3 py-1.5 rounded-md bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors">
                      Apply <ArrowRight className="w-3 h-3"/>
                    </button>
                  </div>
                </div>);
            })}
          </div>
        </div>
      </section>
    </div>);
};
