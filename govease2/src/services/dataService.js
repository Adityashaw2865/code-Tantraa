import { clearSession } from './authService';
function onUnauthorized() {
    clearSession();
    ['applications', 'documents', 'queries', 'inspections', 'licences', 'notifications', 'grievances', 'business'].forEach(k => localStorage.removeItem('govease_v2_' + k));
    window.location.reload();
}
const API_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5050';
async function get(path, token) {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401) {
        onUnauthorized();
        throw new Error('Session expired');
    }
    if (!res.ok)
        throw new Error(`GET ${path} failed (${res.status})`);
    return res.json();
}
async function send(method, path, token, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: body !== undefined ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
        onUnauthorized();
        throw new Error('Session expired');
    }
    if (!res.ok) {
        const detail = data.details ? ': ' + Object.keys(data.details).join(', ') : '';
        throw new Error((data.error || `${method} ${path} failed (${res.status})`) + detail);
    }
    return data;
}
export async function fetchPublicApprovalTypes() {
    try {
        const res = await fetch(`${API_BASE}/api/approval-types`);
        if (!res.ok)
            return [];
        const data = await res.json();
        return data.approvalTypes || [];
    }
    catch {
        return [];
    }
}
export async function fetchMyBusinesses(token) {
    const { businessProfiles } = await get('/api/business-profiles/mine-all', token);
    return (businessProfiles || []).map(b => ({ ...b, id: b.id || b._id }));
}
export async function fetchMyWorkspace(token) {
    const safe = async (p) => {
        try {
            return await get(p, token);
        }
        catch {
            return null;
        }
    };
    const [applications, documents, notifications, inspections, licences, grievances, business, queries] = await Promise.all([
        safe('/api/applications'),
        safe('/api/documents'),
        safe('/api/notifications'),
        safe('/api/inspections'),
        safe('/api/licences'),
        safe('/api/grievances'),
        safe('/api/business-profiles/mine'),
        safe('/api/queries')
    ]);
    const flat = (v) => (v && typeof v === 'object' && v._id ? v._id : v);
    return {
        applications: applications?.applications?.map((a) => ({
            ...a,
            businessName: (a.businessId && typeof a.businessId === 'object') ? a.businessId.businessName : undefined,
            businessId: flat(a.businessId), approvalTypeId: flat(a.approvalTypeId), departmentId: flat(a.departmentId)
        })) ?? null,
        documents: documents?.documents ?? null,
        notifications: notifications?.notifications ?? null,
        inspections: inspections?.inspections?.map((i) => ({
            ...i, applicationId: flat(i.applicationId),
            checklist: (i.checklist || []).map((c) => ({ ...c, id: c._id }))
        })) ?? null,
        licences: licences?.licences ?? null,
        grievances: grievances?.grievances ?? null,
        business: business?.businessProfile ?? null,
        queries: queries?.queries?.map((q) => ({ ...q, applicationId: flat(q.applicationId) })) ?? null
    };
}
export async function saveBusinessProfile(token, existingId, payload) {
    if (existingId) {
        const { businessProfile } = await send('PATCH', `/api/business-profiles/${existingId}`, token, payload);
        return businessProfile;
    }
    const { businessProfile } = await send('POST', '/api/business-profiles', token, payload);
    return businessProfile;
}
export async function createApplicationAPI(token, businessId, approvalTypeId, departmentId, renewalOfLicenceId) {
    const { application } = await send('POST', '/api/applications', token, { businessId, approvalTypeId, departmentId, renewalOfLicenceId });
    return application;
}
export async function submitApplicationAPI(token, applicationId) {
    const { application } = await send('POST', `/api/applications/${applicationId}/submit`, token);
    return application;
}
const NEXT = {
    draft: ['ready_for_submission'], ready_for_submission: ['submitted'],
    submitted: ['under_verification', 'rejected'],
    under_verification: ['query_raised', 'inspection_required', 'under_final_review', 'rejected'],
    query_raised: ['documents_resubmitted', 'rejected'],
    documents_resubmitted: ['under_verification'],
    inspection_required: ['inspection_scheduled'], inspection_scheduled: ['inspection_completed'],
    inspection_completed: ['under_final_review', 'query_raised'],
    under_final_review: ['approved', 'rejected', 'query_raised'], approved: [], rejected: []
};
function pathTo(from, to) {
    const q = [[from]];
    const seen = new Set([from]);
    while (q.length) {
        const p = q.shift();
        const last = p[p.length - 1];
        if (last === to)
            return p.slice(1);
        for (const n of NEXT[last] || [])
            if (!seen.has(n)) {
                seen.add(n);
                q.push([...p, n]);
            }
    }
    return [];
}
export async function moveApplicationStatus(token, id, current, target, remarks) {
    const steps = pathTo(current, target);
    if (!steps.length)
        throw new Error(`Cannot move from '${current}' to '${target}'`);
    let application;
    for (const status of steps) {
        const last = status === target;
        const body = { status, remarks: last ? remarks : undefined };
        if (last && status === 'rejected')
            body.rejectionReason = remarks;
        ({ application } = await send('PATCH', `/api/applications/${id}/status`, token, body));
    }
    return application;
}
export async function issueLicenceAPI(token, applicationId, validityYears, departmentName) {
    const { licence } = await send('POST', '/api/licences', token, { applicationId, validityYears, departmentName });
    return licence;
}
export async function fetchInspectors(token) {
    const data = await get('/api/users/inspectors', token);
    return (data.inspectors || []).map((u) => ({ id: u._id, name: u.name, designation: u.designation }));
}
export async function scheduleInspectionAPI(token, payload) {
    const { inspection } = await send('POST', '/api/inspections', token, payload);
    return inspection;
}
export async function saveChecklistAPI(token, inspectionId, checklist) {
    const { inspection } = await send('PATCH', `/api/inspections/${inspectionId}/checklist`, token, { checklist });
    return inspection;
}
export async function submitInspectionReportAPI(token, inspectionId, body) {
    const { inspection } = await send('POST', `/api/inspections/${inspectionId}/submit-report`, token, body);
    return inspection;
}
const API = API_BASE;
export async function uploadDocumentAPI(token, file, meta) {
    const fd = new FormData();
    Object.entries(meta).forEach(([k, v]) => fd.append(k, v));
    fd.append('file', file);
    const res = await fetch(`${API}/api/documents`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
        throw new Error(data.error || `Upload failed (${res.status})`);
    return data.document;
}
export async function verifyDocumentAPI(token, id, verificationStatus, rejectionReason) {
    return send('PATCH', `/api/documents/${id}/verify`, token, { verificationStatus, rejectionReason });
}
export async function deleteDocumentAPI(token, id) {
    const res = await fetch(`${API}/api/documents/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok)
        throw new Error(`Delete failed (${res.status})`);
}
export async function submitGrievanceAPI(token, payload) {
    const { grievance } = await send('POST', '/api/grievances', token, payload);
    return grievance;
}
export const markNotificationReadAPI = (token, id) => send('PATCH', `/api/notifications/${id}/read`, token);
export const markAllNotificationsReadAPI = (token) => send('PATCH', '/api/notifications/read-all', token);
export const raiseQueryAPI = (token, body) => send('POST', '/api/queries', token, body);
export const respondQueryAPI = (token, id, body) => send('PATCH', `/api/queries/${id}/respond`, token, body);
export async function fetchOfficers(token) {
    const data = await get('/api/users/officers', token);
    return (data.officers || []).map((u) => ({ id: u._id, name: u.name }));
}
export async function assignOfficerAPI(token, applicationId, officerId, officerName) {
    const { application } = await send('PATCH', `/api/applications/${applicationId}/assign-officer`, token, { officerId, officerName });
    return application;
}
export async function openDocumentFile(token, id) {
    const res = await fetch(`${API}/api/documents/${id}/download`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok)
        throw new Error('Could not open file');
    const blob = await res.blob();
    window.open(URL.createObjectURL(blob), '_blank');
}
export async function fetchAuditLogs(token) {
    const data = await get('/api/audit-logs', token);
    return (data.logs || []).map((l) => ({
        ...l, id: l._id,
        timestamp: String(l.timestamp || '').replace('T', ' ').slice(0, 19)
    }));
}
export async function updateApprovalTypeAPI(token, id, payload) {
    const res = await fetch(`${API}/api/approval-types/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
        throw new Error(data.error || `Update failed (${res.status})`);
    return data.approvalType;
}
export async function updateGrievanceAPI(token, id, payload) {
    const res = await fetch(`${API}/api/grievances/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
        throw new Error(data.error || `Update failed (${res.status})`);
    return data.grievance;
}
export async function fetchUsers(token) {
    const data = await get('/api/users', token);
    return (data.users || []).map((u) => ({ ...u, id: u.id || u._id }));
}
export const createUserAPI = (token, body) => send('POST', '/api/users', token, body);
export const deactivateUserAPI = (token, id) => send('PATCH', `/api/users/${id}/deactivate`, token);
export async function verifyLicenceAPI(code) {
    try {
        const res = await fetch(`${API}/api/licences/verify/${encodeURIComponent(code.trim())}`);
        if (!res.ok)
            return null;
        const data = await res.json();
        return data.valid ? data.licence : null;
    }
    catch {
        return null;
    }
}
export async function downloadCertificate(token, licenceId, licenceNumber) {
    const res = await fetch(`${API}/api/licences/${licenceId}/certificate`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok)
        throw new Error('Could not download certificate');
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement('a');
    a.href = url;
    a.download = `${licenceNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}
export const fetchAnalytics = (token) => get('/api/analytics/summary', token);
export async function fetchApplicationsRaw(token) {
    const data = await get('/api/applications', token);
    return data.applications || [];
}
export async function saveDepartmentAPI(token, id, payload) {
    const data = await send(id ? 'PATCH' : 'POST', id ? `/api/departments/${id}` : '/api/departments', token, payload);
    return data.department;
}
export async function saveApprovalTypeAPI(token, id, payload) {
    const data = await send(id ? 'PATCH' : 'POST', id ? `/api/approval-types/${id}` : '/api/approval-types', token, payload);
    return data.approvalType;
}
export async function createPaymentAPI(token, businessId, approvalTypeIds, method) {
    const res = await fetch(`${API}/api/payments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ businessId, approvalTypeIds, method })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
        throw new Error(data.error || `Payment failed (${res.status})`);
    return data.payment;
}
// --- Survey insights (public, no auth needed - anyone can view or submit) ---
export async function fetchSurveySummary() {
    const res = await fetch(`${API}/api/surveys/summary`);
    if (!res.ok)
        throw new Error('Could not load survey insights');
    return res.json();
}
export async function submitSurveyResponse(payload) {
    const res = await fetch(`${API}/api/surveys`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
        throw new Error(data.error || `Could not submit survey (${res.status})`);
    return data.response;
}
export async function downloadPaymentReceipt(token, paymentId, grnNumber) {
    const res = await fetch(`${API}/api/payments/${paymentId}/receipt`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok)
        throw new Error('Could not download receipt');
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement('a');
    a.href = url;
    a.download = `${grnNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}