import { apiClient } from './apiClient';
import { mockScanTicket } from './mocks/ticketScanner.mock';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export const ticketScannerService = {
  scanTicket: async (ticketCode) => {
    if (USE_MOCK) return await mockScanTicket(ticketCode);
    return await apiClient('/assistant/scan', {
      method: 'POST',
      body: JSON.stringify({ ticketCode })
    });
  }
};
