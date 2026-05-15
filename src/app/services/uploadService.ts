import { apiRequest, ApiError, USE_BACKEND } from './api';

export interface UploadResponse {
  url: string;
  filename: string;
  mimetype: string;
  size: number;
}

/**
 * Upload service for handling image and model uploads to S3
 */
export const uploadService = {
  /**
   * Upload a product mockup image (admin only)
   */
  async uploadProductMockup(file: File): Promise<UploadResponse> {
    return uploadFile(file, '/uploads/product-mockup', 'image');
  },

  /**
   * Upload a 3D model (.glb, .gltf) for products (admin only)
   */
  async uploadProductModel(file: File): Promise<UploadResponse> {
    return uploadFile(file, '/uploads/product-model', 'model');
  },

  /**
   * Upload a design image for customization
   */
  async uploadDesignImage(file: File): Promise<UploadResponse> {
    return uploadFile(file, '/uploads/design-image', 'image');
  },

  /**
   * Upload a design image (alias endpoint)
   */
  async uploadDesign(file: File): Promise<UploadResponse> {
    return uploadFile(file, '/uploads/designs', 'image');
  },

  /**
   * Upload a generic image
   */
  async uploadImage(file: File): Promise<UploadResponse> {
    return uploadFile(file, '/uploads/images', 'image');
  },
};

/**
 * Generic file upload helper
 */
async function uploadFile(file: File, endpoint: string, fieldName: string): Promise<UploadResponse> {
  if (!USE_BACKEND) {
    throw new ApiError('Backend disabled by VITE_USE_BACKEND', 0);
  }

  const formData = new FormData();
  formData.append(fieldName, file);

  try {
    const response = await apiRequest<UploadResponse>(endpoint, {
      method: 'POST',
      body: formData,
    });

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'File upload failed',
      0,
      error
    );
  }
}
