import { apiRequest, apiRequestAny, unwrapApiData, USE_BACKEND } from './api';
import { ORDERS_STORAGE_KEY } from './orderService';
import type { Order, PaymentStatus } from '../types';

type PaymentProvider = 'monobank' | 'mock';

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
                orderStatus: order.orderStatus,
                status: order.status,
              }
            : order,
        ),
      ),
    );
  } catch {
    localStorage.removeItem(ORDERS_STORAGE_KEY);
  }
}

/**
 * Try multiple endpoint aliases in order
 */
export const paymentService = {
  async createPayment(orderId: string, provider: PaymentProvider = 'monobank') {
    const frontendOrigin = window.location.origin;
    const successUrl = `${frontendOrigin}/payment/success?orderId=${encodeURIComponent(orderId)}`;
    const failureUrl = `${frontendOrigin}/payment/failed?orderId=${encodeURIComponent(orderId)}`;
    const cancelUrl = `${frontendOrigin}/payment/cancel?orderId=${encodeURIComponent(orderId)}`;

    if (!USE_BACKEND) {
      // In mock mode, create local payment
      const payment = {
        paymentId: `PAY-${Date.now()}`,
        orderId,
        provider,
        status: 'pending' as const,
        redirectUrl: null,
      };

      sessionStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(payment));
      return payment;
    }

    try {
      const paymentEndpoints = [
        '/payments/monobank',
        '/payments/monobank/create',
        '/payments/monobank/create-invoice',
        `/orders/${orderId}/pay`,
      ];

      return unwrapApiData<{
        paymentId?: string;
        orderId: string;
        provider: PaymentProvider;
        status: 'pending';
        redirectUrl?: string | null;
        paymentUrl?: string | null;
      }>(
        await apiRequestAny<unknown>(
          paymentEndpoints,
          {
            method: 'POST',
            body: JSON.stringify({ orderId, provider, successUrl, failureUrl, cancelUrl, redirectUrl: successUrl }),
          }
        ),
        ['payment', 'data']
      );
    } catch (error) {
      console.error('Failed to create payment on backend:', error);
      throw error;
    }
  },

  async updatePaymentStatus(orderId: string, status: PaymentStatus) {
    if (!USE_BACKEND) {
      // In mock mode, update local payment
      const storedPayment = sessionStorage.getItem(PAYMENT_STORAGE_KEY);
      const payment = storedPayment
        ? JSON.parse(storedPayment)
        : { paymentId: `PAY-${Date.now()}`, orderId, provider: 'mock' };

      const updatedPayment = { ...payment, orderId, status };
      sessionStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(updatedPayment));
      updateStoredOrderPaymentStatus(orderId, status);
      return updatedPayment;
    }

    try {
      return unwrapApiData(
        await apiRequestAny<unknown>([`/payments/${orderId}/status`], {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        }),
        ['payment', 'data']
      );
    } catch (error) {
      console.warn(`Failed to update payment status for order ${orderId}:`, error);
      
      const storedPayment = sessionStorage.getItem(PAYMENT_STORAGE_KEY);
      const payment = storedPayment
        ? JSON.parse(storedPayment)
        : { paymentId: `PAY-${Date.now()}`, orderId, provider: 'mock' };

      const updatedPayment = { ...payment, orderId, status };
      sessionStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(updatedPayment));
      updateStoredOrderPaymentStatus(orderId, status);
      return updatedPayment;
    }
  },

  async getPaymentStatus(invoiceId: string) {
    if (!USE_BACKEND) {
      return {
        invoiceId,
        status: 'pending' as const,
      };
    }

    try {
      return unwrapApiData<{ invoiceId: string; status: string }>(
        await apiRequest<unknown>(`/payments/monobank/status/${invoiceId}`),
        ['payment', 'data']
      );
    } catch (error) {
      console.warn(`Failed to fetch payment status for invoice ${invoiceId}:`, error);
      return {
        invoiceId,
        status: 'pending' as const,
      };
    }
  },
};

export type { PaymentProvider };
