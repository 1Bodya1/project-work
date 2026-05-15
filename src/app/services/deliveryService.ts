import { apiRequestAny, unwrapApiData, USE_BACKEND } from './api';
import type { NovaPoshtaCity, NovaPoshtaWarehouse } from '../types';

const mockDeliveryStatuses = [
  'Created',
  'Accepted at branch',
  'In transit',
  'Arrived at branch',
  'Received',
];

function normalizeCity(value: unknown): NovaPoshtaCity | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const ref = String(record.ref || record.Ref || '');
  const description = String(record.description || record.Description || '');
  if (!ref || !description) return null;

  return {
    ref,
    description,
    descriptionRu: record.descriptionRu || record.DescriptionRu
      ? String(record.descriptionRu || record.DescriptionRu)
      : undefined,
    areaDescription: record.areaDescription || record.AreaDescription
      ? String(record.areaDescription || record.AreaDescription)
      : undefined,
    settlementTypeDescription: record.settlementTypeDescription || record.SettlementTypeDescription
      ? String(record.settlementTypeDescription || record.SettlementTypeDescription)
      : undefined,
  };
}

function normalizeWarehouse(value: unknown): NovaPoshtaWarehouse | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const ref = String(record.ref || record.Ref || '');
  const description = String(record.description || record.Description || '');
  if (!ref || !description) return null;

  return {
    ref,
    description,
    shortAddress: record.shortAddress || record.ShortAddress
      ? String(record.shortAddress || record.ShortAddress)
      : undefined,
    number: record.number || record.Number ? String(record.number || record.Number) : undefined,
    typeOfWarehouse: record.typeOfWarehouse || record.TypeOfWarehouse
      ? String(record.typeOfWarehouse || record.TypeOfWarehouse)
      : undefined,
    categoryOfWarehouse: record.categoryOfWarehouse || record.CategoryOfWarehouse
      ? String(record.categoryOfWarehouse || record.CategoryOfWarehouse)
      : undefined,
  };
}

function normalizeCities(value: unknown): NovaPoshtaCity[] {
  const cities = unwrapApiData<unknown[]>(value, ['cities', 'items', 'data']);
  return Array.isArray(cities) ? cities.map(normalizeCity).filter(Boolean) as NovaPoshtaCity[] : [];
}

function normalizeWarehouses(value: unknown): NovaPoshtaWarehouse[] {
  const warehouses = unwrapApiData<unknown[]>(value, ['warehouses', 'items', 'data']);
  return Array.isArray(warehouses)
    ? warehouses.map(normalizeWarehouse).filter(Boolean) as NovaPoshtaWarehouse[]
    : [];
}

export const deliveryService = {
  async getCities(): Promise<NovaPoshtaCity[]> {
    if (!USE_BACKEND) {
      return ['Kyiv', 'Lviv', 'Odesa', 'Dnipro', 'Kharkiv'].map((description) => ({
        ref: description.toLowerCase(),
        description,
        areaDescription: `${description} region`,
      }));
    }

    const endpoint = '/delivery/novaposhta/cities';
    console.debug('[Nova Poshta] city endpoint URL:', endpoint);
    const response = await apiRequestAny([endpoint]);
    console.debug('[Nova Poshta] cities response:', response);
    const cities = normalizeCities(response);
    console.debug('[Nova Poshta] cities length:', cities.length);
    return cities;
  },

  async searchCities(search: string): Promise<NovaPoshtaCity[]> {
    const normalizedSearch = search.trim();
    if (normalizedSearch.length < 2) return [];

    if (!USE_BACKEND) {
      return ['Kyiv', 'Lviv', 'Odesa', 'Dnipro', 'Kharkiv']
        .filter((city) => city.toLowerCase().includes(normalizedSearch.toLowerCase()))
        .map((description) => ({
          ref: description.toLowerCase(),
          description,
          areaDescription: `${description} region`,
        }));
    }

    const endpoint = `/delivery/novaposhta/cities/search?search=${encodeURIComponent(normalizedSearch)}`;
    console.debug('[Nova Poshta] city endpoint URL:', endpoint);
    const response = await apiRequestAny([endpoint]);
    console.debug('[Nova Poshta] cities response:', response);
    const cities = normalizeCities(response);
    console.debug('[Nova Poshta] cities length:', cities.length);
    return cities;
  },

  async getWarehouses(cityRef: string): Promise<NovaPoshtaWarehouse[]> {
    const normalizedCityRef = cityRef.trim();
    if (!normalizedCityRef) return [];

    if (!USE_BACKEND) {
      return [
        {
          ref: `${normalizedCityRef}-warehouse-1`,
          description: 'Nova Poshta Warehouse #1',
          shortAddress: 'Central branch',
          number: '1',
        },
      ];
    }

    const endpoint = `/delivery/novaposhta/warehouses?cityRef=${encodeURIComponent(normalizedCityRef)}`;
    console.debug('[Nova Poshta] warehouse endpoint URL:', endpoint);
    const response = await apiRequestAny([endpoint]);
    console.debug('[Nova Poshta] warehouses response:', response);
    const warehouses = normalizeWarehouses(response);
    console.debug('[Nova Poshta] warehouses length:', warehouses.length);
    return warehouses;
  },

  async searchWarehouses(cityRef: string, search: string): Promise<NovaPoshtaWarehouse[]> {
    const normalizedCityRef = cityRef.trim();
    const normalizedSearch = search.trim();
    if (!normalizedCityRef) return [];
    if (normalizedSearch.length < 2) return this.getWarehouses(normalizedCityRef);

    if (!USE_BACKEND) {
      return (await this.getWarehouses(normalizedCityRef))
        .filter((warehouse) =>
          `${warehouse.description} ${warehouse.shortAddress || ''} ${warehouse.number || ''}`
            .toLowerCase()
            .includes(normalizedSearch.toLowerCase()),
        );
    }

    const endpoint = `/delivery/novaposhta/warehouses/search?cityRef=${encodeURIComponent(normalizedCityRef)}&search=${encodeURIComponent(normalizedSearch)}`;
    console.debug('[Nova Poshta] warehouse endpoint URL:', endpoint);
    const response = await apiRequestAny([endpoint]);
    console.debug('[Nova Poshta] warehouses response:', response);
    const warehouses = normalizeWarehouses(response);
    console.debug('[Nova Poshta] warehouses length:', warehouses.length);
    return warehouses;
  },

  async searchNovaPoshtaCities(search: string) {
    return this.searchCities(search);
  },

  async getNovaPoshtaWarehouses(cityRef: string) {
    return this.getWarehouses(cityRef);
  },

  async getDeliveryStatus(trackingNumber: string) {
    const normalizedTrackingNumber = trackingNumber.trim();

    if (!USE_BACKEND) {
      const statusIndex = normalizedTrackingNumber
        ? normalizedTrackingNumber.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % mockDeliveryStatuses.length
        : 0;

      return {
        trackingNumber: normalizedTrackingNumber,
        provider: 'nova-poshta',
        status: normalizedTrackingNumber ? mockDeliveryStatuses[statusIndex] : 'Created',
        updatedAt: new Date().toISOString(),
      };
    }

    try {
      const encodedTrackingNumber = encodeURIComponent(normalizedTrackingNumber);
      return unwrapApiData<{
        trackingNumber: string;
        provider: string;
        status: string;
        updatedAt: string;
      }>(await apiRequestAny([
        `/delivery/nova-poshta/${encodedTrackingNumber}`,
        `/delivery/novaposhta/status/${encodedTrackingNumber}`,
        `/delivery/track/${encodedTrackingNumber}`,
      ]), ['delivery', 'tracking']);
    } catch (error) {
      console.error('Failed to fetch delivery tracking status:', error);
      throw error;
    }
  },
};

export { mockDeliveryStatuses };
