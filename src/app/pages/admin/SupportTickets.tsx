import { useEffect, useMemo, useState } from 'react';
import { Eye } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from '../../components/StatusBadge';
import { formatOrderDateTime } from '../../lib/dateFormat';
import { adminService } from '../../services/adminService';
import type { SupportTicket, TicketStatus } from '../../types';

const ticketStatusOptions: Array<{ value: TicketStatus; label: string }> = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

function getTicketCustomerName(ticket: SupportTicket) {
  const customerName = ticket.customer?.name?.trim();
  return customerName && !/\S+@\S+\.\S+/.test(customerName) ? customerName : 'Customer';
}

function getTicketCustomerEmail(ticket: SupportTicket) {
  return ticket.customer?.email || ticket.userEmail || '';
}

function getShortTicketNumber(ticketId: string) {
  return ticketId.length > 12 ? `${ticketId.slice(0, 12)}...` : ticketId;
}

export default function AdminSupportTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<TicketStatus>('new');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    try {
      const nextTickets = await adminService.getSupportTickets();
      setTickets(nextTickets);
      setLoadError('');
      setSelectedTicketId((currentSelectedTicketId) => currentSelectedTicketId || nextTickets[0]?.id || null);
    } catch {
      setTickets([]);
      setLoadError('Unable to load support tickets.');
    } finally {
      setIsLoading(false);
    }
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

    try {
      const updatedTicket = await adminService.updateSupportTicketStatus(selectedTicket.id, draftStatus);
      if (!updatedTicket) {
        toast.error('Unable to update support ticket');
        return;
      }

      setTickets((currentTickets) =>
        currentTickets.map((ticket) => (ticket.id === updatedTicket.id ? updatedTicket : ticket)),
      );
      toast.success('Support ticket updated successfully');
    } catch {
      toast.error('Unable to update support ticket');
    }
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
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[760px] table-fixed">
                <thead>
                  <tr className="border-b border-black/10">
                    <th className="w-[150px] text-left pb-3 pr-4 text-sm">Ticket</th>
                    <th className="w-[160px] text-left pb-3 pr-4 text-sm">User</th>
                    <th className="w-[120px] text-left pb-3 pr-4 text-sm">Order</th>
                    <th className="w-[180px] text-left pb-3 pr-4 text-sm">Subject</th>
                    <th className="w-[150px] text-left pb-3 pr-4 text-sm">Date</th>
                    <th className="w-[110px] text-left pb-3 pr-4 text-sm">Status</th>
                    <th className="w-[80px] text-left pb-3 text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loadError ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center">
                        <p className="text-red-600 mb-4">{loadError}</p>
                        <button
                          type="button"
                          onClick={loadTickets}
                          className="px-5 py-2.5 border border-black/10 rounded hover:bg-[#F5F5F5] transition-colors"
                        >
                          Retry
                        </button>
                      </td>
                    </tr>
                  ) : tickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center">
                        <h4 className="mb-2">No support tickets</h4>
                        <p className="text-[#1A1A1A]">Customer support requests will appear here.</p>
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
                      <td className="py-4 pr-4">
                        <span className="block truncate font-mono text-xs" title={ticket.id}>
                          {getShortTicketNumber(ticket.id)}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-[#1A1A1A]">
                        <span className="block truncate">{getTicketCustomerName(ticket)}</span>
                      </td>
                      <td className="py-4 pr-4 text-[#1A1A1A]">
                        <span className="block truncate">{ticket.orderNumber || '-'}</span>
                      </td>
                      <td className="py-4 pr-4 align-top">
                        <span className="block line-clamp-2" title={ticket.subject}>{ticket.subject}</span>
                      </td>
                      <td className="py-4 pr-4 text-[#1A1A1A] whitespace-nowrap">
                        {formatOrderDateTime(ticket.date)}
                      </td>
                      <td className="py-4 pr-4">
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
            <div className="bg-white border border-black/10 rounded-lg p-4 sm:p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] overflow-y-auto">
              <h3 className="mb-6">Ticket Details</h3>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-[#1A1A1A] mb-1">Ticket Number</p>
                  <p className="break-all">{selectedTicket.id}</p>
                </div>
                <div>
                  <p className="text-sm text-[#1A1A1A] mb-1">User</p>
                  <p>{getTicketCustomerName(selectedTicket)}</p>
                  <p className="text-sm text-[#1A1A1A]">{getTicketCustomerEmail(selectedTicket) || '-'}</p>
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
                  <p>{formatOrderDateTime(selectedTicket.date)}</p>
                </div>
              </div>

              <div className="border-t border-black/10 pt-4 mb-6">
                <h4 className="mb-3">Message</h4>
                <div className="bg-[#F5F5F5] rounded p-4 text-sm text-[#1A1A1A] whitespace-pre-wrap break-words">
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
                <div className="mt-3">
                  <StatusBadge status={draftStatus} size="sm" />
                </div>
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
              {tickets.length === 0
                ? 'Customer support requests will appear here.'
                : 'Select a ticket to view details'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
