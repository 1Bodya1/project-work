import { ORDERS_STORAGE_KEY } from './orderService';
import type { Order, PaymentStatus } from '../types';

type PaymentProvider = 'monobank' | 'liqpay' | 'fondy' | 'stripe' | 'mock';

const PAYMENT_STORAGE_KEY = 'solution_mock_payment';

function updateStoredOrderPaymentStatus(orderId: string, paymentStatus: PaymentStatus) {
  const storedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
  if (!storedOrders) return;

  try {
    const orders = JSON.parse(storedOrders) as Order[];
    localStorage.setItem(
      ORDERS_STORAGE_KEY,
      JSON.stringify(
        orders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                paymentStatus,
                orderStatus: paymentStatus === 'paid' ? 'paid' : order.orderStatus,
                status: paymentStatus === 'paid' ? 'paid' : order.status,
              }
            : order,
        ),
      ),
    );
  } catch {
    localStorage.removeItem(ORDERS_STORAGE_KEY);
  }
}

export const paymentService = {
  async createPayment(orderId: string, provider: PaymentProvider = 'mock') {
    const payment = {
      paymentId: `PAY-${Date.now()}`,
      orderId,
      provider,
      status: 'pending' as const,
      redirectUrl: null,
    };

    sessionStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(payment));
    return payment;
  },

  async updatePaymentStatus(orderId: string, status: PaymentStatus) {
    const storedPayment = sessionStorage.getItem(PAYMENT_STORAGE_KEY);
    const payment = storedPayment
      ? JSON.parse(storedPayment)
      : { paymentId: `PAY-${Date.now()}`, orderId, provider: 'mock' };

    const updatedPayment = { ...payment, orderId, status };
    sessionStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(updatedPayment));
    updateStoredOrderPaymentStatus(orderId, status);
    return updatedPayment;
  },
};

export type { PaymentProvider };
