import { useEffect, useState } from 'react';
import { Edit, Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '../../services/adminService';
import type { Product } from '../../types';

type ProductFormData = {
  title: string;
  description: string;
  category: string;
  price: string;
  stock: string;
  colors: string;
  sizes: string;
  images: string[];
  isCustomizable: boolean;
  printArea: {
    x: string;
    y: string;
    width: string;
    height: string;
  };
};

const emptyFormData: ProductFormData = {
  title: '',
  description: '',
  category: '',
  price: '',
  stock: '',
  colors: '',
  sizes: '',
  images: [],
  isCustomizable: true,
  printArea: {
    x: '20',
    y: '30',
    width: '60',
    height: '40',
  },
};

function listToText(items?: string[]) {
  return items?.join(', ') || '';
}

function textToList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function productToFormData(product: Product): ProductFormData {
  return {
    title: product.name,
    description: product.description || '',
    category: product.category || '',
    price: String(product.price),
    stock: String(product.stock ?? 0),
    colors: listToText(product.colors),
    sizes: listToText(product.sizes),
    images: product.images?.length ? product.images : [product.image],
    isCustomizable: Boolean(product.isCustomizable ?? product.customizable),
    printArea: {
      x: String(product.printArea?.x ?? 20),
      y: String(product.printArea?.y ?? 30),
      width: String(product.printArea?.width ?? 60),
      height: String(product.printArea?.height ?? 40),
    },
  };
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const nextProducts = await adminService.getProducts();
      setProducts(nextProducts);
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm() {
    setFormData(emptyFormData);
    setEditingProductId(null);
    setErrors({});
    setShowForm(false);
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {};

    if (!formData.title.trim()) nextErrors.title = 'Title is required';
    if (!formData.category.trim()) nextErrors.category = 'Category is required';
    if (!formData.price || Number(formData.price) <= 0) nextErrors.price = 'Price is required';
    if (textToList(formData.colors).length === 0) nextErrors.colors = 'At least one color is required';
    if (textToList(formData.sizes).length === 0) nextErrors.sizes = 'At least one size is required';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function buildProductData(): Omit<Product, 'id'> {
    const images = formData.images.length
      ? formData.images
      : ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop'];

    return {
      name: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category.trim(),
      price: Number(formData.price),
      stock: Number(formData.stock || 0),
      colors: textToList(formData.colors),
      sizes: textToList(formData.sizes),
      image: images[0],
      images,
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

    if (editingProductId) {
      await adminService.updateProduct(editingProductId, productData);
      toast.success('Product updated successfully');
    } else {
      await adminService.createProduct(productData);
      toast.success('Product created successfully');
    }

    await loadProducts();
    resetForm();
  }

  function handleEditProduct(product: Product) {
    setFormData(productToFormData(product));
    setEditingProductId(product.id);
    setErrors({});
    setShowForm(true);
  }

  async function handleDeleteProduct(productId: string) {
    await adminService.deleteProduct(productId);
    await loadProducts();
    toast.success('Product deleted successfully');
  }

  function handleImagesUpload(files: FileList | null) {
    if (!files?.length) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = () => {
        setFormData((currentFormData) => ({
          ...currentFormData,
          images: [...currentFormData.images, String(reader.result)],
        }));
      };
      reader.readAsDataURL(file);
    });
  }

  function handleFieldChange(field: keyof ProductFormData, value: string | boolean | string[]) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [field]: value,
    }));
  }

  function handlePrintAreaChange(field: keyof ProductFormData['printArea'], value: string) {
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl">Products</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) {
              setEditingProductId(null);
              setFormData(emptyFormData);
              setErrors({});
            }
          }}
          className="px-6 py-3 bg-[#7A1F2A] text-white rounded flex items-center gap-2 hover:bg-[#5A1520] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-black/10 rounded-lg p-6 mb-8">
          <h3 className="mb-6">{editingProductId ? 'Edit Product' : 'Add New Product'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2">Product Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(event) => handleFieldChange('title', event.target.value)}
                  className={`w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 ${
                    errors.title ? 'ring-2 ring-red-500' : 'focus:ring-[#7A1F2A]'
                  }`}
                  placeholder="Classic White T-Shirt"
                />
                {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
              </div>
              <div>
                <label className="block mb-2">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(event) => handleFieldChange('category', event.target.value)}
                  className={`w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 ${
                    errors.category ? 'ring-2 ring-red-500' : 'focus:ring-[#7A1F2A]'
                  }`}
                  placeholder="T-Shirts"
                />
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block mb-2">Price (₴)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={(event) => handleFieldChange('price', event.target.value)}
                  className={`w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 ${
                    errors.price ? 'ring-2 ring-red-500' : 'focus:ring-[#7A1F2A]'
                  }`}
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
                <label className="block mb-2">Available Colors</label>
                <input
                  type="text"
                  value={formData.colors}
                  onChange={(event) => handleFieldChange('colors', event.target.value)}
                  className={`w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 ${
                    errors.colors ? 'ring-2 ring-red-500' : 'focus:ring-[#7A1F2A]'
                  }`}
                  placeholder="White, Black, Gray"
                />
                {errors.colors && <p className="text-sm text-red-600 mt-1">{errors.colors}</p>}
              </div>
              <div>
                <label className="block mb-2">Available Sizes</label>
                <input
                  type="text"
                  value={formData.sizes}
                  onChange={(event) => handleFieldChange('sizes', event.target.value)}
                  className={`w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 ${
                    errors.sizes ? 'ring-2 ring-red-500' : 'focus:ring-[#7A1F2A]'
                  }`}
                  placeholder="S, M, L, XL"
                />
                {errors.sizes && <p className="text-sm text-red-600 mt-1">{errors.sizes}</p>}
              </div>
            </div>

            <div>
              <label className="block mb-2">Upload Images</label>
              <label className="border-2 border-dashed border-black/20 rounded-lg p-8 text-center cursor-pointer hover:bg-[#F5F5F5] transition-colors block">
                <Upload className="w-6 h-6 mx-auto mb-2 text-[#7A1F2A]" />
                <p className="text-[#1A1A1A]">Click to upload product images</p>
                <p className="text-sm text-[#1A1A1A] mt-1">PNG, JPG, WEBP</p>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  multiple
                  onChange={(event) => handleImagesUpload(event.target.files)}
                  className="hidden"
                />
              </label>
              {formData.images.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4">
                  {formData.images.map((image, index) => (
                    <div key={`${image}-${index}`} className="w-16 h-16 bg-[#F5F5F5] rounded overflow-hidden">
                      <img src={image} alt={`Product preview ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="customizable"
                checked={formData.isCustomizable}
                onChange={(event) => handleFieldChange('isCustomizable', event.target.checked)}
                className="rounded"
              />
              <label htmlFor="customizable">This product is customizable</label>
            </div>

            <div className="bg-[#F5F5F5] rounded-lg p-4">
              <h4 className="mb-3">Print Area Settings</h4>
              <p className="text-sm text-[#1A1A1A] mb-4">
                Define the area where custom designs can be placed (in percentage)
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm mb-2">X Position (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.printArea.x}
                    onChange={(event) => handlePrintAreaChange('x', event.target.value)}
                    className="w-full px-4 py-2.5 bg-white rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Y Position (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.printArea.y}
                    onChange={(event) => handlePrintAreaChange('y', event.target.value)}
                    className="w-full px-4 py-2.5 bg-white rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Width (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.printArea.width}
                    onChange={(event) => handlePrintAreaChange('width', event.target.value)}
                    className="w-full px-4 py-2.5 bg-white rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Height (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.printArea.height}
                    onChange={(event) => handlePrintAreaChange('height', event.target.value)}
                    className="w-full px-4 py-2.5 bg-white rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-black/10">
                <th className="text-left pb-3 text-sm">Image</th>
                <th className="text-left pb-3 text-sm">Title</th>
                <th className="text-left pb-3 text-sm">Category</th>
                <th className="text-left pb-3 text-sm">Price</th>
                <th className="text-left pb-3 text-sm">Stock</th>
                <th className="text-left pb-3 text-sm">Customizable</th>
                <th className="text-left pb-3 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#1A1A1A]">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#1A1A1A]">
                    No products found
                  </td>
                </tr>
              ) : products.map((product) => (
                <tr key={product.id} className="border-b border-black/10">
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
                  <td className="py-4 text-[#1A1A1A]">{product.category}</td>
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
