import type { SupportTicket } from '../types';

type CreateTicketData = Pick<SupportTicket, 'subject' | 'message'> &
  Partial<Pick<SupportTicket, 'orderNumber' | 'customer' | 'userId' | 'userEmail'>>;

const SUPPORT_TICKETS_STORAGE_KEY = 'solution_support_tickets';
const LEGACY_DEMO_TICKET_IDS = new Set(['SUP-006', 'SUP-007', 'SUP-008']);

function readStoredTickets() {
  const storedTickets = localStorage.getItem(SUPPORT_TICKETS_STORAGE_KEY);
  if (!storedTickets) return [];

  try {
    return (JSON.parse(storedTickets) as SupportTicket[]).filter(
      (ticket) => !LEGACY_DEMO_TICKET_IDS.has(ticket.id),
    );
  } catch {
    localStorage.removeItem(SUPPORT_TICKETS_STORAGE_KEY);
    return [];
  }
}

function writeStoredTickets(tickets: SupportTicket[]) {
  localStorage.setItem(SUPPORT_TICKETS_STORAGE_KEY, JSON.stringify(tickets));
}

export const supportService = {
  async createTicket(data: CreateTicketData) {
    const ticket = {
      id: `SUP-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      status: 'new' as const,
      customer: data.customer || { name: 'John Doe', email: 'john@example.com' },
      userEmail: data.userEmail || data.customer?.email,
      ...data,
    };

    writeStoredTickets([ticket, ...readStoredTickets()]);
    return ticket;
  },

  async getMyTickets() {
    return readStoredTickets();
  },
};

export { SUPPORT_TICKETS_STORAGE_KEY };
