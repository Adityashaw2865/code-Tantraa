import React, { useState } from 'react';
import { getSession } from '../../services/authService';
import { saveDepartmentAPI, saveApprovalTypeAPI } from '../../services/dataService';
import { useApp } from '../../context/AppContext';
const CATEGORIES = ['Registration', 'Licence', 'NOC', 'Clearance', 'Utility'];
const RENEWALS = ['Annual', 'Bi-annual', 'Every 5 Years', 'Perpetual / No Renewal'];
const METHODS = ['Online Single Window', 'Physical Inspection Required', 'Self-Certification'];
const inp = 'p-2 border border-slate-300 rounded-md text-xs w-full bg-white';
const EMPTY_DEPT = { id: '', name: '', shortCode: '', jurisdiction: '', nodalOfficer: '', contactEmail: '', contactPhone: '' };
const EMPTY_AT = {
    id: '', departmentId: '', approvalName: '', shortCode: '', category: 'Licence', description: '', statutoryFeeINR: '0',
    processingSLADays: '30', validityYears: '1', renewalFrequency: 'Annual', applicationMethod: 'Online Single Window',
    requiredDocumentKeys: '', officialSource: '', legalActReference: '', isMandatoryPreOperation: false
};
const deptIdOf = (a) => (a.departmentId && typeof a.departmentId === 'object' ? a.departmentId._id || a.departmentId.id : a.departmentId);
// Admin: create / edit departments and approval types (the master catalogue used by the rules engine).
export const CatalogManagement = () => {
    const { departments, approvalTypes, loadCatalog, loadWorkspace } = useApp();
    const [dept, setDept] = useState(EMPTY_DEPT);
    const [at, setAt] = useState(EMPTY_AT);
    const [msg, setMsg] = useState('');
    const session = getSession();
    if (!session)
        return <p className="text-xs text-slate-500 bg-white p-4 rounded-xl border border-slate-200">Log in with a real admin account to manage the catalogue.</p>;
    const done = (m) => { setMsg(m); loadCatalog(); loadWorkspace(); };
    const fail = (e) => setMsg('❌ ' + e.message);
    const saveDept = async () => {
        const { id, ...body } = dept;
        try {
            await saveDepartmentAPI(session.token, id || null, body);
            setDept(EMPTY_DEPT);
            done(`✅ Department ${id ? 'updated' : 'created'}`);
        }
        catch (e) {
            fail(e);
        }
    };
    const saveAt = async () => {
        const { id, ...f } = at;
        const body = {
            ...f,
            statutoryFeeINR: Number(f.statutoryFeeINR) || 0,
            processingSLADays: Number(f.processingSLADays),
            validityYears: /^perpetual$/i.test(String(f.validityYears).trim()) ? 'Perpetual' : Number(f.validityYears) || 1,
            requiredDocumentKeys: String(f.requiredDocumentKeys).split(',').map(s => s.trim()).filter(Boolean)
        };
        try {
            await saveApprovalTypeAPI(session.token, id || null, body);
            setAt(EMPTY_AT);
            done(`✅ Approval type ${id ? 'updated' : 'created'}`);
        }
        catch (e) {
            fail(e);
        }
    };
    const editAt = (a) => setAt({
        ...EMPTY_AT, ...a, id: a.id, departmentId: deptIdOf(a), statutoryFeeINR: String(a.statutoryFeeINR ?? 0),
        processingSLADays: String(a.processingSLADays), validityYears: String(a.validityYears ?? 1),
        requiredDocumentKeys: (a.requiredDocumentKeys || []).join(', ')
    });
    const F = (label, el) => <label className="block text-[11px] font-semibold text-slate-600">{label}{el}</label>;
    return (<div className="space-y-5">
      {msg && <p className="text-xs bg-white border border-slate-200 rounded-md px-3 py-2">{msg}</p>}

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">Departments ({departments.length})</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {F('Name', <input className={inp} value={dept.name} onChange={e => setDept({ ...dept, name: e.target.value })}/>)}
          {F('Short code', <input className={inp} value={dept.shortCode} onChange={e => setDept({ ...dept, shortCode: e.target.value })}/>)}
          {F('Jurisdiction', <input className={inp} value={dept.jurisdiction} onChange={e => setDept({ ...dept, jurisdiction: e.target.value })}/>)}
          {F('Nodal officer', <input className={inp} value={dept.nodalOfficer} onChange={e => setDept({ ...dept, nodalOfficer: e.target.value })}/>)}
          {F('Contact email', <input className={inp} value={dept.contactEmail} onChange={e => setDept({ ...dept, contactEmail: e.target.value })}/>)}
          {F('Contact phone', <input className={inp} value={dept.contactPhone} onChange={e => setDept({ ...dept, contactPhone: e.target.value })}/>)}
        </div>
        <div className="flex gap-2">
          <button onClick={saveDept} className="px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold cursor-pointer">{dept.id ? 'Update department' : 'Create department'}</button>
          {dept.id && <button onClick={() => setDept(EMPTY_DEPT)} className="px-3 py-1.5 rounded-md border border-slate-300 text-xs cursor-pointer">Cancel edit</button>}
        </div>
        <div className="divide-y divide-slate-100 text-xs">
          {departments.map(d => (<div key={d.id} className="py-1.5 flex items-center justify-between">
              <span><strong>{d.name}</strong> <span className="font-mono text-[10px] text-slate-500">{d.shortCode}</span></span>
              <button onClick={() => setDept({ ...EMPTY_DEPT, ...d })} className="text-blue-900 font-semibold cursor-pointer">Edit</button>
            </div>))}
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">Approval types ({approvalTypes.length})</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {F('Department', <select className={inp} value={at.departmentId} onChange={e => setAt({ ...at, departmentId: e.target.value })}><option value="">Select…</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>)}
          {F('Approval name', <input className={inp} value={at.approvalName} onChange={e => setAt({ ...at, approvalName: e.target.value })}/>)}
          {F('Short code', <input className={inp} value={at.shortCode} onChange={e => setAt({ ...at, shortCode: e.target.value })}/>)}
          {F('Category', <select className={inp} value={at.category} onChange={e => setAt({ ...at, category: e.target.value })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>)}
          {F('SLA (days)', <input type="number" className={inp} value={at.processingSLADays} onChange={e => setAt({ ...at, processingSLADays: e.target.value })}/>)}
          {F('Fee (INR)', <input type="number" className={inp} value={at.statutoryFeeINR} onChange={e => setAt({ ...at, statutoryFeeINR: e.target.value })}/>)}
          {F('Validity (years or "Perpetual")', <input className={inp} value={at.validityYears} onChange={e => setAt({ ...at, validityYears: e.target.value })}/>)}
          {F('Renewal', <select className={inp} value={at.renewalFrequency} onChange={e => setAt({ ...at, renewalFrequency: e.target.value })}>{RENEWALS.map(c => <option key={c}>{c}</option>)}</select>)}
          {F('Method', <select className={inp} value={at.applicationMethod} onChange={e => setAt({ ...at, applicationMethod: e.target.value })}>{METHODS.map(c => <option key={c}>{c}</option>)}</select>)}
          {F('Required document keys (comma separated)', <input className={inp} value={at.requiredDocumentKeys} onChange={e => setAt({ ...at, requiredDocumentKeys: e.target.value })}/>)}
          {F('Official source URL', <input className={inp} value={at.officialSource} onChange={e => setAt({ ...at, officialSource: e.target.value })}/>)}
          {F('Legal act reference', <input className={inp} value={at.legalActReference} onChange={e => setAt({ ...at, legalActReference: e.target.value })}/>)}
        </div>
        {F('Description', <textarea rows={2} className={inp} value={at.description} onChange={e => setAt({ ...at, description: e.target.value })}/>)}
        <label className="text-xs flex items-center gap-1.5"><input type="checkbox" checked={!!at.isMandatoryPreOperation} onChange={e => setAt({ ...at, isMandatoryPreOperation: e.target.checked })}/> Mandatory before operations start</label>
        <div className="flex gap-2">
          <button onClick={saveAt} className="px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold cursor-pointer">{at.id ? 'Update approval type' : 'Create approval type'}</button>
          {at.id && <button onClick={() => setAt(EMPTY_AT)} className="px-3 py-1.5 rounded-md border border-slate-300 text-xs cursor-pointer">Cancel edit</button>}
        </div>
        <div className="divide-y divide-slate-100 text-xs max-h-72 overflow-y-auto">
          {approvalTypes.map((a) => (<div key={a.id} className="py-1.5 flex items-center justify-between">
              <span><strong>{a.approvalName}</strong> <span className="text-slate-500">· {a.category} · {a.processingSLADays}d · ₹{a.statutoryFeeINR || 0}</span></span>
              <button onClick={() => editAt(a)} className="text-blue-900 font-semibold cursor-pointer">Edit</button>
            </div>))}
        </div>
      </div>
    </div>);
};
