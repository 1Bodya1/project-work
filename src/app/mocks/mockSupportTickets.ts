import type { SupportTicket } from '../types';

export const mockSupportTickets: SupportTicket[] = [
  { id: 'SUP-008', subject: 'Issue with custom design upload', orderNumber: 'ORD-012', customer: { name: 'Olena Bondar', email: 'olena@example.com' }, date: '2026-05-04', status: 'new' as const, message: 'Hello, I am trying to upload my design but it keeps showing an error. Can you help?' },
  { id: 'SUP-007', subject: 'Delivery delay inquiry', orderNumber: 'ORD-008', customer: { name: 'Petro Symonenko', email: 'petro@example.com' }, date: '2026-05-03', status: 'in_progress' as const, message: "My order was supposed to arrive yesterday but I still haven't received it. Please check the status." },
  { id: 'SUP-006', subject: 'Size exchange request', orderNumber: 'ORD-005', customer: { name: 'Iryna Moroz', email: 'iryna@example.com' }, date: '2026-05-01', status: 'resolved' as const, message: 'I would like to exchange my order for a different size. The current one is too small.' },
];
