import React, { useState } from 'react';
import { getSession } from '../../services/authService';
import { updateGrievanceAPI } from '../../services/dataService';
const STATUSES = ['Submitted', 'Assigned', 'Under Review', 'Response Provided', 'Resolved', 'Reopened'];
const PRIORITIES = ['Normal', 'High', 'Escalated to Secretary'];
// Staff controls to update / resolve a grievance (saved to backend, applicant gets notified).
export const GrievanceActions = ({ grievance, onSaved }) => {
    const [status, setStatus] = useState(grievance.status);
    const [priority, setPriority] = useState(grievance.priority || 'Normal');
    const [remarks, setRemarks] = useState(grievance.officialResolutionRemarks || '');
    const [busy, setBusy] = useState(false);
    const session = getSession();
    if (!session || !/^[a-f0-9]{24}$/i.test(String(grievance.id)))
        return null; // demo/local data: nothing to save
    const save = async () => {
        setBusy(true);
        try {
            await updateGrievanceAPI(session.token, grievance.id, { status, priority, officialResolutionRemarks: remarks });
            onSaved();
        }
        catch (e) {
            alert(e.message);
        }
        setBusy(false);
    };
    return (<div className="pt-2 border-t border-slate-100 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <select value={status} onChange={e => setStatus(e.target.value)} className="p-1.5 border border-slate-300 rounded-md text-xs">
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={priority} onChange={e => setPriority(e.target.value)} className="p-1.5 border border-slate-300 rounded-md text-xs">
          {PRIORITIES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} placeholder="Official resolution remarks (applicant will be notified)" className="w-full p-2 border border-slate-300 rounded-md text-xs"/>
      <button onClick={save} disabled={busy} className="px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50">
        {busy ? 'Saving…' : 'Save update'}
      </button>
    </div>);
};
