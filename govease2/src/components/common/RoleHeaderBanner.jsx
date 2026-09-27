import React from 'react';
const ROLE_GRADIENT = {
    applicant: 'from-[var(--role-applicant-from)] to-[var(--role-applicant-to)]',
    officer: 'from-[var(--role-officer-from)] to-[var(--role-officer-to)]',
    inspector: 'from-[var(--role-inspector-from)] to-[var(--role-inspector-to)]',
    admin: 'from-[var(--role-admin-from)] to-[var(--role-admin-to)]',
};
/**
 * Gives every role dashboard (Applicant / Officer / Inspector / Admin) its
 * own consistent identity color, so a user can tell which console they are
 * in at a glance instead of every dashboard sharing the same slate-900
 * banner. Only the gradient changes per role — padding/border/shadow stay
 * identical everywhere so the banners still feel like one family.
 */
export const RoleHeaderBanner = ({ role, children, className = '' }) => (<div className={`bg-gradient-to-r ${ROLE_GRADIENT[role]} text-white rounded-xl p-5 border border-white/10 shadow-md ${className}`}>
    {children}
  </div>);
