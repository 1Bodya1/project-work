export const mockAdminStats = {
  totalOrders: 127,
  paidOrders: 98,
  inProduction: 15,
  supportRequests: 8,
  recentOrders: [
    { id: 'ORD-015', customer: 'Anna Kovalenko', total: 1299, status: 'paid' as const, date: '2026-05-04' },
    { id: 'ORD-014', customer: 'Dmytro Petrenko', total: 899, status: 'production' as const, date: '2026-05-03' },
    { id: 'ORD-013', customer: 'Olena Shevchenko', total: 1697, status: 'shipped' as const, date: '2026-05-02' },
  ],
};
