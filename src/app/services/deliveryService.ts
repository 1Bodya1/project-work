const mockDeliveryStatuses = [
  'Created',
  'Accepted at branch',
  'In transit',
  'Arrived at branch',
  'Received',
];

export const deliveryService = {
  async getDeliveryStatus(trackingNumber: string) {
    const normalizedTrackingNumber = trackingNumber.trim();
    const statusIndex = normalizedTrackingNumber
      ? normalizedTrackingNumber.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % mockDeliveryStatuses.length
      : 0;

    return {
      trackingNumber: normalizedTrackingNumber,
      provider: 'nova-poshta',
      status: normalizedTrackingNumber ? mockDeliveryStatuses[statusIndex] : 'Created',
      updatedAt: new Date().toISOString(),
    };
  },
};

export { mockDeliveryStatuses };
