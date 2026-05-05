import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function AdminProducts() {
  const [showForm, setShowForm] = useState(false);

  const products = [
    { id: '1', name: 'Classic White T-Shirt', category: 'T-Shirts', price: 399, customizable: true, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop' },
    { id: '2', name: 'Premium Black Hoodie', category: 'Hoodies', price: 899, customizable: true, image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=100&h=100&fit=crop' },
    { id: '3', name: 'Comfort Sweatshirt', category: 'Sweatshirts', price: 699, customizable: true, image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=100&h=100&fit=crop' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl">Products</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-[#7A1F2A] text-white rounded flex items-center gap-2 hover:bg-[#5A1520] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-black/10 rounded-lg p-6 mb-8">
          <h3 className="mb-6">Add New Product</h3>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2">Product Title</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                  placeholder="Classic White T-Shirt"
                />
              </div>
              <div>
                <label className="block mb-2">Category</label>
                <select className="w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]">
                  <option>T-Shirts</option>
                  <option>Hoodies</option>
                  <option>Sweatshirts</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block mb-2">Description</label>
              <textarea
                rows={3}
                className="w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A] resize-none"
                placeholder="Product description..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block mb-2">Price (₴)</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                  placeholder="399"
                />
              </div>
              <div>
                <label className="block mb-2">Available Colors</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                  placeholder="White, Black, Gray"
                />
              </div>
              <div>
                <label className="block mb-2">Available Sizes</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                  placeholder="S, M, L, XL"
                />
              </div>
            </div>

            <div>
              <label className="block mb-2">Upload Images</label>
              <div className="border-2 border-dashed border-black/20 rounded-lg p-8 text-center cursor-pointer hover:bg-[#F5F5F5] transition-colors">
                <p className="text-[#1A1A1A]">Click to upload or drag and drop</p>
                <p className="text-sm text-[#1A1A1A] mt-1">PNG, JPG up to 10MB</p>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <input type="checkbox" id="customizable" defaultChecked className="rounded" />
              <label htmlFor="customizable">This product is customizable</label>
            </div>

            <div className="bg-[#F5F5F5] rounded-lg p-4">
              <h4 className="mb-3">Print Area Settings</h4>
              <p className="text-sm text-[#1A1A1A] mb-4">
                Define the area where custom designs can be placed (in percentage)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">X Position (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    defaultValue="20"
                    className="w-full px-4 py-2.5 bg-white rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                    placeholder="20"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Y Position (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    defaultValue="30"
                    className="w-full px-4 py-2.5 bg-white rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                    placeholder="30"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Width (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    defaultValue="60"
                    className="w-full px-4 py-2.5 bg-white rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                    placeholder="60"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Height (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    defaultValue="40"
                    className="w-full px-4 py-2.5 bg-white rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                    placeholder="40"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                className="px-6 py-3 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors"
              >
                Save Product
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
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
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/10">
                <th className="text-left pb-3 text-sm">Image</th>
                <th className="text-left pb-3 text-sm">Name</th>
                <th className="text-left pb-3 text-sm">Category</th>
                <th className="text-left pb-3 text-sm">Price</th>
                <th className="text-left pb-3 text-sm">Customizable</th>
                <th className="text-left pb-3 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
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
                  <td className="py-4">
                    <span className={`inline-block px-2 py-1 text-xs rounded ${product.customizable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {product.customizable ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-[#F5F5F5] rounded">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-[#F5F5F5] rounded text-red-600">
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
