import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useCart } from '../store/CartContext';
import { useAuth } from '../store/AuthContext';
import { deliveryService } from '../services/deliveryService';
import { cartService } from '../services/cartService';
import { orderService } from '../services/orderService';
import { paymentService } from '../services/paymentService';
import type { NovaPoshtaCity, NovaPoshtaWarehouse } from '../types';

type PaymentMethod = 'monobank' | '';

function uniqueCities(cities: NovaPoshtaCity[]) {
  return Array.from(new Map(cities.map((city) => [city.ref, city])).values());
}

function uniqueWarehouses(warehouses: NovaPoshtaWarehouse[]) {
  return Array.from(new Map(warehouses.map((warehouse) => [warehouse.ref, warehouse])).values());
}

export default function Checkout() {
  const navigate = useNavigate();
  const { items: cartItems, isLoading: isCartLoading, clearCart } = useCart();
  const { user } = useAuth();
  const didPrefillFromProfile = useRef(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('monobank');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    citySearch: '',
    selectedCity: null as NovaPoshtaCity | null,
    warehouseSearch: '',
    selectedWarehouse: null as NovaPoshtaWarehouse | null,
    deliveryComment: '',
  });
  const [cities, setCities] = useState<NovaPoshtaCity[]>([]);
  const [citySearchResults, setCitySearchResults] = useState<NovaPoshtaCity[]>([]);
  const [warehouseOptions, setWarehouseOptions] = useState<NovaPoshtaWarehouse[]>([]);
  const [warehouseSearchResults, setWarehouseSearchResults] = useState<NovaPoshtaWarehouse[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isSearchingCities, setIsSearchingCities] = useState(false);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);
  const [isSearchingWarehouses, setIsSearchingWarehouses] = useState(false);
  const [hasLoadedCities, setHasLoadedCities] = useState(false);
  const [hasInteractedWithCity, setHasInteractedWithCity] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState('');

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 1000 ? 0 : 50;
  const total = subtotal + shipping;
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const filteredCities = formData.citySearch.trim()
    ? cities.filter((city) =>
        `${city.description} ${city.areaDescription || ''} ${city.settlementTypeDescription || ''}`
          .toLowerCase()
          .includes(formData.citySearch.trim().toLowerCase()),
      )
    : cities;
  const cityOptions = uniqueCities(
    formData.citySearch.trim()
      ? [...citySearchResults, ...filteredCities]
      : cities,
  );
  const filteredWarehouses = formData.warehouseSearch.trim()
    ? warehouseOptions.filter((warehouse) =>
        `${warehouse.description} ${warehouse.shortAddress || ''} ${warehouse.number || ''}`
          .toLowerCase()
          .includes(formData.warehouseSearch.trim().toLowerCase()),
      )
    : warehouseOptions;
  const displayedWarehouses = uniqueWarehouses(
    formData.warehouseSearch.trim()
      ? [...warehouseSearchResults, ...filteredWarehouses]
      : warehouseOptions,
  );

  useEffect(() => {
    let isMounted = true;
    setIsLoadingCities(true);
    deliveryService.getCities()
      .then((nextCities) => {
        if (isMounted) setCities(nextCities);
      })
      .catch(() => {
        if (isMounted) setCities([]);
      })
      .finally(() => {
        if (isMounted) {
          setHasLoadedCities(true);
          setIsLoadingCities(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!user || didPrefillFromProfile.current) return;

    const [fallbackFirstName = '', ...fallbackLastName] = (user.name || '').split(' ').filter(Boolean);
    const profileCity = user.city?.ref && user.city.description
      ? {
          ref: user.city.ref,
          description: user.city.description,
        }
      : null;
    const profileWarehouse = profileCity && user.novaPoshtaWarehouse?.ref && user.novaPoshtaWarehouse.description
      ? {
          ref: user.novaPoshtaWarehouse.ref,
          description: user.novaPoshtaWarehouse.description,
          shortAddress: user.novaPoshtaWarehouse.shortAddress,
          number: user.novaPoshtaWarehouse.number,
        }
      : null;

    setFormData((currentData) => ({
      ...currentData,
      firstName: currentData.firstName || user.firstName || fallbackFirstName,
      lastName: currentData.lastName || user.lastName || fallbackLastName.join(' '),
      phone: currentData.phone || user.phone || '',
      email: currentData.email || user.email || '',
      citySearch: currentData.citySearch || profileCity?.description || '',
      selectedCity: currentData.selectedCity || profileCity,
      selectedWarehouse: currentData.selectedWarehouse || profileWarehouse,
      warehouseSearch: currentData.warehouseSearch || profileWarehouse?.description || '',
    }));
    didPrefillFromProfile.current = true;
  }, [user]);

  useEffect(() => {
    const search = formData.citySearch.trim();
    if (!isCityDropdownOpen || formData.selectedCity || search.length < 2) {
      setCitySearchResults([]);
      return;
    }

    let isMounted = true;
    const timeoutId = window.setTimeout(() => {
      setIsSearchingCities(true);
      deliveryService.searchCities(search)
        .then((nextCities) => {
          if (isMounted) setCitySearchResults(nextCities);
        })
        .catch(() => {
          if (isMounted) setCitySearchResults([]);
        })
        .finally(() => {
          if (isMounted) setIsSearchingCities(false);
        });
    }, 350);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [formData.citySearch, formData.selectedCity, isCityDropdownOpen]);

  useEffect(() => {
    if (!formData.selectedCity?.ref) {
      setWarehouseOptions([]);
      setWarehouseSearchResults([]);
      return;
    }

    let isMounted = true;
    setIsLoadingWarehouses(true);
    deliveryService.getWarehouses(formData.selectedCity.ref)
      .then((warehouses) => {
        if (isMounted) setWarehouseOptions(warehouses);
      })
      .catch(() => {
        if (isMounted) setWarehouseOptions([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingWarehouses(false);
      });

    return () => {
      isMounted = false;
    };
  }, [formData.selectedCity?.ref]);

  useEffect(() => {
    const search = formData.warehouseSearch.trim();
    if (!formData.selectedCity?.ref || formData.selectedWarehouse || search.length < 2) {
      setWarehouseSearchResults([]);
      return;
    }

    let isMounted = true;
    const timeoutId = window.setTimeout(() => {
      setIsSearchingWarehouses(true);
      deliveryService.searchWarehouses(formData.selectedCity!.ref, search)
        .then((warehouses) => {
          if (isMounted) setWarehouseSearchResults(warehouses);
        })
        .catch(() => {
          if (isMounted) setWarehouseSearchResults([]);
        })
        .finally(() => {
          if (isMounted) setIsSearchingWarehouses(false);
        });
    }, 350);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [formData.warehouseSearch, formData.selectedCity, formData.selectedWarehouse]);

  function updateField(field: keyof typeof formData, value: string) {
    setFormData((currentData) => ({ ...currentData, [field]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [field]: '' }));
  }

  function handleCitySelect(city: NovaPoshtaCity) {
    console.debug('[Nova Poshta] selected city:', city);
    setFormData((currentData) => ({
      ...currentData,
      citySearch: city.description,
      selectedCity: city,
      warehouseSearch: '',
      selectedWarehouse: null,
    }));
    setCitySearchResults([]);
    setWarehouseSearchResults([]);
    setHasInteractedWithCity(true);
    setIsCityDropdownOpen(false);
    setErrors((currentErrors) => ({ ...currentErrors, city: '', warehouse: '' }));
  }

  function handleWarehouseSelect(warehouseRef: string) {
    const warehouse = warehouseOptions.find((item) => item.ref === warehouseRef);
    setFormData((currentData) => ({
      ...currentData,
      selectedWarehouse: warehouse || null,
      warehouseSearch: warehouse?.description || '',
    }));
    setWarehouseSearchResults([]);
    setErrors((currentErrors) => ({ ...currentErrors, warehouse: '' }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setCreatedOrderId('');

    const newErrors: Record<string, string> = {};
    const customerName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
    if (!customerName) newErrors.firstName = 'Customer name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!formData.selectedCity) newErrors.city = 'City is required';
    if (!formData.selectedWarehouse) newErrors.warehouse = 'Warehouse or branch is required';
    if (!paymentMethod) newErrors.paymentMethod = 'Payment method is required';
    if (cartItems.length === 0) newErrors.cart = 'Your cart is empty';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const order = await orderService.createOrder({
        orderNumber: `ORD-${Date.now()}`,
        subtotal,
        total,
        paymentMethod,
        paymentProvider: paymentMethod,
        paymentStatus: 'pending',
        status: 'pending',
        orderStatus: 'pending',
        deliveryStatus: 'pending',
        trackingNumber: '',
        items: cartItems.map((item) => ({
          id: item.id,
          productId: item.productId,
          productType: item.productType,
          name: item.title,
          image: item.screenshot3dUrl || item.previewUrl || item.image || '',
          previewUrl: item.previewUrl,
          screenshot3dUrl: item.screenshot3dUrl,
          customImage: item.customImage,
          customDesignId: item.customDesignId,
          customDesign: item.customDesign,
          customDesignPlacements: item.customDesignPlacements,
          usedPlacements: item.usedPlacements,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          price: item.price,
          isCustomized: item.isCustomized,
          hasCustomDesign: item.isCustomized,
        })),
        customer: {
          name: customerName,
          email: formData.email.trim(),
          phone: formData.phone.trim(),
        },
        delivery: {
          provider: 'nova_poshta',
          city: {
            ref: formData.selectedCity?.ref,
            description: formData.selectedCity?.description,
          },
          warehouse: {
            ref: formData.selectedWarehouse?.ref,
            description: formData.selectedWarehouse?.description,
            shortAddress: formData.selectedWarehouse?.shortAddress,
            number: formData.selectedWarehouse?.number,
          },
          comment: formData.deliveryComment.trim(),
        },
      });

      const payment = await paymentService.createPayment(order.id, paymentMethod);
      const paymentUrl = payment.paymentUrl || payment.redirectUrl;

      setCreatedOrderId(order.id);

      if (paymentUrl) {
        cartService.savePendingPaymentCart(cartItems);
        window.location.href = paymentUrl;
        return;
      }

      await paymentService.updatePaymentStatus(order.id, 'paid');
      await clearCart();
      toast.success('Order created successfully');
      navigate(`/orders/${order.id}`);
    } catch {
      setErrors({ form: 'Unable to create order. Please try again.' });
      toast.error('Unable to create order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl md:text-4xl mb-8">Checkout</h1>
      {isCartLoading && (
        <div className="bg-white border border-black/10 rounded-lg p-6 mb-6 text-center text-[#1A1A1A]">
          Loading checkout...
        </div>
      )}
      {errors.form && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-4 mb-6">
          {errors.form}
        </div>
      )}
      {createdOrderId && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded p-4 mb-6">
          Order {createdOrderId} has been created. Opening payment...
        </div>
      )}
      {!isCartLoading && cartItems.length === 0 && (
        <div className="bg-white border border-black/10 rounded-lg p-6 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl mb-1">Your cart is empty</h2>
            <p className="text-[#1A1A1A]">Add a product before placing an order.</p>
          </div>
          <Link
            to="/catalog"
            className="px-6 py-3 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors text-center"
          >
            Go to catalog
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-black/10 rounded-lg p-6">
              <h3 className="mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    className={`w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 ${
                      errors.firstName ? 'ring-2 ring-red-500' : 'focus:ring-[#7A1F2A]'
                    }`}
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block mb-2">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    className={`w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 ${
                      errors.lastName ? 'ring-2 ring-red-500' : 'focus:ring-[#7A1F2A]'
                    }`}
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>
                  )}
                </div>
                <div>
                  <label className="block mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className={`w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 ${
                      errors.phone ? 'ring-2 ring-red-500' : 'focus:ring-[#7A1F2A]'
                    }`}
                    placeholder="+380"
                  />
                  {errors.phone && (
                    <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>
                <div>
                  <label className="block mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className={`w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 ${
                      errors.email ? 'ring-2 ring-red-500' : 'focus:ring-[#7A1F2A]'
                    }`}
                    placeholder="john@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white border border-black/10 rounded-lg p-6">
              <h3 className="mb-4">Nova Poshta Delivery</h3>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2">City</label>
                  <input
                    type="text"
                    value={formData.citySearch}
                    onFocus={() => {
                      setHasInteractedWithCity(true);
                      setIsCityDropdownOpen(true);
                    }}
                    onChange={(e) => {
                      setHasInteractedWithCity(true);
                      setIsCityDropdownOpen(true);
                      setFormData((currentData) => ({
                        ...currentData,
                        citySearch: e.target.value,
                        selectedCity: null,
                        warehouseSearch: '',
                        selectedWarehouse: null,
                      }));
                      setErrors((currentErrors) => ({ ...currentErrors, city: '', warehouse: '' }));
                    }}
                    className={`w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 ${
                      errors.city ? 'ring-2 ring-red-500' : 'focus:ring-[#7A1F2A]'
                    }`}
                    placeholder="Select city"
                  />
                  {isCityDropdownOpen && (isLoadingCities || isSearchingCities) && (
                    <p className="text-xs text-[#1A1A1A] mt-2">Loading cities...</p>
                  )}
                  {hasInteractedWithCity
                    && isCityDropdownOpen
                    && hasLoadedCities
                    && !isLoadingCities
                    && !isSearchingCities
                    && cityOptions.length === 0
                    && !formData.selectedCity && (
                    <p className="text-xs text-[#1A1A1A] mt-2">No cities found</p>
                  )}
                  {isCityDropdownOpen && cityOptions.length > 0 && (
                    <div className="mt-2 border border-black/10 rounded bg-white overflow-hidden max-h-72 overflow-y-auto">
                      {cityOptions.slice(0, 80).map((city) => (
                        <button
                          key={city.ref}
                          type="button"
                          onClick={() => handleCitySelect(city)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-[#F5F5F5]"
                        >
                          {city.description}
                          {city.areaDescription ? `, ${city.areaDescription}` : ''}
                          {city.settlementTypeDescription ? ` (${city.settlementTypeDescription})` : ''}
                        </button>
                      ))}
                    </div>
                  )}
                  {formData.selectedCity && (
                    <p className="text-xs text-[#1A1A1A] mt-2">
                      Selected: {formData.selectedCity.description}
                      {formData.selectedCity.areaDescription ? `, ${formData.selectedCity.areaDescription}` : ''}
                    </p>
                  )}
                  {errors.city && (
                    <p className="text-red-600 text-sm mt-1">{errors.city}</p>
                  )}
                </div>
                <div>
                  <label className="block mb-2">Warehouse / Branch / Parcel Locker</label>
                  <input
                    type="text"
                    value={formData.warehouseSearch}
                    onChange={(event) => {
                      setFormData((currentData) => ({
                        ...currentData,
                        warehouseSearch: event.target.value,
                        selectedWarehouse: null,
                      }));
                      setErrors((currentErrors) => ({ ...currentErrors, warehouse: '' }));
                    }}
                    disabled={!formData.selectedCity || isLoadingWarehouses}
                    className={`w-full mb-2 px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 ${
                      errors.warehouse ? 'ring-2 ring-red-500' : 'focus:ring-[#7A1F2A]'
                    } disabled:opacity-70`}
                    placeholder="Search warehouse, branch, or parcel locker"
                  />
                  <select
                    value={formData.selectedWarehouse?.ref || ''}
                    onChange={(e) => handleWarehouseSelect(e.target.value)}
                    className={`w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 ${
                      errors.warehouse ? 'ring-2 ring-red-500' : 'focus:ring-[#7A1F2A]'
                    }`}
                    disabled={!formData.selectedCity || isLoadingWarehouses}
                  >
                    <option value="">
                      {isLoadingWarehouses || isSearchingWarehouses ? 'Loading warehouses...' : 'Select warehouse'}
                    </option>
                    {displayedWarehouses.map((warehouse) => (
                      <option key={warehouse.ref} value={warehouse.ref}>
                        {warehouse.description}
                      </option>
                    ))}
                  </select>
                  {!isLoadingWarehouses
                    && !isSearchingWarehouses
                    && formData.selectedCity
                    && displayedWarehouses.length === 0 && (
                    <p className="text-xs text-[#1A1A1A] mt-1">No warehouses found</p>
                  )}
                  {formData.selectedWarehouse && (
                    <p className="text-xs text-[#1A1A1A] mt-1">
                      {formData.selectedWarehouse.shortAddress || formData.selectedWarehouse.description}
                    </p>
                  )}
                  {errors.warehouse && (
                    <p className="text-red-600 text-sm mt-1">{errors.warehouse}</p>
                  )}
                </div>
                <div>
                  <label className="block mb-2">Delivery Comment</label>
                  <textarea
                    value={formData.deliveryComment}
                    onChange={(e) => updateField('deliveryComment', e.target.value)}
                    className="w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                    placeholder="Optional comment for delivery"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-black/10 rounded-lg p-6">
              <h3 className="mb-4">Payment Method</h3>
              <div className="space-y-3">
                <label className={`flex items-center gap-3 p-4 border-2 rounded cursor-pointer transition-colors ${
                  paymentMethod === 'monobank' ? 'border-[#7A1F2A] bg-[#7A1F2A]/5' : 'border-black/10 hover:bg-[#F5F5F5]'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="monobank"
                    checked={paymentMethod === 'monobank'}
                    onChange={(e) => {
                      setPaymentMethod(e.target.value as PaymentMethod);
                      setErrors((currentErrors) => ({ ...currentErrors, paymentMethod: '' }));
                    }}
                    className="w-4 h-4"
                  />
                  <span>Monobank</span>
                </label>
                {errors.paymentMethod && (
                  <p className="text-red-600 text-sm mt-1">{errors.paymentMethod}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white border border-black/10 rounded-lg p-4 sm:p-6 lg:sticky lg:top-24">
              <h3 className="mb-4">Order Summary</h3>

              <div className="space-y-3 mb-6">
                <div className="pb-3 border-b border-black/10 space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 bg-[#F5F5F5] rounded overflow-hidden border border-black/5 flex-shrink-0">
                        {item.screenshot3dUrl || item.previewUrl || item.customImage || item.image ? (
                          <img
                            src={item.screenshot3dUrl || item.previewUrl || item.customImage || item.image}
                            alt={item.title}
                            className="w-full h-full object-contain p-2"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-[#1A1A1A]">
                            No preview
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm mb-1">{item.title}</p>
                        <p className="text-xs text-[#1A1A1A]">
                          {item.size} • {item.color} • x{item.quantity}
                        </p>
                        <p className="text-xs text-[#1A1A1A]">
                          {item.isCustomized ? 'Custom design saved' : 'No customization'}
                        </p>
                      </div>
                      <p className="text-sm">₴{item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between text-[#1A1A1A]">
                  <span>Subtotal ({totalItems} items)</span>
                  <span>₴{subtotal}</span>
                </div>
                <div className="flex justify-between text-[#1A1A1A]">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : `₴${shipping}`}</span>
                </div>
              </div>

              <div className="border-t border-black/10 pt-4 mb-6">
                <div className="flex justify-between text-xl">
                  <span>Total</span>
                  <span>₴{total}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isCartLoading}
                className="w-full py-4 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating order...' : 'Pay and place order'}
              </button>
              {errors.cart && (
                <p className="text-red-600 text-sm mt-3 text-center">{errors.cart}</p>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
