import { apiClient } from './apiClient';
import { mockGetTicketList } from './mocks/ticket.mock';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export const ticketService = {
  getTicketList: async () => {
    if (USE_MOCK) return await mockGetTicketList();
    return await apiClient('/assistant/tickets');
  }
};
