import { apiRequestAny, unwrapApiData, USE_BACKEND } from './api';
import type { SupportTicket } from '../types';

type CreateTicketData = Pick<SupportTicket, 'subject' | 'message'> &
  Partial<Pick<SupportTicket, 'orderNumber' | 'customer' | 'userId' | 'userEmail'>>;

const SUPPORT_TICKETS_STORAGE_KEY = 'solution_support_tickets';
const LEGACY_DEMO_TICKET_IDS = new Set(['SUP-006', 'SUP-007', 'SUP-008']);

function joinName(firstName?: string, lastName?: string) {
  return [firstName, lastName].filter(Boolean).join(' ').trim();
}

function isEmailLike(value?: string) {
  return Boolean(value && /\S+@\S+\.\S+/.test(value));
}

function getDisplayName(...names: Array<string | undefined>) {
  const name = names.map((value) => value?.trim()).find((value) => value && !isEmailLike(value));
  return name || 'Customer';
}

function normalizeSupportTicket(ticket: SupportTicket): SupportTicket {
  const record = ticket as SupportTicket & {
    _id?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    fullName?: string;
    created_at?: string;
    user?: { name?: string; fullName?: string; email?: string; firstName?: string; lastName?: string };
  };
  const customerName = getDisplayName(
    record.customer?.name,
    record.user?.fullName,
    record.user?.name,
    joinName(record.user?.firstName, record.user?.lastName),
    record.fullName,
    record.name,
    joinName(record.firstName, record.lastName),
  );
  const customerEmail = record.customer?.email || record.user?.email || record.userEmail || '';

  return {
    ...ticket,
    id: String(ticket.id || record._id || `SUP-${Date.now()}`),
    customer: { name: customerName, email: customerEmail },
    userEmail: customerEmail,
    subject: ticket.subject || 'Support request',
    message: ticket.message || '',
    status: ticket.status || 'new',
    date: ticket.date || ticket.createdAt || record.created_at || new Date().toISOString(),
    createdAt: ticket.createdAt || record.created_at,
  };
}

function readStoredTickets() {
  const storedTickets = localStorage.getItem(SUPPORT_TICKETS_STORAGE_KEY);
  if (!storedTickets) return [];

  try {
    return (JSON.parse(storedTickets) as SupportTicket[]).filter(
      (ticket) => !LEGACY_DEMO_TICKET_IDS.has(ticket.id),
    ).map(normalizeSupportTicket);
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
    if (!USE_BACKEND) {
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
    }

    try {
      return normalizeSupportTicket(unwrapApiData<SupportTicket>(await apiRequestAny([
        '/support/tickets',
        '/support',
      ], {
        method: 'POST',
        body: JSON.stringify(data),
      }), ['ticket']));
    } catch (error) {
      console.error('Failed to create support ticket:', error);
      throw error;
    }
  },

  async getMyTickets() {
    if (!USE_BACKEND) return readStoredTickets();

    try {
      const tickets = unwrapApiData<SupportTicket[]>(await apiRequestAny([
        '/support/tickets/my',
        '/support/my',
      ]), ['tickets', 'items']);
      return Array.isArray(tickets) ? tickets.map(normalizeSupportTicket) : [];
    } catch (error) {
      console.error('Failed to load support tickets:', error);
      throw error;
    }
  },
};

export { SUPPORT_TICKETS_STORAGE_KEY };
