const API_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5050';
async function handle(res) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
        throw new Error(data.error || `Request failed (${res.status})`);
    return data;
}
export async function loginRequest(email, password) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    return handle(res);
}
export async function registerRequest(payload) {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    return handle(res);
}
export async function fetchMe(token) {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return handle(res);
}
const TOKEN_KEY = 'vyaparsetu_token';
const USER_KEY = 'vyaparsetu_auth_user';
export function saveSession(result) {
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
}
export function getSession() {
    const token = localStorage.getItem(TOKEN_KEY);
    const userRaw = localStorage.getItem(USER_KEY);
    if (!token || !userRaw)
        return null;
    try {
        return { token, user: JSON.parse(userRaw) };
    }
    catch {
        return null;
    }
}
// Logout: remove token + all cached app data (so the next user never sees it).
export function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    Object.keys(localStorage)
        .filter(k => k.startsWith('govease_v2_') && k !== 'govease_v2_language')
        .forEach(k => localStorage.removeItem(k));
}
async function authed(path, token, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: body ? JSON.stringify(body) : undefined
    });
    return handle(res);
}
export const sendOtpRequest = (token) => authed('/api/auth/send-otp', token);
export const verifyOtpRequest = (token, otp) => authed('/api/auth/verify-otp', token, { otp });
export const changePasswordRequest = (token, currentPassword, newPassword) => authed('/api/auth/change-password', token, { currentPassword, newPassword });
export async function forgotPasswordRequest(email) {
    const res = await fetch(`${API_BASE}/api/auth/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    return handle(res);
}
export async function resetPasswordRequest(token, newPassword) {
    const res = await fetch(`${API_BASE}/api/auth/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, newPassword }) });
    return handle(res);
}
// Best-effort: tells the server to revoke this session. Local storage is always cleared
// by clearSession() regardless of whether this network call succeeds.
export async function logoutRequest(token) {
    try {
        await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    }
    catch { /* ignore */ }
}
