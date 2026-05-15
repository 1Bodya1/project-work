import type { Product } from '../types';

export type ProductMockupView = 'front' | 'back' | 'left' | 'right';
export type ProductMockupViews = Record<ProductMockupView, string>;

const viewOrder: ProductMockupView[] = ['front', 'back', 'left', 'right'];
const colorAliases: Record<string, string> = {
  '#ffffff': 'white',
  '#fff': 'white',
  white: 'white',
  '#000000': 'black',
  '#000': 'black',
  black: 'black',
  '#f5f5f5': 'gray',
  '#808080': 'gray',
  gray: 'gray',
  grey: 'gray',
};

function isMockupViews(value: unknown): value is ProductMockupViews {
  return Boolean(
    value
      && typeof value === 'object'
      && viewOrder.every((view) => typeof (value as Record<string, unknown>)[view] === 'string'),
  );
}

function getLegacyMockups(product: Product): ProductMockupViews | null {
  const mockups = product.mockups as unknown;
  return isMockupViews(mockups) ? mockups : null;
}

function getColorKey(color?: string) {
  if (!color) return '';
  const normalizedColor = color.trim().toLowerCase();
  return colorAliases[normalizedColor] || normalizedColor.replace(/[^a-z0-9]+/g, '-');
}

function normalizeMockupPath(path?: string) {
  return (path || '').replace(/^\/public\//, '/').replace(/^public\//, '/');
}

export function getProductColorMockups(product: Product, color?: string): ProductMockupViews | null {
  const mockupsByColor = product.mockupsByColor;
  const requestedColorKey = getColorKey(color);
  const firstProductColorKey = getColorKey(product.colors?.[0]);

  if (mockupsByColor) {
    const colorKeys = [
      requestedColorKey,
      firstProductColorKey,
      'white',
      'black',
      'gray',
      ...Object.keys(mockupsByColor),
    ].filter(Boolean);

    for (const colorKey of colorKeys) {
      const colorMockups = mockupsByColor[colorKey];
      if (isMockupViews(colorMockups)) {
        return {
          front: normalizeMockupPath(colorMockups.front),
          back: normalizeMockupPath(colorMockups.back),
          left: normalizeMockupPath(colorMockups.left),
          right: normalizeMockupPath(colorMockups.right),
        };
      }
    }
  }

  return getLegacyMockups(product);
}

export function getProductMockupFallback(product: Product, view: ProductMockupView = 'front') {
  const legacyMockups = getLegacyMockups(product);
  if (legacyMockups?.[view]) return normalizeMockupPath(legacyMockups[view]);

  const mockupsByColor = product.mockupsByColor;
  if (mockupsByColor) {
    const firstMockupSet = Object.values(mockupsByColor).find(isMockupViews);
    if (firstMockupSet?.[view]) return normalizeMockupPath(firstMockupSet[view]);
    if (firstMockupSet?.front) return normalizeMockupPath(firstMockupSet.front);
  }

  const imageIndex = viewOrder.indexOf(view);
  return normalizeMockupPath(product.images?.[imageIndex] || product.images?.[0] || product.image || '/mockups/tshirt/front.png');
}

export function getProductMockup(product: Product, view: ProductMockupView = 'front', color?: string) {
  return getProductColorMockups(product, color)?.[view] || getProductMockupFallback(product, view);
}

export function getProductMockupList(product: Product, color?: string) {
  const colorMockups = getProductColorMockups(product, color);
  if (colorMockups) {
    return viewOrder.map((view) => colorMockups[view]);
  }

  return product.images?.length
    ? product.images
    : viewOrder.map((view) => getProductMockupFallback(product, view));
}
