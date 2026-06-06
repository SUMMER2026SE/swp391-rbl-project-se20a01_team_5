import { apiClient } from './apiClient';
import { mockGetBalance, mockGetTransactions, mockTopup } from './mocks/wallet.mock';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export const walletService = {
  getBalance: async () => {
    if (USE_MOCK) {
      return await mockGetBalance();
    }
    return await apiClient('/wallet/balance');
  },

  getTransactions: async () => {
    if (USE_MOCK) {
      return await mockGetTransactions();
    }
    return await apiClient('/wallet/transactions');
  },

  topup: async (amount, method) => {
    if (USE_MOCK) {
      return await mockTopup(amount);
    }
    return await apiClient('/wallet/topup', {
      method: 'POST',
      body: JSON.stringify({ amount, method }),
    });
  }
};
