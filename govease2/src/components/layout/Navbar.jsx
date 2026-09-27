import React, { useState, useRef, useEffect } from 'react';
import { Building2, Bell, Sparkles, User as UserIcon, ChevronDown, CheckCircle2, RotateCcw, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../data/translations';
import { GovAccessibilityBar } from './GovAccessibilityBar';
import { getSession, clearSession, logoutRequest } from '../../services/authService';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';

export const Navbar = ({ onOpenAssistant, onOpenTrackModal, onStartOnboarding, activeNavTab, setActiveNavTab, onOpenPublicVerification, onOpenMasterDossier, onOpenRTSAAppeal, onOpenAuth }) => {
    const { currentUser, currentRole, setCurrentRole, language, setLanguage, notifications, markNotificationAsRead, markAllNotificationsRead, resetToDemoDefaults } = useApp();
    const [showRoleMenu, setShowRoleMenu] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showNotifMenu, setShowNotifMenu] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const isAuthenticated = !!getSession();
    const t = TRANSLATIONS[language];
    const unreadNotifs = notifications.filter(n => !n.isRead);

    const notifRef = useRef(null);
    const roleMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifMenu(false);
            if (roleMenuRef.current && !roleMenuRef.current.contains(e.target)) setShowRoleMenu(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const rolesList = [
        { role: 'applicant', title: 'Applicant', subtitle: 'Applicant' },
        { role: 'officer', title: 'Officer', subtitle: 'Department Officer' },
        { role: 'inspector', title: 'Inspector', subtitle: 'Field Inspector' },
        { role: 'admin', title: 'Admin', subtitle: 'State Single Window Admin' }
    ];
    const roleBadgeMap = {
        applicant: { label: 'Entrepreneur', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
        officer: { label: 'Dept Officer', color: 'bg-blue-100 text-blue-800 border-blue-200' },
        inspector: { label: 'Safety Inspector', color: 'bg-amber-100 text-amber-800 border-amber-200' },
        admin: { label: 'Admin', color: 'bg-purple-100 text-purple-800 border-purple-200' }
    };
    return (<header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <GovAccessibilityBar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* Zone 1: Brand */}
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveNavTab('landing')} className="flex items-center gap-2.5 text-left cursor-pointer group">
            <div className="w-9 h-9 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-blue-800 transition-colors">
              <Building2 className="w-5 h-5 text-amber-400"/>
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-blue-900 transition-colors flex items-center gap-1.5">
                VyaparSetu
                <span className="text-xs font-medium text-amber-600 font-sans">व्यापारसेतु</span>
              </span>
              <span className="text-[10px] block -mt-1 font-semibold uppercase tracking-wider text-slate-500">
                Single Window Business Compliance Portal
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2 */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
          {isAuthenticated && (<button onClick={() => setActiveNavTab('dashboard')} className={`transition-colors cursor-pointer py-1 border-b-2 ${activeNavTab === 'dashboard' ? 'border-blue-900 text-blue-900 font-semibold' : 'border-transparent hover:text-slate-900'}`}>
              {currentRole === 'applicant' ? t.nav.dashboard : currentRole === 'officer' ? 'Officer Workbench' : currentRole === 'inspector' ? 'Inspector Audit' : 'Administration'}
            </button>)}

          <button onClick={onOpenTrackModal} className="transition-colors hover:text-slate-900 flex items-center gap-1.5 cursor-pointer py-1">
            <Search className="w-3.5 h-3.5 text-slate-500"/>
            <span>{t.actions.trackApplication}</span>
          </button>
        </nav>

        {/* Zone 3 */}
        <div className="flex items-center gap-2 sm:gap-3">

          <button onClick={onStartOnboarding} className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-bold cursor-pointer transition-colors shadow-xs">
            Start your application
          </button>

          {!isAuthenticated ? (<>
              <button onClick={() => onOpenAuth?.('login')} className="px-3 py-1.5 text-sm font-semibold text-slate-700 hover:text-blue-900 cursor-pointer transition-colors">
                Login
              </button>
              <button onClick={() => onOpenAuth?.('register')} className="px-4 py-1.5 rounded-md bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold cursor-pointer transition-colors shadow-xs">
                Register
              </button>
            </>) : (<>

          <button onClick={onOpenAssistant} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer shadow-2xs" title="Open VyaparSetu Regulatory Intelligence Assistant">
            <Sparkles className="w-3.5 h-3.5 text-blue-700"/>
            <span className="hidden sm:inline">VyaparSetu AI</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button onClick={() => setShowNotifMenu(!showNotifMenu)} className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md relative cursor-pointer transition-colors" title="Notifications">
              <Bell className="w-5 h-5"/>
              {unreadNotifs.length > 0 && (<span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadNotifs.length}
                </span>)}
            </button>

            {showNotifMenu && (<div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-96 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 px-2 pt-1">
                  <span className="font-bold text-slate-800">Notifications ({unreadNotifs.length} unread)</span>
                  {unreadNotifs.length > 0 && (<button onClick={markAllNotificationsRead} className="text-blue-700 hover:underline cursor-pointer">
                      Mark all read
                    </button>)}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 mt-1">
                  {notifications.length === 0 ? (<p className="text-slate-500 p-4 text-center">No notifications at this time.</p>) : (notifications.map(n => (<div key={n.id} onClick={() => {
                        markNotificationAsRead(n.id);
                        setShowNotifMenu(false);
                        setActiveNavTab('dashboard');
                    }} role="button" tabIndex={0} onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            markNotificationAsRead(n.id);
                            setShowNotifMenu(false);
                            setActiveNavTab('dashboard');
                        }
                    }} className={`p-2.5 hover:bg-slate-50 rounded-md cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${!n.isRead ? 'bg-blue-50/50' : ''}`}>
                        <div className="flex items-start justify-between gap-1">
                          <span className={`font-semibold ${!n.isRead ? 'text-blue-900' : 'text-slate-800'}`}>
                            {n.title}
                          </span>
                          <span className="text-[10px] text-slate-500 whitespace-nowrap">{n.timestamp.slice(11)}</span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5 line-clamp-2">{n.message}</p>
                      </div>)))}
                </div>
              </div>)}
          </div>

          {/* Role Switcher & User Profile Menu */}
          <div className="relative" ref={roleMenuRef}>
            <button onClick={() => setShowRoleMenu(!showRoleMenu)} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left cursor-pointer">
              <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold overflow-hidden">
                {currentUser.avatar ? (<img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer"/>) : (<UserIcon className="w-3.5 h-3.5"/>)}
              </div>
              <div className="hidden md:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-900 max-w-[120px] truncate">
                    {currentUser.name}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium ${roleBadgeMap[currentRole].color}`}>
                    {roleBadgeMap[currentRole].label}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-0.5"/>
            </button>

            {showRoleMenu && (<div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-72 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-2 text-xs">
                <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
                  <p className="font-bold text-slate-900">{currentUser.name}</p>
                  <p className="text-slate-500 text-[11px] truncate">{currentUser.designation || currentUser.email}</p>
                </div>

                <p hidden={isAuthenticated} className="px-2 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Switch Role / Persona:
                </p>

                <div hidden={isAuthenticated} className="space-y-0.5">
                  {rolesList.map(item => (<button key={item.role} onClick={() => {
                        setCurrentRole(item.role);
                        setShowRoleMenu(false);
                        setActiveNavTab('dashboard');
                    }} className={`w-full text-left p-2 rounded-md flex items-center justify-between cursor-pointer transition-colors ${currentRole === item.role ? 'bg-blue-50 text-blue-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'}`}>
                      <div>
                        <div className="font-medium text-xs">{item.title}</div>
                        <div className="text-[10px] text-slate-500">{item.subtitle}</div>
                      </div>
                      {currentRole === item.role && (<CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0"/>)}
                    </button>))}
                </div>

                {getSession() && (<div className="border-t border-slate-100 mt-2 pt-1">
                    <button onClick={() => { setShowChangePassword(true); setShowRoleMenu(false); }} className="w-full text-left p-2 text-slate-600 hover:text-blue-800 hover:bg-blue-50 rounded-md cursor-pointer text-xs font-semibold">
                      Change Password
                    </button>
                  </div>)}
                <div className="border-t border-slate-100 mt-2 pt-1">
                  <button onClick={() => {
                    const s = getSession();
                    if (s)
                        logoutRequest(s.token);
                    clearSession();
                    setCurrentRole('applicant');
                    setActiveNavTab('landing');
                    setShowRoleMenu(false);
                }} className="w-full text-left p-2 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-md flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
                    <RotateCcw className="w-3.5 h-3.5 text-red-500"/>
                    <span>Logout</span>
                  </button>
                </div>
              </div>)}
      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)}/>}
          </div>
          </>)}

        </div>

      </div>

      {/* Sub-row */}
      <div className="hidden lg:flex items-center justify-center gap-8 h-10 border-t border-slate-100 bg-slate-50 text-sm font-medium text-slate-600">
        {[
            { id: 'landing', label: 'Home' },
            { id: 'directory', label: 'Approvals Directory' },
            { id: 'how-it-works', label: 'How It Works' },
            { id: 'features', label: 'Features' },
            { id: 'insights', label: 'Survey Insights' },
            { id: 'about', label: 'About' }
        ].map(item => (<button key={item.id} onClick={() => setActiveNavTab(item.id)} className={`transition-colors cursor-pointer h-full border-b-2 ${activeNavTab === item.id ? 'border-blue-900 text-blue-900 font-semibold' : 'border-transparent hover:text-slate-900'}`}>
            {item.label}
          </button>))}
      </div>
    </header>);
};