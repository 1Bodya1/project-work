import { useEffect, useMemo, useState } from 'react';
import { Eye } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from '../../components/StatusBadge';
import { adminService } from '../../services/adminService';
import type { SupportTicket, TicketStatus } from '../../types';

const ticketStatusOptions: Array<{ value: TicketStatus; label: string }> = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

export default function AdminSupportTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<TicketStatus>('new');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    const nextTickets = await adminService.getSupportTickets();
    setTickets(nextTickets);
    setSelectedTicketId((currentSelectedTicketId) => currentSelectedTicketId || nextTickets[0]?.id || null);
    setIsLoading(false);
  }

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) || null,
    [tickets, selectedTicketId],
  );

  useEffect(() => {
    if (!selectedTicket) return;
    setDraftStatus(selectedTicket.status);
  }, [selectedTicket]);

  async function handleUpdateStatus() {
    if (!selectedTicket) return;

    const updatedTicket = await adminService.updateSupportTicketStatus(selectedTicket.id, draftStatus);
    if (!updatedTicket) {
      toast.error('Unable to update support ticket');
      return;
    }

    setTickets((currentTickets) =>
      currentTickets.map((ticket) => (ticket.id === updatedTicket.id ? updatedTicket : ticket)),
    );
    toast.success('Support ticket updated successfully');
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-4xl mb-8">Support Tickets</h1>
        <div className="bg-white border border-black/10 rounded-lg p-8 text-center text-[#1A1A1A]">
          Loading support tickets...
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-4xl mb-8">Support Tickets</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white border border-black/10 rounded-lg p-6">
            <h3 className="mb-6">All Tickets</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead>
                  <tr className="border-b border-black/10">
                    <th className="text-left pb-3 text-sm">Ticket Number</th>
                    <th className="text-left pb-3 text-sm">User</th>
                    <th className="text-left pb-3 text-sm">Order Number</th>
                    <th className="text-left pb-3 text-sm">Subject</th>
                    <th className="text-left pb-3 text-sm">Date</th>
                    <th className="text-left pb-3 text-sm">Status</th>
                    <th className="text-left pb-3 text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#1A1A1A]">
                        No support tickets
                      </td>
                    </tr>
                  ) : tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className={`border-b border-black/10 cursor-pointer hover:bg-[#F5F5F5] ${
                        selectedTicketId === ticket.id ? 'bg-[#F5F5F5]' : ''
                      }`}
                      onClick={() => setSelectedTicketId(ticket.id)}
                    >
                      <td className="py-4">{ticket.id}</td>
                      <td className="py-4 text-[#1A1A1A]">{ticket.customer.name}</td>
                      <td className="py-4 text-[#1A1A1A]">{ticket.orderNumber || '-'}</td>
                      <td className="py-4">{ticket.subject}</td>
                      <td className="py-4 text-[#1A1A1A]">{ticket.date}</td>
                      <td className="py-4">
                        <StatusBadge status={ticket.status} size="sm" />
                      </td>
                      <td className="py-4">
                        <button
                          type="button"
                          onClick={() => setSelectedTicketId(ticket.id)}
                          className="inline-flex items-center gap-1 text-sm text-[#7A1F2A] hover:underline"
                        >
                          <Eye className="w-4 h-4" />
                          View
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
          {selectedTicket ? (
            <div className="bg-white border border-black/10 rounded-lg p-6 sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <h3 className="mb-6">Ticket Details</h3>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-[#1A1A1A] mb-1">Ticket Number</p>
                  <p>{selectedTicket.id}</p>
                </div>
                <div>
                  <p className="text-sm text-[#1A1A1A] mb-1">User</p>
                  <p>{selectedTicket.customer.name}</p>
                  <p className="text-sm text-[#1A1A1A]">{selectedTicket.customer.email}</p>
                </div>
                <div>
                  <p className="text-sm text-[#1A1A1A] mb-1">Order Number</p>
                  <p>{selectedTicket.orderNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-[#1A1A1A] mb-1">Subject</p>
                  <p>{selectedTicket.subject}</p>
                </div>
                <div>
                  <p className="text-sm text-[#1A1A1A] mb-1">Date</p>
                  <p>{selectedTicket.date}</p>
                </div>
              </div>

              <div className="border-t border-black/10 pt-4 mb-6">
                <h4 className="mb-3">Message</h4>
                <div className="bg-[#F5F5F5] rounded p-4 text-sm text-[#1A1A1A]">
                  {selectedTicket.message}
                </div>
              </div>

              <div className="border-t border-black/10 pt-4 mb-6">
                <label className="block text-sm mb-2">Status</label>
                <select
                  value={draftStatus}
                  onChange={(event) => setDraftStatus(event.target.value as TicketStatus)}
                  className="w-full px-4 py-2.5 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                >
                  {ticketStatusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleUpdateStatus}
                className="w-full py-3 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors"
              >
                Save changes
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
