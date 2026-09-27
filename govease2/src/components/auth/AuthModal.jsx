import React, { useState } from 'react';
import { Building2, ArrowRight, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { loginRequest, registerRequest, saveSession, sendOtpRequest, verifyOtpRequest, forgotPasswordRequest, resetPasswordRequest } from '../../services/authService';
export const AuthModal = ({ isOpen, onClose, onSuccess, initialMode = 'login' }) => {
    const { setCurrentRole, currentRole, loadWorkspace } = useApp();
    const [mode, setMode] = useState(initialMode);
    const [otpStep, setOtpStep] = useState(null);
    const [otp, setOtp] = useState('');
    const [devOtp, setDevOtp] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [resetRequested, setResetRequested] = useState(false);
    const [devResetToken, setDevResetToken] = useState('');
    React.useEffect(() => {
        if (isOpen)
            setMode(initialMode);
    }, [isOpen, initialMode]);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showDemo, setShowDemo] = useState(false);
    const [previewLoadingRole, setPreviewLoadingRole] = useState(null);
    if (!isOpen)
        return null;
    const finishLogin = (role) => {
        setCurrentRole(role);
        onSuccess();
        onClose();
    };
    // Real login (through the backend) into a seeded demo account for the chosen role -
    // handy for quickly previewing every role without typing credentials each time.
    const DEMO_PASSWORD = 'Passw0rd!123';
    const demoAccounts = [
        { role: 'applicant', badge: 'Applicant', email: 'applicant@vyaparsetu.demo' },
        { role: 'officer', badge: 'Dept Officer', email: 'officer@vyaparsetu.demo' },
        { role: 'inspector', badge: 'Inspector', email: 'inspector@vyaparsetu.demo' },
        { role: 'admin', badge: 'Admin', email: 'admin@vyaparsetu.demo' }
    ];
    const handlePreviewLogin = async (account) => {
        setError(null);
        setPreviewLoadingRole(account.role);
        try {
            const result = await loginRequest(account.email, DEMO_PASSWORD);
            saveSession(result);
            loadWorkspace();
            finishLogin(result.user.role);
        }
        catch (err) {
            setError(err.message || `Could not log in as ${account.badge}. Have you run "npm run seed" on the backend?`);
        }
        finally {
            setPreviewLoadingRole(null);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            if (mode === 'forgot') {
                if (!resetRequested) {
                    const r = await forgotPasswordRequest(email);
                    setResetRequested(true);
                    setDevResetToken(r.devResetToken || '');
                }
                else {
                    await resetPasswordRequest(resetToken, password);
                    setMode('login');
                    setResetRequested(false);
                    setResetToken('');
                    setPassword('');
                    setError(null);
                }
                return;
            }
            const result = mode === 'login'
                ? await loginRequest(email, password)
                : await registerRequest({ name, email, mobile, password });
            saveSession(result);
            loadWorkspace();
            if (mode === 'register') {
                // New account: kick off mobile OTP verification before dropping them into the dashboard.
                try {
                    const otpRes = await sendOtpRequest(result.token);
                    setDevOtp(otpRes.devOtp || '');
                    setOtpStep({ token: result.token, role: result.user.role });
                    return;
                }
                catch { /* OTP send failed (e.g. no SMS provider) - don't block registration on it */ }
            }
            finishLogin(result.user.role);
        }
        catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    const handleVerifyOtp = async (skip = false) => {
        if (!otpStep)
            return;
        setError(null);
        setLoading(true);
        try {
            if (!skip)
                await verifyOtpRequest(otpStep.token, otp);
            finishLogin(otpStep.role);
        }
        catch (err) {
            setError(err.message || 'Could not verify OTP');
        }
        finally {
            setLoading(false);
        }
    };
    const quickRoles = [
        { role: 'applicant', badge: 'Applicant' },
        { role: 'officer', badge: 'Dept Officer' },
        { role: 'inspector', badge: 'Inspector' },
        { role: 'admin', badge: 'Admin' }
    ];
    return (<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">

        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4 text-amber-300"/>
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">VyaparSetu Login</h3>
              <p className="text-[11px] text-slate-500">Sign in to your account</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer text-lg">✕</button>
        </div>

        {!otpStep && (<div className="space-y-1.5 pb-3 border-b border-slate-100">
          <p className="text-[11px] font-semibold text-slate-500">Preview Login (seeded demo accounts)</p>
          <div className="grid grid-cols-2 gap-1.5">
            {demoAccounts.map(account => (<button key={account.role} type="button" disabled={previewLoadingRole !== null} onClick={() => handlePreviewLogin(account)} className="p-1.5 rounded-lg border border-slate-200 hover:border-blue-300 text-[11px] font-semibold text-slate-700 cursor-pointer transition-colors disabled:opacity-60 flex items-center justify-center gap-1">
                {previewLoadingRole === account.role && <Loader2 className="w-3 h-3 animate-spin"/>}
                {account.badge}
              </button>))}
          </div>
        </div>)}

        {otpStep ? (<div className="space-y-3">
            <p className="text-xs text-slate-600">We've sent a 6-digit code to your registered mobile number to verify it.</p>
            {devOtp && <p className="text-[11px] bg-amber-50 border border-amber-200 rounded-md p-2 text-amber-800">Demo mode (no SMS provider configured yet): your OTP is <strong className="font-mono">{devOtp}</strong></p>}
            <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="6-digit OTP" maxLength={6} className="w-full p-2 border border-slate-300 rounded-lg text-xs tracking-widest text-center font-mono"/>
            {error && <p className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>}
            <button onClick={() => handleVerifyOtp(false)} disabled={loading || otp.length < 6} className="w-full py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold text-xs cursor-pointer">
              {loading ? 'Verifying…' : 'Verify & Continue'}
            </button>
            <button onClick={() => handleVerifyOtp(true)} className="w-full text-[11px] text-slate-500 hover:text-blue-800 cursor-pointer">Skip for now</button>
          </div>) : (<>
        <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
          <button type="button" onClick={() => setMode('login')} className={`flex-1 py-1.5 rounded-md cursor-pointer transition-colors ${mode === 'login' ? 'bg-white shadow-xs text-blue-900' : 'text-slate-500'}`}>
            Login
          </button>
          <button type="button" onClick={() => setMode('register')} className={`flex-1 py-1.5 rounded-md cursor-pointer transition-colors ${mode === 'register' ? 'bg-white shadow-xs text-blue-900' : 'text-slate-500'}`}>
            Register (Applicant)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'forgot' && (<p className="text-[11px] text-slate-500">
              {resetRequested ? 'Enter the reset code and your new password.' : "Enter your account email and we'll send you a reset code."}
            </p>)}
          {mode === 'register' && (<>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-lg text-xs"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
                <input value={mobile} onChange={e => setMobile(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-lg text-xs"/>
              </div>
            </>)}
          {!(mode === 'forgot' && resetRequested) && (<div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-lg text-xs"/>
            </div>)}
          {mode === 'forgot' && resetRequested && (<div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reset code</label>
              {devResetToken && <p className="text-[11px] bg-amber-50 border border-amber-200 rounded-md p-2 text-amber-800 mb-1">Demo mode (no email provider configured yet): your code is <strong className="font-mono break-all">{devResetToken}</strong></p>}
              <input value={resetToken} onChange={e => setResetToken(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"/>
            </div>)}
          {!(mode === 'forgot' && !resetRequested) && (<div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{mode === 'forgot' ? 'New password' : 'Password'}</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={mode !== 'login' ? 8 : undefined} className="w-full p-2 border border-slate-300 rounded-lg text-xs"/>
            </div>)}

          {error && (<p className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>)}

          <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold text-xs cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin"/>}
            <span>{mode === 'login' ? 'Sign In' : mode === 'forgot' ? (resetRequested ? 'Reset Password' : 'Send Reset Code') : 'Create Account'}</span>
            {!loading && <ArrowRight className="w-3.5 h-3.5"/>}
          </button>
          {mode === 'login' && (<button type="button" onClick={() => { setMode('forgot'); setError(null); }} className="w-full text-center text-[11px] text-slate-500 hover:text-blue-800 cursor-pointer">Forgot password?</button>)}
          {mode === 'forgot' && (<button type="button" onClick={() => { setMode('login'); setResetRequested(false); setError(null); }} className="w-full text-center text-[11px] text-slate-500 hover:text-blue-800 cursor-pointer">← Back to login</button>)}
        </form>

        <div className="pt-2 border-t border-slate-100 text-center">
          <button type="button" onClick={() => setShowDemo(v => !v)} className="text-[11px] text-slate-500 hover:text-blue-800 font-medium cursor-pointer">
            {showDemo ? 'Hide demo access' : 'Backend not running? Use demo access →'}
          </button>
          {showDemo && (<div className="mt-2 grid grid-cols-2 gap-1.5">
              {quickRoles.map(item => (<button key={item.role} type="button" onClick={() => finishLogin(item.role)} className={`p-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors ${currentRole === item.role ? 'border-blue-900 bg-blue-50 text-blue-900' : 'border-slate-200 hover:border-blue-300 text-slate-700'}`}>
                  {item.badge}
                </button>))}
            </div>)}
        </div>
        </>)}

      </div>
    </div>);
};
