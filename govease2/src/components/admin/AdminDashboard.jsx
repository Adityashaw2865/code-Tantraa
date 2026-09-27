import React, { useState, useEffect } from 'react';
import { getSession } from '../../services/authService';
import { fetchOfficers, assignOfficerAPI } from '../../services/dataService';
import { GrievanceActions } from './GrievanceActions';
import { UserManagement } from './UserManagement';
import { AnalyticsPanel } from './AnalyticsPanel';
import { ApplicationsExplorer } from './ApplicationsExplorer';
import { CatalogManagement } from './CatalogManagement';
import { downloadCsv } from '../../utils/csv';
import { Sliders, BarChart3, FileText, AlertTriangle, Search, Users, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RoleHeaderBanner } from '../common/RoleHeaderBanner';
export const AdminDashboard = () => {
    const { regulatoryRules, adminUpdateRule, auditLogs, grievances, applications, departments, currentUser, resetToDemoDefaults, loadWorkspace } = useApp();
    const [officers, setOfficers] = useState([]);
    useEffect(() => {
        const se = getSession();
        if (se)
            fetchOfficers(se.token).then(setOfficers).catch(() => { });
    }, []);
    const assignOfficer = async (appId, officerId) => {
        const se = getSession();
        const o = officers.find(x => x.id === officerId);
        if (!se || !o)
            return;
        try {
            await assignOfficerAPI(se.token, appId, o.id, o.name);
            loadWorkspace();
        }
        catch (e) {
            alert(e.message);
        }
    };
    const [activeTab, setActiveTab] = useState('rules');
    const [editingRule, setEditingRule] = useState(null);
    const [auditSearch, setAuditSearch] = useState('');
    const filteredLogs = auditLogs.filter(log => {
        const q = auditSearch.toLowerCase();
        return log.action.toLowerCase().includes(q) ||
            log.userName.toLowerCase().includes(q) ||
            log.description.toLowerCase().includes(q) ||
            log.entityId.toLowerCase().includes(q);
    });
    const handleSaveRule = () => {
        if (!editingRule)
            return;
        adminUpdateRule(editingRule);
        setEditingRule(null);
        alert(`Rule ${editingRule.ruleCode} statutory parameters updated successfully in active engine.`);
    };
    return (<div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3">Assign Officers to Applications</h3>
        {applications.length === 0 ? (<p className="text-xs text-slate-500">No applications yet.</p>) : (<div className="divide-y divide-slate-100">
            {applications.map(a => (<div key={a.id} className="py-2 flex items-center justify-between gap-3 text-xs">
                <span><span className="font-mono font-bold">{a.applicationNumber}</span> · {a.status}</span>
                <select value={a.assignedOfficerId || ''} onChange={e => assignOfficer(a.id, e.target.value)} className="p-1.5 border border-slate-300 rounded-md bg-white">
                  <option value="" disabled>Select officer</option>
                  {officers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>))}
          </div>)}
      </div>

      
      {/* Top Banner */}
      <RoleHeaderBanner role="admin">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-400/30">
                STATE PORTAL SUPER ADMINISTRATION
              </span>
              <span className="text-xs text-slate-400">MAITRI & MSInS Core System Gateway</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              {currentUser.name}
            </h2>
            <p className="text-xs text-slate-400">{currentUser.designation}</p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={resetToDemoDefaults} className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 cursor-pointer">
              <RotateCcw className="w-3.5 h-3.5 text-amber-400"/>
              <span>Reset State to Seed</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 pt-3 overflow-x-auto text-xs">
          {[
            { id: 'rules', label: 'Regulatory Rules Engine', icon: Sliders },
            { id: 'analytics', label: 'Throughput & Bottlenecks', icon: BarChart3 },
            { id: 'audit', label: `Immutable Audit Ledger (${auditLogs.length})`, icon: FileText },
            { id: 'grievances', label: `RTSA Grievances (${grievances.length})`, icon: AlertTriangle },
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'applications', label: 'Applications Explorer', icon: FileText },
            { id: 'catalog', label: 'Departments & Approvals', icon: Sliders }
        ].map(tab => {
            const Icon = tab.icon;
            return (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'}`}>
                <Icon className="w-3.5 h-3.5"/>
                <span>{tab.label}</span>
              </button>);
        })}
        </div>
      </RoleHeaderBanner>

      {/* Tab 1: Regulatory Rules Engine */}
      {activeTab === 'rules' && (<div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Active Statutory Rules & SLA Configuration
              </h3>
              <p className="text-xs text-slate-500">
                Modify statutory timelines, fees, and legal citations dynamically without altering application source code.
              </p>
            </div>
            <span className="text-[11px] font-mono text-purple-900 bg-purple-50 px-2 py-1 rounded-md border border-purple-200 self-start sm:self-auto font-semibold">
              Live Regulatory Engine v2.4
            </span>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
            {regulatoryRules.map(rule => (<div key={rule.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {rule.ruleCode}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{rule.ruleName || rule.approvalName}</span>
                    <span className="text-[10px] font-semibold text-slate-500">({rule.issuingDepartment || rule.departmentId})</span>
                  </div>
                  <p className="text-slate-600 text-[11px] font-mono">
                    Statutory Gazette: {rule.statutoryActReference || rule.officialActSource}
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Condition: {rule.statutoryConditionSummary || rule.triggerConditionsDescription}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-left md:text-right font-mono text-xs">
                    <span className="text-slate-500 block text-[10px]">Statutory SLA</span>
                    <strong className="text-purple-900">{rule.statutorySlaDays} Days</strong>
                  </div>

                  <div className="text-left md:text-right font-mono text-xs">
                    <span className="text-slate-500 block text-[10px]">Statutory Fee</span>
                    <strong className="text-slate-900">₹{rule.statutoryFee.toLocaleString('en-IN')}</strong>
                  </div>

                  <button onClick={() => setEditingRule(rule)} className="px-3 py-1.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-900 font-semibold border border-purple-200 cursor-pointer text-xs">
                    Edit Rule
                  </button>
                </div>
              </div>))}
          </div>
        </div>)}

      {/* Tab 2: System Analytics & Bottlenecks */}
      {activeTab === 'analytics' && <AnalyticsPanel />}

      {/* Tab 3: Immutable Audit Ledger */}
      {activeTab === 'audit' && (<div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex justify-end">
            <button onClick={() => downloadCsv('audit-ledger.csv', [{ key: 'timestamp', label: 'Time' }, { key: 'userName', label: 'User' }, { key: 'userRole', label: 'Role' }, { key: 'action', label: 'Action' }, { key: 'entityType', label: 'Entity' }, { key: 'entityId', label: 'Entity ID' }, { key: 'description', label: 'Description' }, { key: 'ipAddress', label: 'IP' }], filteredLogs)} className="text-[11px] px-2.5 py-1 rounded-md border border-slate-300 hover:bg-slate-50 cursor-pointer">
              Export CSV ({filteredLogs.length})
            </button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Immutable Statutory Audit Ledger
              </h3>
              <p className="text-xs text-slate-500">
                Cryptographically logged records of all application state transitions, document evaluations, and queries.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5"/>
              <input type="text" placeholder="Search audit trail..." value={auditSearch} onChange={e => setAuditSearch(e.target.value)} className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-md text-xs"/>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {filteredLogs.map(log => (<div key={log.id} className="py-2.5 hover:bg-slate-50 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-500">{log.timestamp}</span>
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="font-mono text-[10px] bg-slate-100 px-1 rounded-md text-slate-600">
                      {log.entityType} ({log.entityId})
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">IP: {log.ipAddress}</span>
                </div>
                <p className="text-slate-600 text-[11px]">{log.description}</p>
                <div className="text-[10px] text-slate-500">
                  Actor: <strong>{log.userName}</strong> ({log.userRole})
                </div>
              </div>))}
          </div>
        </div>)}

      {/* Tab 4: Grievances */}
      {activeTab === 'grievances' && (<div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Right to Public Services Act (RTSA) Grievances
              </h3>
              <p className="text-xs text-slate-500">
                Statutory appeals and SLA escalation tracking for industrial applicants.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {grievances.map(grv => (<div key={grv.id} className="p-4 rounded-lg border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-red-900 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                      {grv.grievanceNumber}
                    </span>
                    <h4 className="font-bold text-slate-900">{grv.subject}</h4>
                  </div>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                    {grv.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-slate-600 text-xs">{grv.description}</p>
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                  <span>Applicant: {grv.applicantName} ({grv.businessName})</span>
                  <span>Registered: {grv.createdDate}</span>
                </div>
                {grv.officialResolutionRemarks && <p className="text-[11px] text-emerald-700">Resolution: {grv.officialResolutionRemarks}</p>}
                <GrievanceActions grievance={grv} onSaved={loadWorkspace}/>
              </div>))}
          </div>
        </div>)}

      {activeTab === 'users' && <UserManagement />}
      {activeTab === 'applications' && <ApplicationsExplorer />}
      {activeTab === 'catalog' && <CatalogManagement />}

      {/* Edit Rule Modal */}
      {editingRule && (<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">
                Edit Statutory Rule: {editingRule.ruleCode}
              </h3>
              <button onClick={() => setEditingRule(null)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rule Name</label>
                <input type="text" value={editingRule.ruleName || editingRule.approvalName} onChange={e => setEditingRule({ ...editingRule, ruleName: e.target.value, approvalName: e.target.value })} className="w-full p-2 border border-slate-300 rounded-md text-xs"/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Statutory SLA Days</label>
                  <input type="number" value={editingRule.statutorySlaDays} onChange={e => setEditingRule({ ...editingRule, statutorySlaDays: parseInt(e.target.value) || 1 })} className="w-full p-2 border border-slate-300 rounded-md text-xs font-mono font-bold"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Statutory Fee (INR)</label>
                  <input type="number" value={editingRule.statutoryFee} onChange={e => setEditingRule({ ...editingRule, statutoryFee: parseInt(e.target.value) || 0 })} className="w-full p-2 border border-slate-300 rounded-md text-xs font-mono font-bold"/>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Statutory Legal Act Reference</label>
                <input type="text" value={editingRule.statutoryActReference || editingRule.officialActSource} onChange={e => setEditingRule({ ...editingRule, statutoryActReference: e.target.value, officialActSource: e.target.value })} className="w-full p-2 border border-slate-300 rounded-md text-xs font-mono text-[11px]"/>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-end gap-2 text-xs">
              <button onClick={() => setEditingRule(null)} className="px-3 py-1.5 bg-slate-100 rounded-md text-slate-700 cursor-pointer">Cancel</button>
              <button onClick={handleSaveRule} className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-md font-semibold cursor-pointer shadow-xs">
                Save Statutory Rule
              </button>
            </div>
          </div>
        </div>)}

    </div>);
};
