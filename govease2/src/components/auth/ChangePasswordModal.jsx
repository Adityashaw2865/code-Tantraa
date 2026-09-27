import React, { useState } from 'react';
import { getSession, saveSession, changePasswordRequest } from '../../services/authService';
// Logged-in user changes their own password. On success, every OTHER session for this
// account is signed out server-side (tokenVersion bump) - this session gets a fresh token
// so it keeps working without needing to log in again.
export const ChangePasswordModal = ({ onClose }) => {
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);
    const [loading, setLoading] = useState(false);
    const session = getSession();
    if (!session)
        return null;
    const submit = async (e) => {
        e.preventDefault();
        setError('');
        if (next.length < 8)
            return setError('New password must be at least 8 characters');
        if (next !== confirm)
            return setError('Passwords do not match');
        setLoading(true);
        try {
            const result = await changePasswordRequest(session.token, current, next);
            saveSession(result);
            setDone(true);
        }
        catch (err) {
            setError(err.message || 'Could not change password');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl space-y-3">
        <div className="flex items-start justify-between pb-2 border-b border-slate-100">
          <h3 className="font-bold text-sm text-slate-900">Change Password</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer text-lg">✕</button>
        </div>
        {done ? (<div className="space-y-3 text-xs">
            <p className="text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md p-2">Password changed. All your other sessions have been signed out.</p>
            <button onClick={onClose} className="w-full py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold cursor-pointer">Done</button>
          </div>) : (<form onSubmit={submit} className="space-y-3">
            <input type="password" placeholder="Current password" value={current} onChange={e => setCurrent(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-lg text-xs"/>
            <input type="password" placeholder="New password (min 8 chars)" value={next} onChange={e => setNext(e.target.value)} required minLength={8} className="w-full p-2 border border-slate-300 rounded-lg text-xs"/>
            <input type="password" placeholder="Confirm new password" value={confirm} onChange={e => setConfirm(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-lg text-xs"/>
            {error && <p className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>}
            <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold text-xs cursor-pointer">
              {loading ? 'Changing…' : 'Change Password'}
            </button>
          </form>)}
      </div>
    </div>);
};
