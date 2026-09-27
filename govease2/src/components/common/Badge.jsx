import React from 'react';
/**
 * Single source of truth for status badges/chips across the whole app.
 * Use this instead of hand-rolled `bg-green-100 text-green-800` spans so
 * every "Approved", "Verified", "Pending", etc. looks and reads identically
 * everywhere (applicant, officer, inspector, admin screens alike).
 *
 * Color meaning is fixed:
 *  - success = a final positive outcome (Approved, Verified, Resolved)
 *  - warning = needs attention but not urgent/blocking (Pending, Expiring Soon)
 *  - danger  = blocking / rejected / overdue
 *  - info    = in-progress / neutral-active state (Under Review, Scheduled)
 *  - neutral = inactive / draft / not applicable
 */
export const Badge = ({ tone, children, icon, className = '' }) => {
    const toneStyles = {
        success: 'bg-[var(--status-success-bg)] text-[var(--status-success-text)] border-[var(--status-success-border)]',
        warning: 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border-[var(--status-warning-border)]',
        danger: 'bg-[var(--status-danger-bg)] text-[var(--status-danger-text)] border-[var(--status-danger-border)]',
        info: 'bg-[var(--status-info-bg)] text-[var(--status-info-text)] border-[var(--status-info-border)]',
        neutral: 'bg-[var(--status-neutral-bg)] text-[var(--status-neutral-text)] border-[var(--status-neutral-border)]',
    };
    return (<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold uppercase tracking-wide ${toneStyles[tone]} ${className}`}>
      {icon}
      {children}
    </span>);
};
/** Maps an ApplicationStatus value to the correct badge tone, so every
 * screen (applicant tracker, officer queue, admin views) colors the same
 * status identically instead of each component guessing its own color. */
export function applicationStatusTone(status) {
    switch (status) {
        case 'approved':
            return 'success';
        case 'rejected':
            return 'danger';
        case 'query_raised':
            return 'danger';
        case 'inspection_required':
            return 'warning';
        case 'draft':
            return 'neutral';
        default:
            // submitted, under_verification, documents_resubmitted,
            // inspection_scheduled, inspection_completed, under_final_review
            return 'info';
    }
}
/** Maps a DocumentVerificationStatus value to the correct badge tone. */
export function documentStatusTone(status) {
    switch (status) {
        case 'verified':
            return 'success';
        case 'rejected':
            return 'danger';
        case 'expiring_soon':
            return 'warning';
        case 'under_verification':
            return 'info';
        default:
            // pending_upload
            return 'neutral';
    }
}
