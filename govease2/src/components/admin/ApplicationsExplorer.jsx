import React, { useEffect, useMemo, useState } from 'react';
import { getSession } from '../../services/authService';
import { fetchApplicationsRaw } from '../../services/dataService';
import { useApp } from '../../context/AppContext';
import { downloadCsv } from '../../utils/csv';
const PAGE = 25;
const pretty = (s) => (s || '').replace(/_/g, ' ');
const day = (d) => (d ? String(d).slice(0, 10) : '');
// Admin: search / filter every application and export the result to CSV.
export const ApplicationsExplorer = () => {
    const { departments } = useApp();
    const [apps, setApps] = useState([]);
    const [error, setError] = useState('');
    const [q, setQ] = useState('');
    const [status, setStatus] = useState('');
    const [dept, setDept] = useState('');
    const [risk, setRisk] = useState('');
    const [breachedOnly, setBreachedOnly] = useState(false);
    const [page, setPage] = useState(0);
    const session = getSession();
    useEffect(() => { if (session)
        fetchApplicationsRaw(session.token).then(setApps).catch(e => setError(e.message)); }, []);
    const deptName = (id) => departments.find(d => d.id === id)?.name || '';
    const rows = useMemo(() => apps.map(a => ({
        id: a._id, applicationNumber: a.applicationNumber,
        business: a.businessId?.businessName || '', approval: a.approvalTypeId?.approvalName || '',
        department: deptName(String(a.departmentId)), departmentId: String(a.departmentId),
        status: a.status, risk: a.riskLevel, officer: a.assignedOfficerName || '',
        submitted: day(a.submissionDate), sla: day(a.targetSLADate),
        breached: !!a.targetSLADate && new Date(a.targetSLADate) < new Date() && !['approved', 'rejected', 'draft'].includes(a.status)
    })), [apps, departments]);
    const filtered = rows.filter(r => {
        const s = q.trim().toLowerCase();
        return (!s || `${r.applicationNumber} ${r.business} ${r.approval} ${r.officer}`.toLowerCase().includes(s))
            && (!status || r.status === status) && (!dept || r.departmentId === dept) && (!risk || r.risk === risk) && (!breachedOnly || r.breached);
    });
    const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
    const view = filtered.slice(page * PAGE, page * PAGE + PAGE);
    useEffect(() => setPage(0), [q, status, dept, risk, breachedOnly]);
    if (!session)
        return <p className="text-xs text-slate-500 bg-white p-4 rounded-xl border border-slate-200">Log in with a real admin account to browse applications.</p>;
    if (error)
        return <p className="text-xs text-red-600">{error}</p>;
    const sel = 'p-2 border border-slate-300 rounded-md text-xs bg-white';
    return (<div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search app no., business, approval, officer…" className={`${sel} flex-1 min-w-[220px]`}/>
        <select value={status} onChange={e => setStatus(e.target.value)} className={sel}>
          <option value="">All statuses</option>
          {[...new Set(rows.map(r => r.status))].map(s => <option key={s} value={s}>{pretty(s)}</option>)}
        </select>
        <select value={dept} onChange={e => setDept(e.target.value)} className={sel}>
          <option value="">All departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={risk} onChange={e => setRisk(e.target.value)} className={sel}>
          <option value="">Any risk</option><option>Low</option><option>Medium</option><option>High</option>
        </select>
        <label className="text-xs flex items-center gap-1 text-slate-700"><input type="checkbox" checked={breachedOnly} onChange={e => setBreachedOnly(e.target.checked)}/> SLA breached</label>
        <button onClick={() => downloadCsv('applications.csv', [
            { key: 'applicationNumber', label: 'Application No' }, { key: 'business', label: 'Business' }, { key: 'approval', label: 'Approval' },
            { key: 'department', label: 'Department' }, { key: 'status', label: 'Status' }, { key: 'risk', label: 'Risk' },
            { key: 'officer', label: 'Officer' }, { key: 'submitted', label: 'Submitted' }, { key: 'sla', label: 'SLA date' }, { key: 'breached', label: 'SLA breached' }
        ], filtered)} className="px-3 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold cursor-pointer">Export CSV ({filtered.length})</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="text-left text-slate-500 border-b border-slate-200"><th className="py-1.5">App No</th><th>Business</th><th>Approval</th><th>Status</th><th>Risk</th><th>Officer</th><th>SLA date</th></tr></thead>
          <tbody>{view.map(r => (<tr key={r.id} className="border-b border-slate-100">
              <td className="py-1.5 font-mono font-bold text-blue-900">{r.applicationNumber}</td>
              <td>{r.business}</td><td>{r.approval}</td>
              <td className="capitalize">{pretty(r.status)}</td><td>{r.risk}</td><td>{r.officer || '—'}</td>
              <td className={r.breached ? 'text-red-700 font-bold' : ''}>{r.sla || '—'}{r.breached ? ' ⚠' : ''}</td>
            </tr>))}</tbody>
        </table>
        {filtered.length === 0 && <p className="text-xs text-slate-500 py-4">No applications match.</p>}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{filtered.length} of {rows.length} applications</span>
        <div className="flex items-center gap-2">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-2 py-1 border rounded-md disabled:opacity-40 cursor-pointer">Prev</button>
          <span>{page + 1} / {pages}</span>
          <button disabled={page + 1 >= pages} onClick={() => setPage(p => p + 1)} className="px-2 py-1 border rounded-md disabled:opacity-40 cursor-pointer">Next</button>
        </div>
      </div>
    </div>);
};
