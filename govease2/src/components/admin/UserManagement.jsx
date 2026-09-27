import React, { useEffect, useState } from 'react';
import { getSession } from '../../services/authService';
import { fetchUsers, createUserAPI, deactivateUserAPI } from '../../services/dataService';
import { useApp } from '../../context/AppContext';
// Admin: provision officer / inspector / admin accounts and deactivate users (backend /api/users).
export const UserManagement = () => {
    const { departments, loadWorkspace } = useApp();
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', role: 'officer', departmentId: '', designation: '' });
    const [error, setError] = useState('');
    const session = getSession();
    const load = () => { if (session)
        fetchUsers(session.token).then(setUsers).catch(e => setError(e.message)); };
    useEffect(load, []);
    if (!session)
        return <p className="text-xs text-slate-500 bg-white p-4 rounded-xl border border-slate-200">Log in as admin (real account) to manage users.</p>;
    const create = async () => {
        setError('');
        try {
            await createUserAPI(session.token, { ...form, departmentId: form.departmentId || undefined });
            setForm({ ...form, name: '', email: '', mobile: '', password: '', designation: '' });
            load();
            loadWorkspace();
        }
        catch (e) {
            setError(e.message);
        }
    };
    const deactivate = async (u) => {
        if (!confirm(`Deactivate ${u.name}?`))
            return;
        try {
            await deactivateUserAPI(session.token, u.id);
            load();
            loadWorkspace();
        }
        catch (e) {
            alert(e.message);
        }
    };
    const inp = 'p-2 border border-slate-300 rounded-md text-xs w-full';
    return (<div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Create government account</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <input className={inp} placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/>
          <input className={inp} placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}/>
          <input className={inp} placeholder="Mobile" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })}/>
          <input className={inp} type="password" placeholder="Temp password (min 8)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}/>
          <select className={inp} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
            <option value="officer">Officer</option><option value="inspector">Inspector</option><option value="admin">Admin</option>
          </select>
          <select className={inp} value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })}>
            <option value="">Department (optional)</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <input className={inp} placeholder="Designation" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })}/>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button onClick={create} className="px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold cursor-pointer">Create account</button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100">
        {users.map(u => (<div key={u.id} className="p-3 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-900">{u.name}</span>{' '}
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{u.role}</span>
              <div className="text-slate-500">{u.email}{u.designation ? ` · ${u.designation}` : ''}</div>
            </div>
            {u.role !== 'applicant' && u.id !== session.user.id && (<button onClick={() => deactivate(u)} className="px-2 py-1 rounded-md border border-red-200 text-red-700 hover:bg-red-50 cursor-pointer">Deactivate</button>)}
          </div>))}
        {users.length === 0 && <p className="p-4 text-xs text-slate-500">No users loaded.</p>}
      </div>
    </div>);
};
