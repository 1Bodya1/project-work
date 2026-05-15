# Upload Endpoints Implementation Guide

## Overview
All image upload endpoints have been implemented with S3 integration. The project provides a unified upload service for managing images and 3D models with public URLs returned from AWS S3.

## API Endpoints

### 1. Upload Product Mockup
- **Endpoint**: `POST /uploads/product-mockup`
- **Auth**: JWT Bearer Token
- **Role**: admin
- **Field Name**: `image`
- **Allowed Types**: .png, .jpg, .jpeg, .webp
- **Response**: `{ url: string; filename: string; mimetype: string; size: number }`

### 2. Upload Product 3D Model
- **Endpoint**: `POST /uploads/product-model`
- **Auth**: JWT Bearer Token
- **Role**: admin
- **Field Name**: `model`
- **Allowed Types**: .glb, .gltf
- **Response**: `{ url: string; filename: string; mimetype: string; size: number }`

### 3. Upload Design Image (Primary)
- **Endpoint**: `POST /uploads/design-image`
- **Auth**: JWT Bearer Token
- **Role**: user
- **Field Name**: `image`
- **Allowed Types**: .png, .jpg, .jpeg, .webp
- **Response**: `{ url: string; filename: string; mimetype: string; size: number }`

### 4. Upload Design Image (Alias)
- **Endpoint**: `POST /uploads/designs`
- **Auth**: JWT Bearer Token
- **Role**: user
- **Field Name**: `image`
- **Allowed Types**: .png, .jpg, .jpeg, .webp
- **Response**: `{ url: string; filename: string; mimetype: string; size: number }`

### 5. Upload Generic Image (NEW)
- **Endpoint**: `POST /uploads/images`
- **Auth**: JWT Bearer Token
- **Role**: user
- **Field Name**: `image`
- **Allowed Types**: .png, .jpg, .jpeg, .webp
- **Response**: `{ url: string; filename: string; mimetype: string; size: number }`

## Frontend Usage

### Using the Upload Service

```typescript
import { uploadService } from '@/app/services/uploadService';

// Upload product mockup (admin)
const mockupResponse = await uploadService.uploadProductMockup(file);
console.log(mockupResponse.url); // S3 public URL

// Upload 3D model (admin)
const modelResponse = await uploadService.uploadProductModel(file);
console.log(modelResponse.url); // S3 public URL

// Upload design image
const designResponse = await uploadService.uploadDesignImage(file);
console.log(designResponse.url); // S3 public URL

// Upload generic image
const imageResponse = await uploadService.uploadImage(file);
console.log(imageResponse.url); // S3 public URL
```

### Response Structure
All upload endpoints return:
```typescript
{
  url: string;           // Public S3 URL (e.g., https://bucket.s3.amazonaws.com/path/to/file-timestamp.png)
  filename: string;      // Generated filename with timestamp
  mimetype: string;      // File MIME type (e.g., image/png)
  size: number;          // File size in bytes
}
```

### Using Upload Service in React Components

```typescript
import { useState } from 'react';
import { uploadService } from '@/app/services/uploadService';

export function ImageUploader() {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const response = await uploadService.uploadImage(file);
      setImageUrl(response.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} disabled={uploading} />
      {uploading && <p>Uploading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {imageUrl && <img src={imageUrl} alt="Uploaded" />}
    </div>
  );
}
```

### Direct API Call Example

```typescript
import { apiRequest } from '@/app/services/api';

async function uploadDesignImage(file: File) {
  const formData = new FormData();
  formData.append('image', file);

  const response = await apiRequest<{
    url: string;
    filename: string;
    mimetype: string;
    size: number;
  }>('/uploads/design-image', {
    method: 'POST',
    body: formData,
  });

  console.log('Upload successful:', response.url);
  return response;
}
```

## Backend Implementation

### S3 Service (`/src/uploads/s3.service.ts`)
- Handles AWS S3 client initialization
- Manages file uploads with automatic filename generation
- Generates public URLs for uploaded files
- Supports multiple file uploads

### Upload Controller (`/src/uploads/uploads.controller.ts`)
- Provides 5 upload endpoints
- File type validation (extensions-based)
- Role-based access control
- JWT authentication

### Configuration Required

Ensure the following environment variables are set:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=your-bucket-name
```

### S3 CORS Required for 3D Previews

Images used as Three.js/WebGL textures must be loaded with browser CORS enabled. A public `200 OK`
from S3 is not enough; the response must include `Access-Control-Allow-Origin` for the frontend
origin, otherwise uploaded designs can fail when applied to 3D models or captured to canvas.

Configure the S3 bucket CORS policy with your production and local frontend origins:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:5173",
      "https://your-frontend-domain.com"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

For quick diagnosis, inspect the image response headers and confirm it includes:

```text
Access-Control-Allow-Origin: http://localhost:5173
```

## File Organization

**S3 Folder Structure:**
- `products/mockups/` - Product mockup images (admin uploads)
- `products/models/` - 3D models (.glb, .gltf files) (admin uploads)
- `designs/` - Customer design images (user uploads)
- `images/` - Generic images (user uploads)

## Error Handling

All upload operations include error handling:

```typescript
try {
  const response = await uploadService.uploadImage(file);
  // Use response.url
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`Upload failed (${error.status}):`, error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Features

✅ JWT authentication on all endpoints  
✅ Role-based access control (admin/user)  
✅ File type validation  
✅ AWS S3 storage with public URLs  
✅ Automatic filename generation with timestamps  
✅ Public-read ACL for S3 objects  
✅ Comprehensive TypeScript types  
✅ Error handling and fallback mechanisms  
✅ Frontend service layer for easy integration  

## Testing

To test the endpoints:

```bash
# Start the API server
npm run start

# In a separate terminal, test with curl
curl -X POST http://localhost:5000/api/uploads/images \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@/path/to/image.jpg"
```

Expected response:
```json
{
  "url": "https://your-bucket.s3.amazonaws.com/images/image-1234567890-123456789.jpg",
  "filename": "image-1234567890-123456789.jpg",
  "mimetype": "image/jpeg",
  "size": 12345
}
```
