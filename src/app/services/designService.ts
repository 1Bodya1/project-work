import { apiRequest, unwrapApiData, USE_BACKEND } from './api';
import type { CustomDesign } from '../types';

type SaveDesignData = Omit<CustomDesign, 'id'>;
const DESIGN_STORAGE_KEY = 'solution_designs';

function readDesigns() {
  const storedDesigns = localStorage.getItem(DESIGN_STORAGE_KEY);
  if (!storedDesigns) return [];

  try {
    return JSON.parse(storedDesigns) as CustomDesign[];
  } catch {
    localStorage.removeItem(DESIGN_STORAGE_KEY);
    return [];
  }
}

function writeDesigns(designs: CustomDesign[]) {
  localStorage.setItem(DESIGN_STORAGE_KEY, JSON.stringify(designs));
}

/**
 * Try multiple endpoint aliases in order
 */
async function tryEndpoints<T>(endpoints: string[], method: string = 'GET', body?: string | FormData): Promise<T> {
  let lastError: unknown;
  
  for (const endpoint of endpoints) {
    try {
      const options: RequestInit = { method };
      if (body) options.body = body;
      return await apiRequest<T>(endpoint, options);
    } catch (error) {
      lastError = error;
      // Try next endpoint
    }
  }
  
  throw lastError;
}

/**
 * Normalize backend design response
 */
function normalizeDesign(value: unknown): CustomDesign {
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  
  return {
    id: String(record.id || record._id || record.customDesignId || record.designId || ''),
    customDesignId: String(record.customDesignId || record.id || record._id || ''),
    productId: String(record.productId || record.product_id || ''),
    productTitle: String(record.productTitle || record.product_title || record.productName || ''),
    uploadedImageUrl: String(record.uploadedImageUrl || record.imageUrl || record.image_url || ''),
    imageUrl: String(record.imageUrl || record.uploadedImageUrl || record.image_url || ''),
    previewUrl: String(record.previewUrl || record.preview_url || record.imageUrl || ''),
    screenshot3dUrl: String(record.screenshot3dUrl || record.screenshot_3d_url || record.screenshot || ''),
    position: record.position || { x: 50, y: 50 },
    scale: Number(record.scale ?? 50),
    rotation: Number(record.rotation ?? 0),
    selectedColor: String(record.selectedColor || record.selected_color || record.color || ''),
    selectedSize: String(record.selectedSize || record.selected_size || record.size || ''),
    activePlacement: String(record.activePlacement || record.active_placement || ''),
    previewMode: (record.previewMode as CustomDesign['previewMode']) || '2d',
    placements: record.placements as CustomDesign['placements'],
    usedPlacements: Array.isArray(record.usedPlacements) 
      ? record.usedPlacements.map(String)
      : Array.isArray(record.used_placements)
      ? record.used_placements.map(String)
      : [],
    canvasState: record.canvasState,
    createdAt: String(record.createdAt || record.created_at || new Date().toISOString()),
  };
}

function mergeSavedDesignResponse(responseDesign: CustomDesign, submittedDesign: SaveDesignData): CustomDesign {
  const responsePlacements = responseDesign.placements || {};
  const hasResponsePlacements = Object.values(responsePlacements).some(Boolean);

  return {
    ...submittedDesign,
    ...responseDesign,
    productId: responseDesign.productId || submittedDesign.productId,
    productTitle: responseDesign.productTitle || submittedDesign.productTitle,
    uploadedImageUrl: responseDesign.uploadedImageUrl || submittedDesign.uploadedImageUrl,
    imageUrl: responseDesign.imageUrl || submittedDesign.imageUrl || submittedDesign.uploadedImageUrl,
    previewUrl: responseDesign.previewUrl || submittedDesign.previewUrl,
    screenshot3dUrl: responseDesign.screenshot3dUrl || submittedDesign.screenshot3dUrl,
    position: responseDesign.position || submittedDesign.position,
    scale: responseDesign.scale || submittedDesign.scale,
    rotation: responseDesign.rotation ?? submittedDesign.rotation,
    selectedColor: responseDesign.selectedColor || submittedDesign.selectedColor,
    selectedSize: responseDesign.selectedSize || submittedDesign.selectedSize,
    activePlacement: responseDesign.activePlacement || submittedDesign.activePlacement,
    previewMode: responseDesign.previewMode || submittedDesign.previewMode,
    placements: hasResponsePlacements ? responsePlacements : submittedDesign.placements,
    usedPlacements: responseDesign.usedPlacements?.length
      ? responseDesign.usedPlacements
      : submittedDesign.usedPlacements,
    canvasState: responseDesign.canvasState || submittedDesign.canvasState,
    createdAt: responseDesign.createdAt || submittedDesign.createdAt,
  };
}

export const designService = {
  async uploadDesignImage(file: File) {
    if (!USE_BACKEND) {
      // Return local object URL if backend is disabled
      return {
        fileName: file.name,
        imageUrl: URL.createObjectURL(file),
      };
    }

    try {
      const formData = new FormData();
      formData.append('image', file);
      
      // Try multiple upload endpoints
      const response = await tryEndpoints<{ url: string; filename: string; mimetype: string; size: number }>(
        ['/uploads/designs', '/uploads/design-image'],
        'POST',
        formData
      );
      
      return {
        fileName: response.filename,
        imageUrl: response.url,
      };
    } catch (error) {
      console.warn('Failed to upload design image to backend, using local URL:', error);
      return {
        fileName: file.name,
        imageUrl: URL.createObjectURL(file),
      };
    }
  },

  async saveDesign(data: SaveDesignData) {
    if (!USE_BACKEND) {
      // Use local storage if backend disabled
      const designs = readDesigns();
      const existingDesign = data.productId
        ? designs.find((item) => item.productId === data.productId)
        : null;
      const designId = existingDesign?.id || `DSN-${Date.now()}`;
      const design = { id: designId, customDesignId: designId, ...data };
      const nextDesigns = data.productId
        ? [design, ...designs.filter((item) => item.productId !== data.productId)]
        : [design, ...designs];

      writeDesigns(nextDesigns);
      return { customDesignId: design.id, design };
    }

    try {
      // Try multiple save endpoints
      const response = unwrapApiData<{ customDesignId?: string; design?: CustomDesign; id?: string }>(
        await tryEndpoints<unknown>(
          ['/custom-designs', '/designs'],
          'POST',
          JSON.stringify(data)
        ),
        ['customDesign', 'design', 'data'],
      );
      const design = mergeSavedDesignResponse(normalizeDesign(response.design || response), data);
      const customDesignId = response.customDesignId || design.id || response.id || '';
      return { customDesignId, design: { ...design, id: customDesignId || design.id } };
    } catch (error) {
      console.warn('Failed to save design to backend, falling back to local storage:', error);
      
      const designs = readDesigns();
      const existingDesign = data.productId
        ? designs.find((item) => item.productId === data.productId)
        : null;
      const designId = existingDesign?.id || `DSN-${Date.now()}`;
      const design = { id: designId, customDesignId: designId, ...data };
      const nextDesigns = data.productId
        ? [design, ...designs.filter((item) => item.productId !== data.productId)]
        : [design, ...designs];

      writeDesigns(nextDesigns);
      return { customDesignId: design.id, design };
    }
  },

  async getDesignById(id: string): Promise<CustomDesign> {
    if (!USE_BACKEND) {
      const design = readDesigns().find((item) => item.id === id);
      return design || { id, imageUrl: '', position: { x: 50, y: 50 }, scale: 1, rotation: 0 };
    }

    try {
      return normalizeDesign(
        await tryEndpoints<unknown>(
          [`/custom-designs/${id}`, `/designs/${id}`],
          'GET'
        )
      );
    } catch (error) {
      console.warn(`Failed to fetch design ${id} from backend, falling back to local:`, error);
      const design = readDesigns().find((item) => item.id === id);
      return design || { id, imageUrl: '', position: { x: 50, y: 50 }, scale: 1, rotation: 0 };
    }
  },

  async getDesignByProductId(productId: string) {
    if (!USE_BACKEND) {
      return readDesigns().find((item) => item.productId === productId) || null;
    }

    try {
      const design = normalizeDesign(
        await tryEndpoints<unknown>(
          [
            `/custom-designs/product/${productId}`,
            `/designs/by-product/${productId}`,
          ],
          'GET'
        )
      );

      return design.id || design.productId || design.usedPlacements?.length ? design : null;
    } catch (error) {
      // Not found is expected, just fallback to local
      console.debug(`No design found for product ${productId} on backend:`, error);
      return readDesigns().find((item) => item.productId === productId) || null;
    }
  },

  async deleteDesign(id?: string, productId?: string) {
    const designs = readDesigns();
    const nextDesigns = designs.filter((item) =>
      (id ? item.id !== id && item.customDesignId !== id : true) &&
      (productId ? item.productId !== productId : true)
    );
    writeDesigns(nextDesigns);

    if (!USE_BACKEND || !id) return;

    try {
      await tryEndpoints<unknown>(
        [`/custom-designs/${id}`, `/designs/${id}`],
        'DELETE',
      );
    } catch (error) {
      console.warn(`Failed to delete consumed design ${id} from backend:`, error);
    }
  },
};

export { DESIGN_STORAGE_KEY };
