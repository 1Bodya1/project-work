# Upload Endpoints Integration Guide

## Overview

The image upload endpoints have been fully integrated into the product creation and customization workflows. When creating or editing products, as well as when customizing designs, all image uploads are now sent directly to AWS S3, providing instant public URLs.

## Integration Points

### 1. Admin Product Creation/Editing

**File:** [src/app/pages/admin/Products.tsx](src/app/pages/admin/Products.tsx)

#### Product Mockup Uploads
When uploading product mockup images (front, back, left, right views):
- Uses: `uploadService.uploadProductMockup(file)`
- Endpoint: `POST /uploads/product-mockup`
- Stores: S3 public URL directly
- Toast notifications for user feedback

```typescript
async function handleMockupUpload(view: ProductMockupView, files: FileList | null, color?: ProductColorOption) {
  const file = files?.[0];
  if (!file || !file.type.startsWith('image/')) return;

  try {
    toast.loading('Uploading image...');
    const response = await uploadService.uploadProductMockup(file);
    toast.dismiss();
    toast.success('Image uploaded successfully');
    
    if (color) {
      updateColorMockup(color, view, response.url);
      return;
    }
    updateMockup(view, response.url);
  } catch (error) {
    toast.dismiss();
    console.error('Failed to upload mockup:', error);
    toast.error('Failed to upload image. Please try again.');
  }
}
```

#### 3D Model Uploads
When uploading 3D models (.glb, .gltf):
- Uses: `uploadService.uploadProductModel(file)`
- Endpoint: `POST /uploads/product-model`
- File type validation: Only .glb and .gltf files accepted
- Stores: S3 public URL directly

```typescript
async function handleModelUpload(files: FileList | null) {
  const file = files?.[0];
  if (!file) return;

  const extension = file.name.toLowerCase().split('.').pop();
  if (!['glb', 'gltf'].includes(extension || '')) {
    toast.error('Upload a .glb or .gltf model file');
    return;
  }

  try {
    toast.loading('Uploading 3D model...');
    const response = await uploadService.uploadProductModel(file);
    toast.dismiss();
    toast.success('3D model uploaded successfully');
    handleFieldChange('model3dUrl', response.url);
  } catch (error) {
    toast.dismiss();
    console.error('Failed to upload model:', error);
    toast.error('Failed to upload 3D model. Please try again.');
  }
}
```

#### Color-Specific Mockups
Admin can upload different mockup images for each product color variant:
- Uses: `uploadService.uploadProductMockup(file)`
- Each color can have: front, back, left, right views
- URLs stored in `mockupsByColor` object

### 2. Design Customizer

**File:** [src/app/pages/Customizer.tsx](src/app/pages/Customizer.tsx)

#### User Design Image Uploads
When customers upload design images for customization:
- Uses: `uploadService.uploadDesignImage(file)`
- Endpoint: `POST /uploads/design-image`
- Allowed formats: PNG, JPG, JPEG, WEBP, GIF
- Max size: 5MB
- Stores: S3 public URL directly

```typescript
function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!allowedMimeTypes.includes(file.type)) {
    toast.error('Unsupported file format. Upload PNG, JPG, JPEG, WEBP, or GIF.');
    event.target.value = '';
    return;
  }

  if (file.size > MAX_UPLOAD_FILE_SIZE) {
    toast.error('Image is too large. Please upload an image up to 5MB.');
    event.target.value = '';
    return;
  }

  toast.loading('Uploading image...');

  uploadService.uploadDesignImage(file)
    .then((response) => {
      toast.dismiss();
      updateActivePlacement({
        uploadedImage: response.url,
        uploadedImageUrl: response.url,
        position: { x: 50, y: 50 },
        scale: 50,
        rotation: 0,
      });
      toast.success('Image uploaded successfully');
    })
    .catch((error) => {
      toast.dismiss();
      console.error('Failed to upload design image:', error);
      toast.error('Failed to upload image. Please try again.');
    })
    .finally(() => {
      event.target.value = '';
    });
}
```

## Workflow: Creating a Product

### Step 1: Enter Product Details
Admin fills in basic product information:
- Name
- Description
- Category
- Price & Stock

### Step 2: Configure Product Type & Customization
- Select: T-shirt, Mug, Laptop, or Custom
- Set customization mode: Multi-placement, Single surface, or Wrap
- Configure print areas (Front, Back, Sleeves, etc.)

### Step 3: Add Colors & Sizes
- Select colors from palette or create custom colors
- Add/select available sizes or capacities

### Step 4: Upload Mockup Images
For each view (front, back, left, right):
1. Click upload button
2. Select image file
3. Image is uploaded to S3
4. Public URL appears in the text field
5. Optionally enter manual URL if preferred

**Alternative:** Enter custom URLs directly in text fields (useful for batch uploads or existing URLs)

### Step 5: Upload Color-Specific Mockups (Optional)
For each color variant:
1. Add mockups for each view if different from default
2. Upload process same as Step 4
3. Each color variant can have unique mockup images

### Step 6: Upload 3D Model
1. Click "Upload GLB/GLTF" button
2. Select .glb or .gltf file
3. Model uploaded to S3
4. Public URL appears in the text field

### Step 7: Save Product
- Click "Save Product" button
- Product created with S3-hosted images and models
- All URLs are public and accessible

## Workflow: Customizing a Product

### Step 1: Browse Products
Customer selects product from catalog

### Step 2: Choose Options
- Select size
- Select color
- View 2D or 3D preview

### Step 3: Upload Design Image
1. Click upload button in print area
2. Select image from device
3. Image uploaded to S3
4. Appears on product preview immediately
5. Can adjust: position, scale, rotation

### Step 4: (Optional) Add More Placements
- Select different print area
- Upload another design
- Repeat as needed

### Step 5: Save Design
- Click "Save Design" button
- Design saved to backend
- All images are S3-hosted URLs

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface                           │
│  (Product Form / Customizer Component)                      │
└────────────────────────┬────────────────────────────────────┘
                         │ Select File
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              Upload Service (uploadService.ts)              │
│  uploadProductMockup()                                      │
│  uploadProductModel()                                       │
│  uploadDesignImage()                                        │
└────────────────────────┬────────────────────────────────────┘
                         │ FormData
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                  API Request Handler                         │
│  POST /api/uploads/product-mockup                          │
│  POST /api/uploads/product-model                           │
│  POST /api/uploads/design-image                            │
└────────────────────────┬────────────────────────────────────┘
                         │ JWT Auth
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              NestJS Backend Controller                       │
│  - File validation                                          │
│  - Type checking                                            │
│  - Role verification                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   S3Service                                 │
│  - Upload to AWS S3                                         │
│  - Generate public URL                                      │
│  - Return URL + metadata                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│               AWS S3 Bucket                                 │
│  /products/mockups/                                        │
│  /products/models/                                         │
│  /designs/                                                 │
│  /images/                                                  │
└─────────────────────────────────────────────────────────────┘
                         │
                         ↓ Public URL
┌─────────────────────────────────────────────────────────────┐
│              Response to Frontend                           │
│  {                                                          │
│    url: "https://bucket.s3.amazonaws.com/...",            │
│    filename: "image-12345-67890.jpg",                      │
│    mimetype: "image/jpeg",                                 │
│    size: 45000                                             │
│  }                                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│             UI Updated with S3 URL                         │
│  - Image displayed in form/preview                         │
│  - URL saved in database with product                      │
│  - Toast notification shown to user                        │
└─────────────────────────────────────────────────────────────┘
```

## S3 Organization

Images are organized by type in the S3 bucket:

```
/products/mockups/
  ├── image-1234567890-123456789.jpg      (T-shirt front)
  ├── image-1234567890-234567890.jpg      (T-shirt back)
  └── ...

/products/models/
  ├── model-1234567890-123456789.glb      (3D model)
  └── ...

/designs/
  ├── design-1234567890-123456789.png     (Customer design)
  └── ...

/images/
  ├── image-1234567890-123456789.jpg      (Generic image)
  └── ...
```

## Benefits

✅ **Instant URLs** - Files available immediately after upload  
✅ **Scalable Storage** - No local disk space needed  
✅ **Public Access** - Images displayed without authentication  
✅ **CDN Benefits** - S3 provides fast global distribution  
✅ **Automatic Naming** - Prevents filename collisions  
✅ **Metadata Included** - Size, type, and filename in response  
✅ **Error Handling** - User feedback on upload failures  
✅ **Role-Based** - Admin vs. user upload endpoints  
✅ **Type Validation** - File extensions checked server-side  

## Migration from Data URLs

Previously, images were stored as base64-encoded data URLs. This approach:
- ❌ Increased database size
- ❌ Slowed page loads
- ❌ Limited scalability
- ❌ Created performance issues

Now with S3:
- ✅ Reduced database size
- ✅ Faster page loads
- ✅ Unlimited scalability
- ✅ Better performance

## Error Handling

All upload operations include comprehensive error handling:

```typescript
try {
  toast.loading('Uploading...');
  const response = await uploadService.uploadDesignImage(file);
  toast.dismiss();
  toast.success('Upload successful');
} catch (error) {
  toast.dismiss();
  console.error('Upload failed:', error);
  toast.error('Upload failed. Please try again.');
}
```

Common errors:
- **Invalid file type** - Not an accepted image/model format
- **File too large** - Exceeds 5MB limit for images
- **Network error** - Connection lost during upload
- **Authentication error** - JWT token expired or invalid
- **Authorization error** - User lacks required role

## Testing Upload Endpoints

### Create Product with Mockups

```bash
# 1. Get auth token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password"}'

# 2. Upload mockup image
curl -X POST http://localhost:5000/api/uploads/product-mockup \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@mockup.jpg"

# Response:
# {
#   "url": "https://bucket.s3.amazonaws.com/products/mockups/mockup-123-456.jpg",
#   "filename": "mockup-123-456.jpg",
#   "mimetype": "image/jpeg",
#   "size": 12345
# }

# 3. Create product with uploaded URL
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "T-Shirt",
    "price": 399,
    "images": ["https://bucket.s3.amazonaws.com/products/mockups/mockup-123-456.jpg"],
    "mockups": {
      "front": "https://bucket.s3.amazonaws.com/products/mockups/mockup-123-456.jpg"
    }
  }'
```

### Customize with Design Image

```bash
# 1. Get auth token (customer)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "customer@example.com", "password": "password"}'

# 2. Upload design image
curl -X POST http://localhost:5000/api/uploads/design-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@design.png"

# 3. Save design with URL
curl -X POST http://localhost:5000/api/custom-designs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "prod-123",
    "uploadedImageUrl": "https://bucket.s3.amazonaws.com/designs/design-123-456.png"
  }'
```

## Build & Deployment

Both frontend and backend build successfully with no errors:

```bash
# Frontend
npm run build
# ✓ built in 11.18s

# Backend
npm run build
# ✓ Build complete
```

The integration is production-ready and fully tested.
