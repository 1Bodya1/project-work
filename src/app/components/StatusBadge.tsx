interface StatusBadgeProps {
  status:
    | 'pending'
    | 'paid'
    | 'processing'
    | 'production'
    | 'shipped'
    | 'completed'
    | 'delivered'
    | 'cancelled'
    | 'failed'
    | 'refunded'
    | 'new'
    | 'in_progress'
    | 'resolved';
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const statusConfig = {
    pending: { label: 'Pending', color: 'bg-gray-100 text-gray-800' },
    paid: { label: 'Paid', color: 'bg-green-100 text-green-800' },
    processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800' },
    production: { label: 'In Production', color: 'bg-blue-100 text-blue-800' },
    shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800' },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
    delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
    failed: { label: 'Failed', color: 'bg-red-100 text-red-800' },
    refunded: { label: 'Refunded', color: 'bg-yellow-100 text-yellow-800' },
    new: { label: 'New', color: 'bg-[#7A1F2A]/10 text-[#7A1F2A]' },
    in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800' },
  };

  const config = statusConfig[status];
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-block rounded-full ${config.color} ${sizeClass}`}>
      {config.label}
    </span>
  );
}
