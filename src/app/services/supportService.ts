import { mockSupportTickets } from '../mocks/mockSupportTickets';
import type { SupportTicket } from '../types';

type CreateTicketData = Pick<SupportTicket, 'subject' | 'message'> &
  Partial<Pick<SupportTicket, 'orderNumber' | 'customer'>>;

const SUPPORT_TICKETS_STORAGE_KEY = 'solution_support_tickets';

function readStoredTickets() {
  const storedTickets = localStorage.getItem(SUPPORT_TICKETS_STORAGE_KEY);
  if (!storedTickets) return [];

  try {
    return JSON.parse(storedTickets) as SupportTicket[];
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
      status: 'new' as const,
      customer: data.customer || { name: 'John Doe', email: 'john@example.com' },
      ...data,
    };

    writeStoredTickets([ticket, ...readStoredTickets()]);
    return ticket;
  },

  async getMyTickets() {
    return [...readStoredTickets(), ...mockSupportTickets];
  },
};

export { SUPPORT_TICKETS_STORAGE_KEY };
