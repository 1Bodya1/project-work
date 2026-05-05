import { useState } from 'react';
import { StatusBadge } from '../../components/StatusBadge';
import { Eye } from 'lucide-react';

export default function AdminSupportTickets() {
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

  const tickets = [
    {
      id: 'SUP-008',
      subject: 'Issue with custom design upload',
      orderNumber: 'ORD-012',
      customer: { name: 'Olena Bondar', email: 'olena@example.com' },
      date: '2026-05-04',
      status: 'new' as const,
      message: 'Hello, I am trying to upload my design but it keeps showing an error. Can you help?',
    },
    {
      id: 'SUP-007',
      subject: 'Delivery delay inquiry',
      orderNumber: 'ORD-008',
      customer: { name: 'Petro Symonenko', email: 'petro@example.com' },
      date: '2026-05-03',
      status: 'in_progress' as const,
      message: 'My order was supposed to arrive yesterday but I still haven\'t received it. Please check the status.',
    },
    {
      id: 'SUP-006',
      subject: 'Size exchange request',
      orderNumber: 'ORD-005',
      customer: { name: 'Iryna Moroz', email: 'iryna@example.com' },
      date: '2026-05-01',
      status: 'resolved' as const,
      message: 'I would like to exchange my order for a different size. The current one is too small.',
    },
  ];

  const ticket = tickets.find((t) => t.id === selectedTicket);

  return (
    <div>
      <h1 className="text-4xl mb-8">Support Tickets</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white border border-black/10 rounded-lg p-6">
            <h3 className="mb-6">All Tickets</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/10">
                    <th className="text-left pb-3 text-sm">Ticket ID</th>
                    <th className="text-left pb-3 text-sm">Subject</th>
                    <th className="text-left pb-3 text-sm">Customer</th>
                    <th className="text-left pb-3 text-sm">Date</th>
                    <th className="text-left pb-3 text-sm">Status</th>
                    <th className="text-left pb-3 text-sm"></th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr
                      key={t.id}
                      className={`border-b border-black/10 cursor-pointer hover:bg-[#F5F5F5] ${selectedTicket === t.id ? 'bg-[#F5F5F5]' : ''}`}
                      onClick={() => setSelectedTicket(t.id)}
                    >
                      <td className="py-4">{t.id}</td>
                      <td className="py-4">{t.subject}</td>
                      <td className="py-4 text-[#1A1A1A]">{t.customer.name}</td>
                      <td className="py-4 text-[#1A1A1A]">{t.date}</td>
                      <td className="py-4">
                        <StatusBadge status={t.status} size="sm" />
                      </td>
                      <td className="py-4">
                        <button className="p-2 hover:bg-white rounded">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          {ticket ? (
            <div className="bg-white border border-black/10 rounded-lg p-6 sticky top-24">
              <h3 className="mb-6">Ticket Details</h3>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-[#1A1A1A] mb-1">Ticket ID</p>
                  <p>{ticket.id}</p>
                </div>
                <div>
                  <p className="text-sm text-[#1A1A1A] mb-1">Subject</p>
                  <p>{ticket.subject}</p>
                </div>
                <div>
                  <p className="text-sm text-[#1A1A1A] mb-1">Customer</p>
                  <p>{ticket.customer.name}</p>
                  <p className="text-sm text-[#1A1A1A]">{ticket.customer.email}</p>
                </div>
                {ticket.orderNumber && (
                  <div>
                    <p className="text-sm text-[#1A1A1A] mb-1">Order Number</p>
                    <p>{ticket.orderNumber}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-[#1A1A1A] mb-1">Date</p>
                  <p>{ticket.date}</p>
                </div>
              </div>

              <div className="border-t border-black/10 pt-4 mb-6">
                <h4 className="mb-3">Message</h4>
                <div className="bg-[#F5F5F5] rounded p-4 text-sm">
                  {ticket.message}
                </div>
              </div>

              <div className="border-t border-black/10 pt-4 mb-6">
                <label className="block text-sm mb-2">Status</label>
                <select
                  value={ticket.status}
                  className="w-full px-4 py-2.5 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A] mb-4"
                >
                  <option value="new">New</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>

                <label className="block text-sm mb-2">Reply</label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A] resize-none mb-4"
                  placeholder="Type your response..."
                />
              </div>

              <button className="w-full py-3 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors">
                Send Reply & Update
              </button>
            </div>
          ) : (
            <div className="bg-white border border-black/10 rounded-lg p-6 text-center text-[#1A1A1A]">
              Select a ticket to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
