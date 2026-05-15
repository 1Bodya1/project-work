interface StatusBadgeProps {
  status?: string | null;
  size?: 'sm' | 'md';
}

function normalizeStatus(status?: string | null) {
  return String(status || 'pending')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');
}

function formatStatusLabel(status: string) {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pending', color: 'bg-gray-100 text-gray-800' },
    paid: { label: 'Paid', color: 'bg-green-100 text-green-800' },
    success: { label: 'Paid', color: 'bg-green-100 text-green-800' },
    successful: { label: 'Paid', color: 'bg-green-100 text-green-800' },
    processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800' },
    production: { label: 'In Production', color: 'bg-blue-100 text-blue-800' },
    shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800' },
    in_transit: { label: 'In Transit', color: 'bg-purple-100 text-purple-800' },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
    delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800' },
    received: { label: 'Received', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
    canceled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
    failed: { label: 'Failed', color: 'bg-red-100 text-red-800' },
    failure: { label: 'Failed', color: 'bg-red-100 text-red-800' },
    expired: { label: 'Expired', color: 'bg-red-100 text-red-800' },
    refunded: { label: 'Refunded', color: 'bg-yellow-100 text-yellow-800' },
    reversed: { label: 'Refunded', color: 'bg-yellow-100 text-yellow-800' },
    new: { label: 'New', color: 'bg-[#7A1F2A]/10 text-[#7A1F2A]' },
    created: { label: 'Created', color: 'bg-[#7A1F2A]/10 text-[#7A1F2A]' },
    accepted_at_branch: { label: 'Accepted at Branch', color: 'bg-blue-100 text-blue-800' },
    arrived_at_branch: { label: 'Arrived at Branch', color: 'bg-blue-100 text-blue-800' },
    in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800' },
  };

  const normalizedStatus = normalizeStatus(status);
  const config = statusConfig[normalizedStatus] || {
    label: formatStatusLabel(normalizedStatus),
    color: 'bg-gray-100 text-gray-800',
  };
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-block rounded-full ${config.color} ${sizeClass}`}>
      {config.label}
    </span>
  );
}
