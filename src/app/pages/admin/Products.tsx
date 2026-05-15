import { useEffect, useMemo, useState } from 'react';
import { Edit, Plus, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { productPrintAreasByType } from '../../mocks/mockProducts';
import { adminService } from '../../services/adminService';
import { uploadService } from '../../services/uploadService';
import type { ProductMockupView } from '../../lib/productMockups';
import type {
  CustomizationMode,
  Product,
  ProductColorOption,
  ProductPrintArea,
  ProductPrintAreaKey,
  ProductPrintAreaType,
  ProductType,
} from '../../types';

type MockupViews = Record<ProductMockupView, string>;
type ColorMockups = Record<string, MockupViews>;

type ProductFormData = {
  title: string;
  description: string;
  category: string;
  newCategory: string;
  price: string;
  stock: string;
  productType: ProductType | '';
  customizationMode: CustomizationMode;
  isCustomizable: boolean;
  colors: ProductColorOption[];
  colorName: string;
  colorHex: string;
  sizes: string[];
  customSize: string;
  printAreas: ProductPrintArea[];
  mockups: MockupViews;
  mockupsByColor: ColorMockups;
  model3dUrl: string;
  printArea: {
    x: string;
    y: string;
    width: string;
    height: string;
  };
};

const mockupViews: ProductMockupView[] = ['front', 'back', 'left', 'right'];
const productTypeOptions: Array<{ value: ProductType; label: string }> = [
  { value: 'tshirt', label: 'T-shirt' },
  { value: 'mug', label: 'Mug' },
  { value: 'laptop', label: 'Laptop' },
  { value: 'custom', label: 'Custom' },
];
const customizationModeOptions: Array<{ value: CustomizationMode; label: string }> = [
  { value: 'multi-placement', label: 'Multi-placement' },
  { value: 'single-surface', label: 'Single surface' },
  { value: 'wrap', label: 'Wrap' },
];
const paletteColors: ProductColorOption[] = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Black', hex: '#000000' },
  { name: 'Gray', hex: '#F5F5F5' },
  { name: 'Burgundy', hex: '#7A1F2A' },
  { name: 'Charcoal', hex: '#1A1A1A' },
  { name: 'Navy', hex: '#1F3A5F' },
];
const sizePresets: Record<ProductType, string[]> = {
  tshirt: ['XS', 'S', 'M', 'L', 'XL'],
  mug: ['330 ml', '450 ml'],
  laptop: ['13 inch', '14 inch', '15 inch'],
  custom: [],
};
const defaultCategories: Record<ProductType, string> = {
  tshirt: 'T-shirt',
  mug: 'Mugs',
  laptop: 'Laptops',
  custom: 'Custom',
};
const defaultModelUrls: Partial<Record<ProductType, string>> = {
  tshirt: '/models/tshirt.glb',
};
const defaultModes: Record<ProductType, CustomizationMode> = {
  tshirt: 'multi-placement',
  mug: 'multi-placement',
  laptop: 'multi-placement',
  custom: 'single-surface',
};

const emptyMockups: MockupViews = {
  front: '',
  back: '',
  left: '',
  right: '',
};

function normalizeCategoryName(category: string) {
  return category.trim().toLowerCase() === 't-shirts' ? 'T-shirt' : category.trim();
}

function createEmptyFormData(): ProductFormData {
  return {
    title: '',
    description: '',
    category: '',
    newCategory: '',
    price: '',
    stock: '',
    productType: '',
    customizationMode: 'single-surface',
    isCustomizable: true,
    colors: [paletteColors[0]],
    colorName: '',
    colorHex: '#FFFFFF',
    sizes: [],
    customSize: '',
    printAreas: [],
    mockups: { ...emptyMockups },
    mockupsByColor: {},
    model3dUrl: '',
    printArea: {
      x: '31',
      y: '30',
      width: '38',
      height: '34',
    },
  };
}

function getColorSlug(color: string) {
  return color.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'color';
}

function getColorKey(color: ProductColorOption) {
  return getColorSlug(color.name || color.hex);
}

function isSameColor(firstColor: ProductColorOption, secondColor: ProductColorOption) {
  return firstColor.hex.toLowerCase() === secondColor.hex.toLowerCase();
}

function normalizeHex(value: string) {
  const hex = value.trim();
  return hex.startsWith('#') ? hex.toUpperCase() : `#${hex}`.toUpperCase();
}

function productToFormData(product: Product): ProductFormData {
  const productType = product.productType || 'tshirt';
  const colors = product.colorOptions?.length
    ? product.colorOptions
    : (product.colors?.length ? product.colors : ['#FFFFFF']).map((hex) => ({ name: hex, hex }));
  const printAreas = product.printAreas?.length ? product.printAreas : productPrintAreasByType[productType];
  const mockups = product.mockups || {
    front: product.images?.[0] || product.image || '',
    back: product.images?.[1] || '',
    left: product.images?.[2] || '',
    right: product.images?.[3] || '',
  };

  return {
    title: product.name || product.title || '',
    description: product.description || '',
    category: normalizeCategoryName(product.category || defaultCategories[productType]),
    newCategory: '',
    price: String(product.price || ''),
    stock: String(product.stock ?? 0),
    productType,
    customizationMode: product.customizationMode || defaultModes[productType],
    isCustomizable: Boolean(product.isCustomizable ?? product.customizable),
    colors,
    colorName: '',
    colorHex: colors[0]?.hex || '#FFFFFF',
    sizes: product.sizes || sizePresets[productType],
    customSize: '',
    printAreas,
    mockups,
    mockupsByColor: product.mockupsByColor || {},
    model3dUrl: product.model3dUrl || defaultModelUrls[productType] || '',
    printArea: {
      x: String(product.printArea?.x ?? 31),
      y: String(product.printArea?.y ?? 30),
      width: String(product.printArea?.width ?? 38),
      height: String(product.printArea?.height ?? 34),
    },
  };
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function buildImages(mockups: MockupViews) {
  return mockupViews.map((view) => mockups[view]).filter(Boolean);
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(createEmptyFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const existingCategories = useMemo(() => (
    Array.from(new Set([
      ...Object.values(defaultCategories),
      ...products
        .map((product) => product.category)
        .filter(Boolean)
        .map((category) => normalizeCategoryName(String(category))),
    ] as string[])).filter(Boolean)
  ), [products]);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const nextProducts = await adminService.getProducts();
      setProducts(nextProducts);
      setLoadError('');
    } catch (error) {
      console.error('Unable to load admin products:', error);
      setLoadError(error instanceof Error ? error.message : 'Unable to load products.');
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm() {
    setFormData(createEmptyFormData());
    setEditingProductId(null);
    setErrors({});
    setShowForm(false);
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {};
    const category = normalizeCategoryName(formData.newCategory || formData.category);
    const images = buildImages(formData.mockups);

    if (!formData.title.trim()) nextErrors.title = 'Name is required';
    if (!category) nextErrors.category = 'Category is required';
    if (!formData.productType) nextErrors.productType = 'Product type is required';
    if (!formData.price || Number(formData.price) <= 0) nextErrors.price = 'Price is required';
    if (formData.colors.length === 0) nextErrors.colors = 'At least one color is required';
    if (formData.sizes.length === 0) nextErrors.sizes = 'At least one size or capacity is required';
    if (formData.isCustomizable && formData.printAreas.length === 0) nextErrors.printAreas = 'At least one print area is required';
    if (images.length === 0) nextErrors.mockups = 'At least one mockup image or path is required';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function buildProductData(): Omit<Product, 'id'> {
    const category = normalizeCategoryName(formData.newCategory || formData.category);
    const images = buildImages(formData.mockups);
    const image = images[0] || '/mockups/tshirt/front.png';

    return {
      name: formData.title.trim(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      category,
      price: Number(formData.price),
      stock: Number(formData.stock || 0),
      productType: formData.productType || 'custom',
      customizationMode: formData.customizationMode,
      model3dUrl: formData.model3dUrl.trim() || undefined,
      colorOptions: formData.colors,
      colors: formData.colors.map((color) => color.hex),
      sizes: formData.sizes,
      printAreas: formData.printAreas,
      image,
      images,
      mockups: {
        front: formData.mockups.front || image,
        back: formData.mockups.back || formData.mockups.front || image,
        left: formData.mockups.left || formData.mockups.front || image,
        right: formData.mockups.right || formData.mockups.front || image,
      },
      mockupsByColor: formData.mockupsByColor,
      customizable: formData.isCustomizable,
      isCustomizable: formData.isCustomizable,
      createdAt: new Date().toISOString().slice(0, 10),
      printArea: {
        x: Number(formData.printArea.x || 0),
        y: Number(formData.printArea.y || 0),
        width: Number(formData.printArea.width || 0),
        height: Number(formData.printArea.height || 0),
      },
    };
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validateForm()) return;

    const productData = buildProductData();

    try {
      if (editingProductId) {
        await adminService.updateProduct(editingProductId, productData);
        toast.success('Product updated successfully');
      } else {
        await adminService.createProduct(productData);
        toast.success('Product created successfully');
      }

      await loadProducts();
      resetForm();
    } catch (error) {
      console.error('Unable to save product:', error);
      toast.error('Unable to save product. Please try again.');
    }
  }

  function handleEditProduct(product: Product) {
    setFormData(productToFormData(product));
    setEditingProductId(product.id);
    setErrors({});
    setShowForm(true);
  }

  async function handleDeleteProduct(productId: string) {
    try {
      await adminService.deleteProduct(productId);
      await loadProducts();
      toast.success('Product deleted successfully');
    } catch {
      toast.error('Unable to delete product. Please try again.');
    }
  }

  function handleFieldChange<T extends keyof ProductFormData>(field: T, value: ProductFormData[T]) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [field]: value,
    }));
  }

  function handleProductTypeChange(productType: ProductType | '') {
    if (!productType) {
      setFormData((currentFormData) => ({
        ...currentFormData,
        productType: '',
        sizes: [],
        printAreas: [],
        model3dUrl: '',
      }));
      return;
    }

    setFormData((currentFormData) => ({
      ...currentFormData,
      productType,
      customizationMode: defaultModes[productType],
      sizes: sizePresets[productType],
      printAreas: productPrintAreasByType[productType],
      model3dUrl: defaultModelUrls[productType] || '',
    }));
  }

  function addColor(color: ProductColorOption) {
    const nextColor = { name: color.name.trim() || color.hex, hex: normalizeHex(color.hex) };
    setFormData((currentFormData) => ({
      ...currentFormData,
      colors: currentFormData.colors.some((item) => isSameColor(item, nextColor))
        ? currentFormData.colors
        : [...currentFormData.colors, nextColor],
      colorName: '',
      colorHex: nextColor.hex,
    }));
  }

  function removeColor(hex: string) {
    setFormData((currentFormData) => {
      const colorKey = getColorSlug(hex);
      const nextMockupsByColor = { ...currentFormData.mockupsByColor };
      delete nextMockupsByColor[colorKey];

      return {
        ...currentFormData,
        colors: currentFormData.colors.filter((color) => color.hex.toLowerCase() !== hex.toLowerCase()),
        mockupsByColor: nextMockupsByColor,
      };
    });
  }

  function toggleSize(size: string) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      sizes: currentFormData.sizes.includes(size)
        ? currentFormData.sizes.filter((item) => item !== size)
        : [...currentFormData.sizes, size],
    }));
  }

  function addCustomSize() {
    const size = formData.customSize.trim();
    if (!size) return;

    setFormData((currentFormData) => ({
      ...currentFormData,
      sizes: currentFormData.sizes.includes(size) ? currentFormData.sizes : [...currentFormData.sizes, size],
      customSize: '',
    }));
  }

  function togglePrintArea(area: ProductPrintArea) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      printAreas: currentFormData.printAreas.some((item) => item.key === area.key)
        ? currentFormData.printAreas.filter((item) => item.key !== area.key)
        : [...currentFormData.printAreas, area],
    }));
  }

  function updatePrintArea(areaKey: ProductPrintAreaKey, field: keyof ProductPrintArea, value: string) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      printAreas: currentFormData.printAreas.map((area) => area.key === areaKey
        ? {
            ...area,
            [field]: field === 'type' ? value as ProductPrintAreaType : value,
          }
        : area),
    }));
  }

  function updateMockup(view: ProductMockupView, value: string) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      mockups: {
        ...currentFormData.mockups,
        [view]: value,
      },
    }));
  }

  function updateColorMockup(color: ProductColorOption, view: ProductMockupView, value: string) {
    const colorKey = getColorKey(color);
    setFormData((currentFormData) => ({
      ...currentFormData,
      mockupsByColor: {
        ...currentFormData.mockupsByColor,
        [colorKey]: {
          ...(currentFormData.mockupsByColor[colorKey] || emptyMockups),
          [view]: value,
        },
      },
    }));
  }

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

  function handlePrintAreaBoxChange(field: keyof ProductFormData['printArea'], value: string) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      printArea: {
        ...currentFormData.printArea,
        [field]: value,
      },
    }));
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-4xl">Products</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) {
              setEditingProductId(null);
              setFormData(createEmptyFormData());
              setErrors({});
            }
          }}
          className="w-full sm:w-auto px-6 py-3 bg-[#7A1F2A] text-white rounded flex items-center justify-center gap-2 hover:bg-[#5A1520] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-black/10 rounded-lg p-6 mb-8">
          <h3 className="mb-6">{editingProductId ? 'Edit Product' : 'Add New Product'}</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2">Name</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(event) => handleFieldChange('title', event.target.value)}
                  className={`w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 ${errors.title ? 'ring-2 ring-red-500' : 'focus:ring-[#7A1F2A]'}`}
                  placeholder="Classic Ceramic Mug"
                />
                {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
              </div>
              <div>
                <label className="block mb-2">Category</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={formData.category}
                    onChange={(event) => handleFieldChange('category', event.target.value)}
                    className={`w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 ${errors.category ? 'ring-2 ring-red-500' : 'focus:ring-[#7A1F2A]'}`}
                  >
                    <option value="">None</option>
                    {existingCategories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={formData.newCategory}
                    onChange={(event) => handleFieldChange('newCategory', event.target.value)}
                    className="w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                    placeholder="New category"
                  />
                </div>
                {errors.category && <p className="text-sm text-red-600 mt-1">{errors.category}</p>}
              </div>
            </div>

            <div>
              <label className="block mb-2">Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(event) => handleFieldChange('description', event.target.value)}
                className="w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A] resize-none"
                placeholder="Product description..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block mb-2">Price (₴)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={(event) => handleFieldChange('price', event.target.value)}
                  className={`w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 ${errors.price ? 'ring-2 ring-red-500' : 'focus:ring-[#7A1F2A]'}`}
                  placeholder="399"
                />
                {errors.price && <p className="text-sm text-red-600 mt-1">{errors.price}</p>}
              </div>
              <div>
                <label className="block mb-2">Stock</label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(event) => handleFieldChange('stock', event.target.value)}
                  className="w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                  placeholder="25"
                />
              </div>
              <div>
                <label className="block mb-2">Product Type</label>
                <select
                  value={formData.productType}
                  onChange={(event) => handleProductTypeChange(event.target.value as ProductType | '')}
                  className={`w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 ${errors.productType ? 'ring-2 ring-red-500' : 'focus:ring-[#7A1F2A]'}`}
                >
                  <option value="">None</option>
                  {productTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {errors.productType && <p className="text-sm text-red-600 mt-1">{errors.productType}</p>}
              </div>
              <div>
                <label className="block mb-2">Customization Mode</label>
                <select
                  value={formData.customizationMode}
                  onChange={(event) => handleFieldChange('customizationMode', event.target.value as CustomizationMode)}
                  className="w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                >
                  {customizationModeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <label className="w-full flex items-center gap-3 px-4 py-3 bg-[#F5F5F5] rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isCustomizable}
                    onChange={(event) => handleFieldChange('isCustomizable', event.target.checked)}
                    className="rounded"
                  />
                  <span>Customizable</span>
                </label>
              </div>
            </div>

            <div className="bg-[#F5F5F5] rounded-lg p-4">
              <h4 className="mb-3">Colors</h4>
              <div className="flex flex-wrap gap-2 mb-4">
                {paletteColors.map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => addColor(color)}
                    className="w-9 h-9 rounded-full border border-black/20 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto] gap-2 mb-3">
                <input
                  type="text"
                  value={formData.colorName}
                  onChange={(event) => handleFieldChange('colorName', event.target.value)}
                  className="px-4 py-2.5 bg-white rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                  placeholder="Color name"
                />
                <input
                  type="color"
                  value={formData.colorHex}
                  onChange={(event) => handleFieldChange('colorHex', event.target.value)}
                  className="w-full h-11 bg-white rounded border-none"
                />
                <button
                  type="button"
                  onClick={() => addColor({ name: formData.colorName || formData.colorHex, hex: formData.colorHex })}
                  className="px-4 py-2.5 border border-black/10 rounded hover:bg-white transition-colors"
                >
                  Add color
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.colors.map((color) => (
                  <span key={color.hex} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-black/10 rounded text-sm">
                    <span className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: color.hex }} />
                    {color.name} {color.hex}
                    <button type="button" onClick={() => removeColor(color.hex)} aria-label={`Remove ${color.name}`}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
              {errors.colors && <p className="text-sm text-red-600 mt-2">{errors.colors}</p>}
            </div>

            <div className="bg-[#F5F5F5] rounded-lg p-4">
              <h4 className="mb-3">Sizes, Capacities, Specs</h4>
              <div className="flex flex-wrap gap-2 mb-4">
                {(formData.productType ? sizePresets[formData.productType] : []).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    className={`px-3 py-2 border rounded text-sm transition-colors ${formData.sizes.includes(size) ? 'bg-black text-white border-black' : 'bg-white border-black/10 hover:bg-[#F5F5F5]'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 mb-3">
                <input
                  type="text"
                  value={formData.customSize}
                  onChange={(event) => handleFieldChange('customSize', event.target.value)}
                  className="px-4 py-2.5 bg-white rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                  placeholder="Custom value"
                />
                <button
                  type="button"
                  onClick={addCustomSize}
                  className="px-4 py-2.5 border border-black/10 rounded hover:bg-white transition-colors"
                >
                  Add value
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.sizes.map((size) => (
                  <span key={size} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-black/10 rounded text-sm">
                    {size}
                    <button type="button" onClick={() => toggleSize(size)} aria-label={`Remove ${size}`}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
              {errors.sizes && <p className="text-sm text-red-600 mt-2">{errors.sizes}</p>}
            </div>

            <div className="bg-[#F5F5F5] rounded-lg p-4">
              <h4 className="mb-3">Print Areas</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                {(formData.productType ? productPrintAreasByType[formData.productType] : []).map((area) => {
                  const isSelected = formData.printAreas.some((item) => item.key === area.key);
                  return (
                    <button
                      key={area.key}
                      type="button"
                      onClick={() => togglePrintArea(area)}
                      className={`px-3 py-2 border rounded text-sm text-left transition-colors ${isSelected ? 'bg-black text-white border-black' : 'bg-white border-black/10 hover:bg-[#F5F5F5]'}`}
                    >
                      {area.label} · {area.type}
                    </button>
                  );
                })}
              </div>
              <div className="space-y-2">
                {formData.printAreas.map((area) => (
                  <div key={area.key} className="grid grid-cols-1 sm:grid-cols-[120px_1fr_150px] gap-2">
                    <input
                      type="text"
                      value={area.key}
                      readOnly
                      className="px-3 py-2 bg-white rounded border-none text-sm"
                    />
                    <input
                      type="text"
                      value={area.label}
                      onChange={(event) => updatePrintArea(area.key, 'label', event.target.value)}
                      className="px-3 py-2 bg-white rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A] text-sm"
                    />
                    <select
                      value={area.type}
                      onChange={(event) => updatePrintArea(area.key, 'type', event.target.value)}
                      className="px-3 py-2 bg-white rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A] text-sm"
                    >
                      <option value="uv">uv</option>
                      <option value="decal">decal</option>
                      <option value="uv-or-decal">uv-or-decal</option>
                    </select>
                  </div>
                ))}
              </div>
              {errors.printAreas && <p className="text-sm text-red-600 mt-2">{errors.printAreas}</p>}
            </div>

            <div className="bg-[#F5F5F5] rounded-lg p-4">
              <h4 className="mb-3">2D Print Box</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(['x', 'y', 'width', 'height'] as const).map((field) => (
                  <div key={field}>
                    <label className="block text-sm mb-2 capitalize">{field} (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.printArea[field]}
                      onChange={(event) => handlePrintAreaBoxChange(field, event.target.value)}
                      className="w-full px-4 py-2.5 bg-white rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#F5F5F5] rounded-lg p-4">
              <h4 className="mb-3">Mockup Images</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mockupViews.map((view) => (
                  <div key={view}>
                    <label className="block text-sm mb-1 capitalize">{view}</label>
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      <input
                        type="text"
                        value={formData.mockups[view]}
                        onChange={(event) => updateMockup(view, event.target.value)}
                        className="px-3 py-2 bg-white rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A] text-sm"
                        placeholder={`/mockups/${formData.productType || 'product'}/white/${view}.png`}
                      />
                      <label className="px-3 py-2 bg-white border border-black/10 rounded cursor-pointer hover:bg-[#F5F5F5]">
                        <Upload className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={(event) => handleMockupUpload(view, event.target.files)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              {errors.mockups && <p className="text-sm text-red-600 mt-2">{errors.mockups}</p>}

              {formData.colors.length > 0 && (
                <div className="mt-5 space-y-4">
                  <h5 className="text-sm">Mockups by color</h5>
                  {formData.colors.map((color) => {
                    const colorKey = getColorKey(color);
                    const colorMockups = formData.mockupsByColor[colorKey] || emptyMockups;
                    return (
                      <div key={colorKey} className="bg-white rounded border border-black/10 p-3">
                        <p className="text-sm mb-2">{color.name} ({color.hex})</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {mockupViews.map((view) => (
                            <div key={`${colorKey}-${view}`} className="grid grid-cols-[1fr_auto] gap-2">
                              <input
                                type="text"
                                value={colorMockups[view]}
                                onChange={(event) => updateColorMockup(color, view, event.target.value)}
                                className="px-3 py-2 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A] text-sm"
                                placeholder={`${view} path`}
                              />
                              <label className="px-3 py-2 bg-[#F5F5F5] border border-black/10 rounded cursor-pointer hover:bg-white">
                                <Upload className="w-4 h-4" />
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg,image/jpg,image/webp"
                                  onChange={(event) => handleMockupUpload(view, event.target.files, color)}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-[#F5F5F5] rounded-lg p-4">
              <h4 className="mb-3">3D Model</h4>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
                <input
                  type="text"
                  value={formData.model3dUrl}
                  onChange={(event) => handleFieldChange('model3dUrl', event.target.value)}
                  className="px-4 py-3 bg-white rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                  placeholder="/models/product.glb"
                />
                <label className="px-4 py-3 bg-white border border-black/10 rounded cursor-pointer hover:bg-[#F5F5F5] flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload GLB/GLTF
                  <input
                    type="file"
                    accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
                    onChange={(event) => handleModelUpload(event.target.files)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-3 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors"
              >
                {editingProductId ? 'Save Changes' : 'Save Product'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 border border-black/10 rounded hover:bg-[#F5F5F5] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-black/10 rounded-lg p-6">
        <h3 className="mb-6">All Products</h3>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[1080px]">
            <thead>
              <tr className="border-b border-black/10">
                <th className="text-left pb-3 text-sm">Image</th>
                <th className="text-left pb-3 text-sm">Title</th>
                <th className="text-left pb-3 text-sm">Type</th>
                <th className="text-left pb-3 text-sm">Category</th>
                <th className="text-left pb-3 text-sm">Colors</th>
                <th className="text-left pb-3 text-sm">Model</th>
                <th className="text-left pb-3 text-sm">Price</th>
                <th className="text-left pb-3 text-sm">Stock</th>
                <th className="text-left pb-3 text-sm">Customizable</th>
                <th className="text-left pb-3 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-[#1A1A1A]">
                    Loading products...
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center">
                    <p className="text-red-600 mb-4">{loadError}</p>
                    <button
                      type="button"
                      onClick={loadProducts}
                      className="px-5 py-2.5 border border-black/10 rounded hover:bg-[#F5F5F5] transition-colors"
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-[#1A1A1A]">
                    No products found
                  </td>
                </tr>
              ) : products.map((product) => (
                <tr key={product.id} className="border-b border-black/10 align-top">
                  <td className="py-4">
                    <div className="w-12 h-12 bg-[#F5F5F5] rounded overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </td>
                  <td className="py-4">{product.name}</td>
                  <td className="py-4 text-[#1A1A1A]">{product.productType || '-'}</td>
                  <td className="py-4 text-[#1A1A1A]">{product.category}</td>
                  <td className="py-4">
                    <div className="flex gap-1.5 flex-wrap">
                      {(product.colorOptions || product.colors?.map((hex) => ({ name: hex, hex })) || []).map((color) => (
                        <span key={`${product.id}-${color.hex}`} className="w-5 h-5 rounded-full border border-black/10" title={`${color.name} ${color.hex}`} style={{ backgroundColor: color.hex }} />
                      ))}
                    </div>
                  </td>
                  <td className="py-4">
                    <span className={`inline-block px-2 py-1 text-xs rounded ${product.model3dUrl ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {product.model3dUrl ? 'Available' : 'None'}
                    </span>
                  </td>
                  <td className="py-4">₴{product.price}</td>
                  <td className="py-4">{product.stock ?? 0}</td>
                  <td className="py-4">
                    <span className={`inline-block px-2 py-1 text-xs rounded ${product.isCustomizable ?? product.customizable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {product.isCustomizable ?? product.customizable ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditProduct(product)}
                        className="p-2 hover:bg-[#F5F5F5] rounded"
                        aria-label={`Edit ${product.name}`}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 hover:bg-[#F5F5F5] rounded text-red-600"
                        aria-label={`Delete ${product.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
