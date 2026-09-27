import React, { useState } from 'react';
import { MessageSquare, Smartphone, CheckCheck, Clock, Send, ShieldCheck, Bell, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
export const SmsNotificationDrawer = ({ isOpen, onClose, onOpenQuery }) => {
    const { business, applications, notifications } = useApp();
    const [botReplies, setBotReplies] = useState([]);
    const [activeTab, setActiveTab] = useState('whatsapp');
    const [customReply, setCustomReply] = useState('');
    const [replySent, setReplySent] = useState(false);
    if (!isOpen)
        return null;
    const timeAgo = (ts) => {
        const d = new Date(ts);
        if (isNaN(d.getTime()))
            return '';
        const mins = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000));
        if (mins < 60)
            return `${mins || 1} min ago`;
        if (mins < 1440)
            return `${Math.round(mins / 60)} hr ago`;
        return `${Math.round(mins / 1440)} day(s) ago`;
    };
    const feed = [...(notifications || [])]
        .sort((x, y) => new Date(y.timestamp).getTime() - new Date(x.timestamp).getTime())
        .map(n => ({
        id: n.id,
        channel: activeTab,
        sender: activeTab === 'sms' ? 'MAITRI-MH (Govt. of Maharashtra)' : 'VyaparSetu Citizen Bot',
        time: timeAgo(n.timestamp),
        text: `${n.title}\n\n${n.message}`,
        actionLabel: n.category === 'query' ? 'Open Query' : undefined,
        urgency: n.urgency
    }))
        .filter(m => activeTab === 'whatsapp' || m.urgency !== 'normal');
    const handleSendReply = (e) => {
        e.preventDefault();
        const cmd = customReply.trim();
        if (!cmd)
            return;
        const apps = applications || [];
        const reply = cmd.toUpperCase() === 'STATUS'
            ? (apps.length === 0
                ? 'You have no applications yet. Start from the Approval Checklist.'
                : `You have ${apps.length} application(s):\n` + apps.map(a => `• ${a.applicationNumber}: ${a.status}`).join('\n'))
            : 'Command received. Type STATUS to see your application status.';
        setBotReplies(prev => [...prev, { id: 'r' + Date.now(), text: reply }]);
        setReplySent(true);
        setCustomReply('');
        setTimeout(() => {
            setReplySent(false);
        }, 2500);
    };
    return (<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-end">
      <div className="bg-slate-900 w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-700 animate-in slide-in-from-right duration-200 text-white">
        
        {/* Drawer Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <Smartphone className="w-4 h-4"/>
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>Citizen Mobile Notifications</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Live Feed to: {business.contactPhone || '+91 98301 24567'}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer">
            ✕
          </button>
        </div>

        {/* Channel Switcher */}
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center gap-2 text-xs">
          <button onClick={() => setActiveTab('whatsapp')} className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 font-semibold transition-colors cursor-pointer ${activeTab === 'whatsapp'
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
            <MessageSquare className="w-3.5 h-3.5"/>
            <span>Official WhatsApp Alerts</span>
          </button>

          <button onClick={() => setActiveTab('sms')} className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 font-semibold transition-colors cursor-pointer ${activeTab === 'sms'
            ? 'bg-blue-600 text-white shadow-xs'
            : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
            <Bell className="w-3.5 h-3.5"/>
            <span>Govt. DLT SMS Alerts</span>
          </button>
        </div>

        {/* Feed List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {feed.length === 0 && (<p className="text-xs text-slate-400 text-center pt-8">No alerts yet. Notifications will appear here when you apply, get queries, inspections or renewals.</p>)}
          {feed.map(msg => (<div key={msg.id} className={`p-3.5 rounded-xl border text-xs leading-relaxed space-y-2 ${activeTab === 'whatsapp'
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-100'
                : 'bg-slate-800/70 border-slate-700 text-slate-200'}`}>
                <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-white/10 pb-1.5">
                  <span className="font-bold text-white flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400"/>
                    {msg.sender}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3"/>
                    {msg.time}
                  </span>
                </div>

                <p className="whitespace-pre-line text-[11.5px] leading-relaxed">
                  {msg.text}
                </p>

                {msg.actionLabel && (<button onClick={() => {
                    onClose();
                    onOpenQuery();
                }} className="w-full mt-2 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors">
                    <span>{msg.actionLabel}</span>
                    <ArrowRight className="w-3 h-3"/>
                  </button>)}

                <div className="flex justify-end pt-1">
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCheck className="w-3.5 h-3.5"/> Delivered
                  </span>
                </div>
              </div>))}
          {activeTab === 'whatsapp' && botReplies.map(r => (<div key={r.id} className="p-3 rounded-xl border bg-emerald-950/40 border-emerald-800/60 text-emerald-100 text-[11.5px] whitespace-pre-line">{r.text}</div>))}
        </div>

        {/* WhatsApp Interactive Reply Simulator */}
        {activeTab === 'whatsapp' && (<form onSubmit={handleSendReply} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <input type="text" value={customReply} onChange={e => setCustomReply(e.target.value)} placeholder="Type WhatsApp reply or command (e.g. STATUS)..." className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"/>
            <button type="submit" className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer">
              <Send className="w-4 h-4"/>
            </button>
          </form>)}

        {replySent && (<div className="bg-emerald-900 text-emerald-100 text-center text-[10px] py-1">
            ✓ WhatsApp bot received your response and logged it to the applicant file.
          </div>)}

      </div>
    </div>);
};
