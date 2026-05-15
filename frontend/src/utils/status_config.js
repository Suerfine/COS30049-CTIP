export const Status_Config = {
    in_progress: { color: '#3b82f6', label: 'In Progress', bg: '#eff6ff' }, // Blue
    in_review:   { color: '#f59e0b', label: 'In Review',   bg: '#fffbeb' }, // Orange/Amber
    completed:   { color: '#10b981', label: 'Completed',   bg: '#ecfdf5' }, // Green
    failed:      { color: '#ef4444', label: 'Failed',      bg: '#fef2f2' }, // Red
    dropped:     { color: '#6b7280', label: 'Dropped',     bg: '#f3f4f6' }, // Gray
    expired:     { color: '#7c3aed', label: 'Expired',     bg: '#f5f3ff' }, // Purple
    pending_payment: { color: '#f59e0b', label: 'Pending Payment', bg: '#f5f3ff' },
    pending: { color: '#f59e0b', label: 'Pending', bg: '#f5f3ff' },
    paid: { color: '#10b981', label: 'Paid', bg: '#f5f3ff' },
    refunded: { color: '#6b7280', label: 'Refunded', bg: 'f5f3ff' },
    rejected: {color: '#6b7280', label: 'Rejected', bg: 'f5f3ff'}
};