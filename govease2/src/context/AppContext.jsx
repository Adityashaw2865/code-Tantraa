import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_USERS, INITIAL_BUSINESS, DEPARTMENTS, APPROVAL_TYPES, INITIAL_APPLICATIONS, INITIAL_DOCUMENTS, INITIAL_INSPECTIONS, INITIAL_LICENCES, INITIAL_SCHEMES, INITIAL_NOTIFICATIONS, INITIAL_GRIEVANCES, INITIAL_AUDIT_LOGS, INITIAL_REGULATORY_RULES, INITIAL_QUERIES } from '../data/initialData';
import { calculateApplicationRisk } from '../services/rulesEngine';
import { getSession } from '../services/authService';
import { uploadDocumentAPI, verifyDocumentAPI, deleteDocumentAPI, submitGrievanceAPI, markNotificationReadAPI, markAllNotificationsReadAPI, raiseQueryAPI, respondQueryAPI, fetchInspectors, scheduleInspectionAPI, saveChecklistAPI, submitInspectionReportAPI, moveApplicationStatus, issueLicenceAPI, fetchMyWorkspace, fetchMyBusinesses, saveBusinessProfile, createApplicationAPI, submitApplicationAPI, fetchAuditLogs, updateApprovalTypeAPI } from '../services/dataService';
// Mongo documents come back as _id; the whole UI expects `id`.
function normalize(items) {
    if (!items)
        return null;
    return items.map(item => ({ ...item, id: item.id || item._id }));
}
const AppContext = createContext(undefined);
const STORAGE_KEY_PREFIX = 'govease_v2_';
const isServerId = (id) => /^[a-f0-9]{24}$/i.test(String(id));
// Blank template: inspector fills every item during the visit.
const DEFAULT_CHECKLIST = [
    { itemText: 'Fire exits, extinguishers and emergency access', standardReference: 'NBC 2016 Part 4' },
    { itemText: 'Fire water storage and pumps', standardReference: 'IS 13039' },
    { itemText: 'Ventilation, emergency lighting and exit signage', standardReference: 'Factories Act Sec 13 & 38' },
    { itemText: 'Machine guarding and worker safety', standardReference: 'Factories Act Sec 21' }
];
export const AppProvider = ({ children }) => {
    const [language, setLanguageState] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'language');
        return saved || 'mr'; // Default to Marathi / state official language with quick toggle
    });
    const setLanguage = (lang) => {
        setLanguageState(lang);
        localStorage.setItem(STORAGE_KEY_PREFIX + 'language', lang);
    };
    const [currentRole, setCurrentRoleState] = useState(() => {
        const sess = getSession();
        if (sess)
            return sess.user.role; // logged in: role always comes from the account
        const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'role');
        return saved && saved in DEMO_USERS ? saved : 'applicant';
    });
    const sessionUser = getSession()?.user;
    const currentUser = (sessionUser ? { ...DEMO_USERS[sessionUser.role], ...sessionUser } : DEMO_USERS[currentRole] || DEMO_USERS.applicant);
    const [business, setBusiness] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'business');
        return saved ? JSON.parse(saved) : INITIAL_BUSINESS;
    });
    const [businesses, setBusinesses] = useState([]);
    const switchBusiness = (id) => {
        const found = businesses.find(b => b.id === id);
        if (found) {
            setBusiness(found);
            addAuditLog?.('BUSINESS_SWITCHED', 'User', id, `Switched active business to ${found.businessName}`);
        }
    };
    const [departments, setDepartments] = useState(DEPARTMENTS);
    const [approvalTypes, setApprovalTypes] = useState(APPROVAL_TYPES);
    // Reference data (public endpoints) from backend
    const loadCatalog = () => {
        const base = import.meta.env?.VITE_API_URL || 'http://localhost:5050';
        fetch(base + '/api/departments').then(r => r.json()).then(d => setDepartments(normalize(d.departments) || [])).catch(() => { });
        fetch(base + '/api/approval-types').then(r => r.json()).then(d => setApprovalTypes(normalize(d.approvalTypes) || [])).catch(() => { });
    };
    useEffect(loadCatalog, []);
    // Admin "rules engine" = the approval-type master list (SLA / fee / legal reference) from the backend.
    useEffect(() => {
        if (getSession()?.user.role !== 'admin' || !approvalTypes.length)
            return;
        setRegulatoryRules(approvalTypes.map((at) => {
            const dep = at.departmentId && typeof at.departmentId === 'object' ? at.departmentId : null;
            return {
                id: at.id, ruleCode: at.shortCode, ruleName: at.approvalName, approvalName: at.approvalName,
                departmentId: dep?._id || at.departmentId, issuingDepartment: dep?.name,
                applicableSector: Array.isArray(at.applicableSectors) ? at.applicableSectors.join(', ') : (at.applicableSectors || 'All'),
                state: 'Maharashtra', triggerConditionsDescription: at.description || '',
                statutorySlaDays: at.processingSLADays, statutoryFee: at.statutoryFeeINR || 0,
                officialActSource: at.officialSource || '', statutoryActReference: at.legalActReference,
                effectiveDate: String(at.createdAt || '').slice(0, 10), lastReviewedDate: String(at.updatedAt || '').slice(0, 10),
                status: 'Active'
            };
        }));
    }, [approvalTypes, currentRole]);
    const [applications, setApplications] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'applications');
        return saved ? JSON.parse(saved) : INITIAL_APPLICATIONS;
    });
    const [documents, setDocuments] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'documents');
        return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
    });
    const [queries, setQueries] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'queries');
        return saved ? JSON.parse(saved) : INITIAL_QUERIES;
    });
    const [inspections, setInspections] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'inspections');
        return saved ? JSON.parse(saved) : INITIAL_INSPECTIONS;
    });
    const [licences, setLicences] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'licences');
        return saved ? JSON.parse(saved) : INITIAL_LICENCES;
    });
    const [schemes] = useState(INITIAL_SCHEMES);
    const [notifications, setNotifications] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'notifications');
        return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    });
    const [grievances, setGrievances] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'grievances');
        return saved ? JSON.parse(saved) : INITIAL_GRIEVANCES;
    });
    const [auditLogs, setAuditLogs] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'auditLogs');
        return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    });
    const [regulatoryRules, setRegulatoryRules] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'rules');
        return saved ? JSON.parse(saved) : INITIAL_REGULATORY_RULES;
    });
    const [activeDemoStep, setActiveDemoStep] = useState(1);
    // Sync state to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'role', currentRole);
    }, [currentRole]);
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'business', JSON.stringify(business));
    }, [business]);
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'applications', JSON.stringify(applications));
    }, [applications]);
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'documents', JSON.stringify(documents));
    }, [documents]);
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'queries', JSON.stringify(queries));
    }, [queries]);
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'inspections', JSON.stringify(inspections));
    }, [inspections]);
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'licences', JSON.stringify(licences));
    }, [licences]);
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'notifications', JSON.stringify(notifications));
    }, [notifications]);
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'grievances', JSON.stringify(grievances));
    }, [grievances]);
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'auditLogs', JSON.stringify(auditLogs));
    }, [auditLogs]);
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'rules', JSON.stringify(regulatoryRules));
    }, [regulatoryRules]);
    const setCurrentRole = (role) => {
        const sess = getSession();
        if (sess && role !== sess.user.role)
            return; // cannot impersonate other roles while logged in
        setCurrentRoleState(role);
    };
    // When logged in, the server is the source of truth: replace local demo data
    // with the user's real data. If a call fails (null), keep what we have.
    const [inspectors, setInspectors] = useState([]);
    const loadWorkspace = () => {
        const session = getSession();
        if (!session)
            return;
        if (session.user.role === 'officer' || session.user.role === 'admin') {
            fetchInspectors(session.token).then(setInspectors).catch(() => { });
        }
        if (session.user.role === 'admin') {
            fetchAuditLogs(session.token).then(l => setAuditLogs(l)).catch(() => { });
        }
        fetchMyWorkspace(session.token).then(data => {
            if (data.applications)
                setApplications(normalize(data.applications));
            if (data.documents)
                setDocuments(normalize(data.documents));
            if (data.notifications)
                setNotifications(normalize(data.notifications));
            if (data.inspections)
                setInspections(normalize(data.inspections));
            if (data.licences)
                setLicences(normalize(data.licences));
            if (data.grievances)
                setGrievances(normalize(data.grievances));
            if (data.queries)
                setQueries(normalize(data.queries));
            if (data.business)
                setBusiness({ ...data.business, id: data.business.id || data.business._id });
        }).catch(() => { });
        if (currentRole === 'applicant') {
            fetchMyBusinesses(session.token).then(setBusinesses).catch(() => { });
        }
    };
    useEffect(loadWorkspace, [currentRole]);
    const addAuditLog = (action, entityType, entityId, description, prevVal, newVal) => {
        const now = new Date();
        const timestamp = now.toISOString().replace('T', ' ').slice(0, 19);
        const newLog = {
            id: 'aud_' + Date.now(),
            timestamp,
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            action,
            entityType,
            entityId,
            description,
            ipAddress: '164.100.140.' + Math.floor(10 + Math.random() * 80),
            previousValue: prevVal,
            newValue: newVal
        };
        setAuditLogs(prev => [newLog, ...prev]);
    };
    const addNotification = (userId, title, message, category, urgency = 'normal', actionUrl, relatedEntityId) => {
        const now = new Date();
        const timestamp = now.toISOString().replace('T', ' ').slice(0, 16);
        const newNotif = {
            id: 'notif_' + Date.now(),
            userId,
            title,
            message,
            category,
            timestamp,
            isRead: false,
            urgency,
            actionUrl,
            relatedEntityId
        };
        setNotifications(prev => [newNotif, ...prev]);
    };
    const updateBusinessProfile = (updates, forceCreate = false) => {
        const updated = forceCreate ? { ...updates, id: null } : { ...business, ...updates };
        setBusiness(updated);
        addAuditLog('BUSINESS_PROFILE_UPDATED', 'User', updated.id || 'new', `${forceCreate ? 'Created new' : 'Updated'} business profile: ${Object.keys(updates).join(', ')}`);
        // Sync to the backend when logged in (create the first time / forceCreate, patch afterwards).
        const session = getSession();
        if (session) {
            const isRealId = !forceCreate && updated.id && !String(updated.id).startsWith('biz_') && !String(updated.id).startsWith('user_');
            saveBusinessProfile(session.token, isRealId ? updated.id : null, updated)
                .then(saved => {
                const normalized = { ...updated, ...saved, id: saved.id || saved._id };
                setBusiness(normalized);
                setBusinesses(prev => {
                    const exists = prev.some(b => b.id === normalized.id);
                    return exists ? prev.map(b => b.id === normalized.id ? normalized : b) : [normalized, ...prev];
                });
            })
                .catch(err => {
                console.error('[updateBusinessProfile] backend sync failed:', err.message);
                alert('Business profile could not be saved: ' + err.message);
            });
        }
    };
    const createApplication = async (approvalTypeId, renewalOfLicenceId) => {
        const approval = approvalTypes.find(a => a.id === approvalTypeId);
        if (!approval)
            throw new Error('Invalid approval type');
        const session = getSession();
        if (session && business.id && !String(business.id).startsWith('biz_') && !String(business.id).startsWith('user_')) {
            // Real backend path: create the application server-side, server computes risk/status.
            const created = await createApplicationAPI(session.token, business.id, approval.id, approval.departmentId, renewalOfLicenceId);
            const newApp = { ...created, id: created.id || created._id };
            setApplications(prev => [newApp, ...prev]);
            addAuditLog('APPLICATION_DRAFT_CREATED', 'Application', newApp.id, `Created draft for ${approval.approvalName}`);
            return newApp;
        }
        if (session) {
            throw new Error('Please save your business profile first (Edit Project Wizard), then apply.');
        }
        // Fallback: no backend session yet (or business profile hasn't been saved to the
        // server) — keep the original local/demo behaviour so nothing breaks.
        const appNumber = `APP-2026-${Math.floor(10000 + Math.random() * 90000)}`;
        const now = new Date();
        const nowStr = now.toISOString();
        const matchingDocIds = documents
            .filter(d => approval.requiredDocumentKeys.includes(d.documentKey))
            .map(d => d.id);
        const missingCount = approval.requiredDocumentKeys.length - matchingDocIds.length;
        const risk = calculateApplicationRisk(approval, business, missingCount);
        const newApp = {
            id: 'app_' + Date.now(),
            applicationNumber: appNumber,
            businessId: business.id,
            approvalTypeId: approval.id,
            departmentId: approval.departmentId,
            status: 'draft',
            riskLevel: risk.riskLevel,
            riskFactors: risk.riskFactors,
            completenessScorePercent: Math.round((matchingDocIds.length / Math.max(1, approval.requiredDocumentKeys.length)) * 100),
            attachedDocumentIds: matchingDocIds,
            createdAt: nowStr,
            updatedAt: nowStr,
            history: [
                {
                    id: 'h_' + Date.now(),
                    timestamp: nowStr.replace('T', ' ').slice(0, 16),
                    actorName: currentUser.name,
                    actorRole: currentUser.role,
                    action: 'Draft Created',
                    details: `Application initialized for ${approval.approvalName}`
                }
            ]
        };
        setApplications(prev => [newApp, ...prev]);
        addAuditLog('APPLICATION_DRAFT_CREATED', 'Application', newApp.id, `Created draft ${appNumber} for ${approval.approvalName}`);
        return newApp;
    };
    const submitApplication = async (applicationId) => {
        const app = applications.find(a => a.id === applicationId);
        if (!app)
            return;
        const approval = approvalTypes.find(a => a.id === app.approvalTypeId);
        const session = getSession();
        const isRealAppId = !String(applicationId).startsWith('app_');
        if (session && isRealAppId) {
            try {
                const updated = await submitApplicationAPI(session.token, applicationId);
                const normalized = { ...updated, id: updated.id || updated._id };
                setApplications(prev => prev.map(a => a.id === applicationId ? normalized : a));
                addAuditLog('APPLICATION_SUBMITTED', 'Application', app.id, `Applicant submitted ${app.applicationNumber} to department.`);
                return;
            }
            catch (err) {
                // Never fake a submit locally when logged in: show the real reason and resync with the server.
                alert(err.message || 'Submit failed');
                loadWorkspace();
                return;
            }
        }
        // Fallback: local/demo behaviour (no session, or this is a locally-created draft
        // that was never persisted to the server).
        const now = new Date();
        const slaTarget = new Date(now.getTime() + (approval?.processingSLADays || 21) * 24 * 60 * 60 * 1000);
        const dateStr = now.toISOString().replace('T', ' ').slice(0, 16);
        const updatedApp = {
            ...app,
            status: 'submitted',
            submissionDate: now.toISOString().slice(0, 10),
            targetSLADate: slaTarget.toISOString().slice(0, 10),
            assignedOfficerId: currentUser.id,
            assignedOfficerName: 'Nodal Officer',
            updatedAt: now.toISOString(),
            history: [
                ...app.history,
                {
                    id: 'h_' + Date.now(),
                    timestamp: dateStr,
                    actorName: currentUser.name,
                    actorRole: currentUser.role,
                    action: 'Application Submitted',
                    details: `Submitted online with statutory SLA target of ${approval?.processingSLADays || 21} days`
                }
            ]
        };
        setApplications(prev => prev.map(a => a.id === applicationId ? updatedApp : a));
        addAuditLog('APPLICATION_SUBMITTED', 'Application', app.id, `Applicant submitted ${app.applicationNumber} to department. Target SLA: ${updatedApp.targetSLADate}`);
        addNotification(currentUser.id, `New Application: ${app.applicationNumber}`, `Application for ${approval?.approvalName} submitted by ${business.businessName}. Immediate document scrutiny required.`, 'application', 'normal', `/officer`, app.id);
    };
    const officerVerifyDocument = (docId, status, reason) => {
        const doc = documents.find(d => d.id === docId);
        if (!doc)
            return;
        const session = getSession();
        if (session && isServerId(docId)) {
            verifyDocumentAPI(session.token, docId, status, reason).catch((e) => alert(e.message)).then(loadWorkspace);
            return;
        }
        setDocuments(prev => prev.map(d => {
            if (d.id === docId) {
                return {
                    ...d,
                    verificationStatus: status,
                    verifiedBy: currentUser.name,
                    verificationDate: new Date().toISOString().slice(0, 10),
                    rejectionReason: reason
                };
            }
            return d;
        }));
        addAuditLog(status === 'verified' ? 'DOCUMENT_VERIFIED' : 'DOCUMENT_REJECTED', 'Document', docId, `Officer ${currentUser.name} marked ${doc.name} as ${status.toUpperCase()}${reason ? ': ' + reason : ''}`);
        addNotification(currentUser.id, `Document ${status === 'verified' ? 'Verified' : 'Rejected'}: ${doc.name}`, status === 'verified'
            ? `${doc.name} was successfully verified by ${currentUser.name}.`
            : `${doc.name} was rejected. Reason: ${reason || 'Incomplete or illegible document.'}`, 'application', status === 'verified' ? 'normal' : 'high');
    };
    const officerRaiseQuery = (applicationId, subject, text, docKey) => {
        const app = applications.find(a => a.id === applicationId);
        if (!app)
            return;
        const session = getSession();
        if (session && !String(applicationId).startsWith('app_')) {
            return (async () => {
                try {
                    await moveApplicationStatus(session.token, applicationId, app.status, 'query_raised', `${subject}: ${text}`);
                    await raiseQueryAPI(session.token, { applicationId, subject, queryText: text, requestedDocumentKey: docKey });
                }
                catch (e) {
                    alert(e.message || 'Action failed');
                }
                loadWorkspace();
            })();
        }
        const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const newQuery = {
            id: 'qry_' + Date.now(),
            applicationId,
            officerId: currentUser.id,
            officerName: currentUser.name,
            subject,
            queryText: text,
            requestedDocumentKey: docKey,
            raisedDate: new Date().toISOString().slice(0, 10),
            deadlineDate: deadline,
            isResolved: false
        };
        setQueries(prev => [newQuery, ...prev]);
        // Update application status to query_raised
        const dateStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
        setApplications(prev => prev.map(a => {
            if (a.id === applicationId) {
                return {
                    ...a,
                    status: 'query_raised',
                    updatedAt: new Date().toISOString(),
                    history: [
                        ...a.history,
                        {
                            id: 'h_' + Date.now(),
                            timestamp: dateStr,
                            actorName: currentUser.name,
                            actorRole: currentUser.role,
                            action: 'Clarification Query Raised',
                            details: subject
                        }
                    ]
                };
            }
            return a;
        }));
        addAuditLog('QUERY_RAISED', 'Query', newQuery.id, `Raised clarification query on ${app.applicationNumber}: "${subject}". Response deadline: ${deadline}`);
        addNotification(currentUser.id, `Action Required: Query on ${app.applicationNumber}`, `Department Officer ${currentUser.name} has raised a query: "${subject}". Please submit clarification by ${deadline}.`, 'query', 'critical', `/applications/${app.id}`, app.id);
    };
    const applicantRespondToQuery = (queryId, responseText, attachedDocId, attachedDocName) => {
        const qry = queries.find(q => q.id === queryId);
        if (!qry)
            return;
        const session = getSession();
        if (session && isServerId(queryId)) {
            respondQueryAPI(session.token, queryId, {
                responseText,
                attachedDocumentId: attachedDocId && isServerId(attachedDocId) ? attachedDocId : undefined,
                attachedDocumentName: attachedDocName
            }).catch((e) => alert(e.message)).then(loadWorkspace);
            return;
        }
        setQueries(prev => prev.map(q => {
            if (q.id === queryId) {
                return {
                    ...q,
                    isResolved: true,
                    applicantResponse: {
                        responseDate: new Date().toISOString().slice(0, 10),
                        responseText,
                        attachedDocumentId: attachedDocId,
                        attachedDocumentName: attachedDocName
                    }
                };
            }
            return q;
        }));
        const dateStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
        setApplications(prev => prev.map(a => {
            if (a.id === qry.applicationId) {
                return {
                    ...a,
                    status: 'documents_resubmitted',
                    updatedAt: new Date().toISOString(),
                    history: [
                        ...a.history,
                        {
                            id: 'h_' + Date.now(),
                            timestamp: dateStr,
                            actorName: currentUser.name,
                            actorRole: currentUser.role,
                            action: 'Query Response Submitted',
                            details: `Clarification provided: "${responseText.slice(0, 60)}..."`
                        }
                    ]
                };
            }
            return a;
        }));
        addAuditLog('QUERY_RESPONDED', 'Query', queryId, `Applicant submitted response to query on ${qry.applicationId}`);
        addNotification(currentUser.id, `Query Responded: Application ${qry.applicationId}`, `Applicant has submitted clarification & documents in response to "${qry.subject}". Application moved back to active review.`, 'query', 'normal', `/officer`);
    };
        const officerScheduleInspection = (applicationId, date, timeSlot, inspectorId) => {
        const app = applications.find(a => a.id === applicationId);
        if (!app)
            return;
        const business = businesses.find(b => b.id === app.businessId) || {};
        const approval = approvalTypes.find(a => a.id === app.approvalTypeId);
        const inspector = { name: inspectorId === currentUser.id ? currentUser.name : 'Assigned Inspector' };
        const session = getSession();
        if (session && !String(applicationId).startsWith('app_')) {
            const chosen = inspectors.find(i => i.id === inspectorId);
            return (async () => {
                try {
                    if (app.status !== 'inspection_required') {
                        await moveApplicationStatus(session.token, applicationId, app.status, 'inspection_required');
                    }
                    await scheduleInspectionAPI(session.token, {
                        applicationId,
                        businessName: business.businessName || app.businessName || 'Business',
                        departmentName: departments.find(d => d.id === app.departmentId)?.name || 'Regulatory Department',
                        siteAddress: business.address || 'Business premises',
                        assignedInspectorId: inspectorId,
                        assignedInspectorName: chosen?.name || 'Inspector',
                        scheduledDate: date,
                        scheduledTimeSlot: timeSlot,
                        checklist: DEFAULT_CHECKLIST
                    });
                }
                catch (e) {
                    alert(e.message || 'Could not schedule inspection');
                }
                loadWorkspace();
            })();
        }
        const insNumber = `INS-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const newInspection = {
            id: 'ins_' + Date.now(),
            inspectionNumber: insNumber,
            applicationId,
            businessName: business.businessName,
            departmentName: DEPARTMENTS.find(d => d.id === app.departmentId)?.name || 'Regulatory Department',
            siteAddress: business.address,
            assignedInspectorId: inspectorId,
            assignedInspectorName: inspector.name,
            scheduledDate: date,
            scheduledTimeSlot: timeSlot,
            status: 'scheduled',
            checklist: [
                {
                    id: 'chk_s1',
                    itemText: 'Boundary setback clearance & peripheral heavy fire vehicle driveability',
                    standardReference: 'NBC 2016 Part 4 Table 2',
                    isCompliant: true,
                    findingsRemarks: 'Setbacks verified at 7.5 metres all around.'
                },
                {
                    id: 'chk_s2',
                    itemText: 'Dedicated fire water reserve and functioning electric & diesel booster pumps',
                    standardReference: 'IS 13039 Table 1',
                    isCompliant: true,
                    findingsRemarks: 'Storage reservoir capacity 120,000L. Pump pressure tested to 7.0 bar.'
                },
                {
                    id: 'chk_s3',
                    itemText: 'Adequate ventilation, emergency illumination, and illuminated exit signage',
                    standardReference: 'Factories Act Sec 13 & 38',
                    isCompliant: null
                },
                {
                    id: 'chk_s4',
                    itemText: 'Proper occupational machine guarding on high-speed conveyors & slicing blades',
                    standardReference: 'Factories Act Sec 21',
                    isCompliant: null
                }
            ],
            inspectorRemarks: 'Field inspection scheduled as required under statutory mandate.'
        };
        setInspections(prev => [newInspection, ...prev]);
        const dateStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
        setApplications(prev => prev.map(a => {
            if (a.id === applicationId) {
                return {
                    ...a,
                    status: 'inspection_scheduled',
                    assignedInspectorId: inspectorId,
                    assignedInspectorName: inspector.name,
                    updatedAt: new Date().toISOString(),
                    history: [
                        ...a.history,
                        {
                            id: 'h_' + Date.now(),
                            timestamp: dateStr,
                            actorName: currentUser.name,
                            actorRole: currentUser.role,
                            action: 'Inspection Scheduled',
                            details: `Field audit assigned to ${inspector.name} for ${date} (${timeSlot})`
                        }
                    ]
                };
            }
            return a;
        }));
        addAuditLog('INSPECTION_SCHEDULED', 'Inspection', newInspection.id, `Inspection ${insNumber} booked for ${date} by ${currentUser.name}`);
        addNotification(currentUser.id, `On-Site Inspection Scheduled: ${insNumber}`, `Field safety inspection has been scheduled for ${date} between ${timeSlot} at your premises by ${inspector.name}.`, 'inspection', 'high', `/inspections`);
    };
    const inspectorUpdateChecklist = (inspectionId, checklist, remarks, outcome) => {
        const ins = inspections.find(i => i.id === inspectionId);
        if (!ins)
            return;
        const session = getSession();
        if (session && !String(inspectionId).startsWith('ins_')) {
            return (async () => {
                try {
                    await saveChecklistAPI(session.token, inspectionId, checklist.map(c => ({ _id: c.id, isCompliant: c.isCompliant, findingsRemarks: c.findingsRemarks })));
                    await submitInspectionReportAPI(session.token, inspectionId, { overallComplianceOutcome: outcome, inspectorRemarks: remarks });
                }
                catch (e) {
                    alert(e.message || 'Could not submit report');
                }
                loadWorkspace();
            })();
        }
        setInspections(prev => prev.map(i => {
            if (i.id === inspectionId) {
                return {
                    ...i,
                    checklist,
                    inspectorRemarks: remarks,
                    overallComplianceOutcome: outcome,
                    status: 'completed',
                    reportSubmittedDate: new Date().toISOString().slice(0, 10),
                    evidencePhotosCount: 4
                };
            }
            return i;
        }));
        const dateStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
        setApplications(prev => prev.map(a => {
            if (a.id === ins.applicationId) {
                return {
                    ...a,
                    status: 'under_final_review',
                    updatedAt: new Date().toISOString(),
                    history: [
                        ...a.history,
                        {
                            id: 'h_' + Date.now(),
                            timestamp: dateStr,
                            actorName: currentUser.name,
                            actorRole: currentUser.role,
                            action: 'Inspection Report Submitted',
                            details: `Audit Outcome: ${outcome}. Ready for departmental final review.`
                        }
                    ]
                };
            }
            return a;
        }));
        addAuditLog('INSPECTION_COMPLETED', 'Inspection', inspectionId, `Inspector ${currentUser.name} completed audit with outcome: ${outcome}`);
        addNotification(currentUser.id, `Inspection Completed: ${ins.inspectionNumber}`, `Inspector submitted field report for Application #${ins.applicationId}. Result: ${outcome}. Final decision awaiting.`, 'inspection', 'normal');
    };
    const officerFinalDecision = (applicationId, decision, remarks) => {
        const app = applications.find(a => a.id === applicationId);
        if (!app)
            return;
        const approval = approvalTypes.find(a => a.id === app.approvalTypeId);
        const session = getSession();
        if (session && !String(applicationId).startsWith('app_')) {
            return (async () => {
                try {
                    await moveApplicationStatus(session.token, applicationId, app.status, decision, remarks);
                    if (decision === 'approved') {
                        await issueLicenceAPI(session.token, applicationId, approval?.validityYears, departments.find(d => d.id === app.departmentId)?.name);
                    }
                }
                catch (e) {
                    alert(e.message || 'Action failed');
                }
                loadWorkspace();
            })();
        }
        const now = new Date();
        const dateStr = now.toISOString().replace('T', ' ').slice(0, 16);
        const newStatus = decision === 'approved' ? 'approved' : 'rejected';
        const licenceNum = decision === 'approved' ? `MH-${approval?.shortCode || 'LIC'}-2026-${Math.floor(1000 + Math.random() * 9000)}` : undefined;
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + (typeof approval?.validityYears === 'number' ? approval.validityYears : 5));
        setApplications(prev => prev.map(a => {
            if (a.id === applicationId) {
                return {
                    ...a,
                    status: newStatus,
                    approvalDate: decision === 'approved' ? now.toISOString().slice(0, 10) : undefined,
                    expiryDate: decision === 'approved' ? expiryDate.toISOString().slice(0, 10) : undefined,
                    licenceNumber: licenceNum,
                    officerRemarks: remarks,
                    rejectionReason: decision === 'rejected' ? remarks : undefined,
                    updatedAt: now.toISOString(),
                    history: [
                        ...a.history,
                        {
                            id: 'h_' + Date.now(),
                            timestamp: dateStr,
                            actorName: currentUser.name,
                            actorRole: currentUser.role,
                            action: decision === 'approved' ? 'Application Approved' : 'Application Rejected',
                            details: remarks
                        }
                    ]
                };
            }
            return a;
        }));
        // If approved, create digital licence
        if (decision === 'approved' && licenceNum) {
            const newLic = {
                id: 'lic_' + Date.now(),
                licenceNumber: licenceNum,
                approvalTypeId: app.approvalTypeId,
                approvalName: approval?.approvalName || 'Statutory Approval',
                departmentName: DEPARTMENTS.find(d => d.id === app.departmentId)?.name || 'Govt Department',
                businessName: business.businessName,
                issueDate: now.toISOString().slice(0, 10),
                expiryDate: expiryDate.toISOString().slice(0, 10),
                validityText: `Valid until ${expiryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`,
                status: 'Active',
                qrVerificationCode: `https://vyaparsetu.maharashtra.gov.in/verify/${licenceNum}`,
                certificatePdfUrl: '#',
                daysToExpiry: 365 * 3,
                canRenew: false
            };
            setLicences(prev => [newLic, ...prev]);
        }
        addAuditLog(decision === 'approved' ? 'APPLICATION_APPROVED' : 'APPLICATION_REJECTED', 'Application', applicationId, `Officer ${currentUser.name} ${decision.toUpperCase()} ${app.applicationNumber}. Remarks: ${remarks}`);
        addNotification(currentUser.id, `Application ${decision === 'approved' ? 'Approved 🎉' : 'Rejected ❌'}: ${app.applicationNumber}`, decision === 'approved'
            ? `Your approval for ${approval?.approvalName} is granted! Digital certificate ${licenceNum} has been issued.`
            : `Your application for ${approval?.approvalName} was rejected. Department remarks: ${remarks}`, 'application', decision === 'approved' ? 'high' : 'critical', `/applications/${app.id}`);
    };
    const uploadDocument = (doc) => {
        const session = getSession();
        if (session && doc.file && !isServerId(business.id)) {
            alert('Please save your business profile first (Edit Project Wizard), then upload documents.');
            return { id: 'pending', businessId: '', documentKey: doc.documentKey || '', name: doc.name || doc.file.name, fileName: doc.file.name, verificationStatus: 'pending_upload' };
        }
        if (session && doc.file) {
            uploadDocumentAPI(session.token, doc.file, {
                businessId: business.id,
                documentKey: doc.documentKey || 'custom_doc',
                name: doc.name || doc.file.name,
                category: doc.category || 'Identity & Proof'
            }).catch((e) => alert(e.message)).then(loadWorkspace);
            return { id: 'pending', businessId: business.id, documentKey: doc.documentKey || '', name: doc.name || doc.file.name, category: doc.category, fileName: doc.file.name, verificationStatus: 'under_verification' };
        }
        const newDoc = {
            id: 'doc_' + Date.now(),
            businessId: business.id,
            documentKey: doc.documentKey || 'custom_doc',
            name: doc.name || 'Statutory Compliance Record',
            category: doc.category || 'Identity & Proof',
            fileName: doc.fileName || 'Document_Upload.pdf',
            fileSize: doc.fileSize || '1.8 MB',
            mimeType: doc.mimeType || 'application/pdf',
            uploadDate: new Date().toISOString().slice(0, 10),
            verificationStatus: 'under_verification',
            version: 1,
            downloadUrl: '#',
            ocrAnalysis: doc.ocrAnalysis,
            expiryDate: doc.expiryDate
        };
        setDocuments(prev => [newDoc, ...prev]);
        addAuditLog('DOCUMENT_UPLOADED', 'Document', newDoc.id, `Uploaded document: ${newDoc.name} (${newDoc.fileName})`);
        return newDoc;
    };
    const deleteDocument = (docId) => {
        const doc = documents.find(d => d.id === docId);
        if (!doc)
            return;
        const session = getSession();
        if (session && isServerId(docId)) {
            deleteDocumentAPI(session.token, docId).catch((e) => alert(e.message)).then(loadWorkspace);
            return;
        }
        setDocuments(prev => prev.filter(d => d.id !== docId));
        addAuditLog('DOCUMENT_DELETED', 'Document', docId, `Deleted document: ${doc.name}`);
    };
    const startRenewal = async (licenceId) => {
        const lic = licences.find(l => l.id === licenceId);
        if (!lic)
            return;
        // Create renewal application (linked to the existing licence when it is a real, server-side one)
        try {
            const newApp = await createApplication(lic.approvalTypeId, isServerId(lic.id) ? lic.id : undefined);
            await submitApplication(newApp.id);
        }
        catch (e) {
            alert(e.message || 'Renewal could not be started');
            return;
        }
        addAuditLog('RENEWAL_INITIATED', 'Licence', licenceId, `Initiated renewal for ${lic.licenceNumber}`);
        addNotification(currentUser.id, `Renewal Initiated: ${lic.approvalName}`, `Your renewal application has been submitted based on previously verified compliance records.`, 'renewal');
    };
    const submitGrievance = (grievanceData) => {
        const session = getSession();
        if (session) {
            submitGrievanceAPI(session.token, {
                businessName: business.businessName,
                relatedApplicationId: grievanceData.relatedApplicationId && isServerId(grievanceData.relatedApplicationId) ? grievanceData.relatedApplicationId : undefined,
                category: grievanceData.category || 'SLA Delay / Breach',
                subject: grievanceData.subject || 'Grievance regarding statutory delay',
                description: grievanceData.description || '',
                priority: grievanceData.priority || 'Normal'
            }).catch((e) => alert(e.message)).then(loadWorkspace);
            return;
        }
        const grvNumber = `GRV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const now = new Date().toISOString().slice(0, 10);
        const newGrv = {
            id: 'grv_' + Date.now(),
            grievanceNumber: grvNumber,
            applicantId: currentUser.id,
            applicantName: currentUser.name,
            businessName: business.businessName,
            relatedApplicationId: grievanceData.relatedApplicationId,
            category: grievanceData.category || 'SLA Delay / Breach',
            subject: grievanceData.subject || 'Grievance regarding statutory delay',
            description: grievanceData.description || '',
            priority: grievanceData.priority || 'Normal',
            status: 'Submitted',
            createdDate: now,
            updatedDate: now
        };
        setGrievances(prev => [newGrv, ...prev]);
        addAuditLog('GRIEVANCE_LODGED', 'User', newGrv.id, `Grievance ${grvNumber} lodged: ${newGrv.subject}`);
        addNotification(currentUser.id, `Grievance Registered: ${grvNumber}`, `Your grievance has been forwarded to the Nodal Secretary for review.`, 'alert');
    };
    const adminUpdateRule = (updatedRule) => {
        const session = getSession();
        if (session && isServerId(updatedRule.id)) {
            updateApprovalTypeAPI(session.token, updatedRule.id, {
                approvalName: updatedRule.ruleName || updatedRule.approvalName,
                processingSLADays: updatedRule.statutorySlaDays,
                statutoryFeeINR: updatedRule.statutoryFee,
                officialSource: updatedRule.officialActSource,
                legalActReference: updatedRule.statutoryActReference,
                description: updatedRule.triggerConditionsDescription
            }).then(() => { loadCatalog(); loadWorkspace(); }).catch((e) => alert(e.message));
            return;
        }
        setRegulatoryRules(prev => prev.map(r => r.id === updatedRule.id ? updatedRule : r));
        addAuditLog('REGULATORY_RULE_UPDATED', 'RegulatoryRule', updatedRule.id, `Admin updated rule ${updatedRule.ruleCode}: SLA ${updatedRule.statutorySlaDays} days, Fee ₹${updatedRule.statutoryFee}`);
    };
    const markNotificationAsRead = (notifId) => {
        const session = getSession();
        if (session && isServerId(notifId))
            markNotificationReadAPI(session.token, notifId).catch(() => { });
        setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n));
    };
    const markAllNotificationsRead = () => {
        const session = getSession();
        if (session)
            markAllNotificationsReadAPI(session.token).catch(() => { });
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };
    const resetToDemoDefaults = () => {
        localStorage.clear();
        setBusiness(INITIAL_BUSINESS);
        setApplications(INITIAL_APPLICATIONS);
        setDocuments(INITIAL_DOCUMENTS);
        setQueries(INITIAL_QUERIES);
        setInspections(INITIAL_INSPECTIONS);
        setLicences(INITIAL_LICENCES);
        setNotifications(INITIAL_NOTIFICATIONS);
        setGrievances(INITIAL_GRIEVANCES);
        setAuditLogs(INITIAL_AUDIT_LOGS);
        setRegulatoryRules(INITIAL_REGULATORY_RULES);
        setCurrentRoleState('applicant');
        setActiveDemoStep(1);
    };
    const runDemoStep = (step) => {
        setActiveDemoStep(step);
    };
    return (<AppContext.Provider value={{
            currentUser,
            currentRole,
            setCurrentRole,
            loadWorkspace,
            loadCatalog,
            inspectors,
            language,
            setLanguage,
            business,
            setBusiness,
            businesses,
            switchBusiness,
            departments,
            approvalTypes,
            applications,
            documents,
            queries,
            inspections,
            licences,
            schemes,
            notifications,
            grievances,
            auditLogs,
            regulatoryRules,
            updateBusinessProfile,
            createApplication,
            submitApplication,
            officerVerifyDocument,
            officerRaiseQuery,
            applicantRespondToQuery,
            officerScheduleInspection,
            inspectorUpdateChecklist,
            officerFinalDecision,
            uploadDocument,
            deleteDocument,
            startRenewal,
            submitGrievance,
            adminUpdateRule,
            markNotificationAsRead,
            markAllNotificationsRead,
            resetToDemoDefaults,
            activeDemoStep,
            setActiveDemoStep,
            runDemoStep
        }}>
      {children}
    </AppContext.Provider>);
};
export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
