import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Check, Edit2, KeyRound, LogOut, Package, ShieldCheck, ShieldOff, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from '../components/StatusBadge';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../components/ui/input-otp';
import { formatOrderDateTime } from '../lib/dateFormat';
import { deliveryService } from '../services/deliveryService';
import { orderService } from '../services/orderService';
import { useAuth } from '../store/AuthContext';
import type { TwoFactorSetup } from '../services/authService';
import type { NovaPoshtaCity, NovaPoshtaWarehouse, Order, User } from '../types';

type ProfileForm = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  citySearch: string;
  selectedCity: NovaPoshtaCity | null;
  warehouseSearch: string;
  selectedWarehouse: NovaPoshtaWarehouse | null;
};

type BadgeStatus =
  | 'pending'
  | 'paid'
  | 'production'
  | 'shipped'
  | 'delivered'
  | 'new'
  | 'in_progress'
  | 'resolved';

function getNameParts(user: User | null) {
  const [firstName = '', ...lastNameParts] = (user?.name || '').split(' ').filter(Boolean);

  return {
    firstName: user?.firstName || firstName,
    lastName: user?.lastName || lastNameParts.join(' '),
  };
}

function toBadgeStatus(status?: string): BadgeStatus {
  const supportedStatuses: BadgeStatus[] = [
    'pending',
    'paid',
    'production',
    'shipped',
    'delivered',
    'new',
    'in_progress',
    'resolved',
  ];

  return supportedStatuses.includes(status as BadgeStatus) ? (status as BadgeStatus) : 'pending';
}

function uniqueCities(cities: NovaPoshtaCity[]) {
  return Array.from(new Map(cities.map((city) => [city.ref, city])).values());
}

function uniqueWarehouses(warehouses: NovaPoshtaWarehouse[]) {
  return Array.from(new Map(warehouses.map((warehouse) => [warehouse.ref, warehouse])).values());
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateProfile, setupTwoFactor, enableTwoFactor, disableTwoFactor } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileForm>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    citySearch: '',
    selectedCity: null,
    warehouseSearch: '',
    selectedWarehouse: null,
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
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(null);
  const [twoFactorOtp, setTwoFactorOtp] = useState('');
  const [isUpdatingTwoFactor, setIsUpdatingTwoFactor] = useState(false);

  useEffect(() => {
    const nameParts = getNameParts(user);
    const profileCity = user?.city?.ref && user.city.description
      ? {
          ref: user.city.ref,
          description: user.city.description,
        }
      : null;
    const profileWarehouse = profileCity && user?.novaPoshtaWarehouse?.ref && user.novaPoshtaWarehouse.description
      ? {
          ref: user.novaPoshtaWarehouse.ref,
          description: user.novaPoshtaWarehouse.description,
          shortAddress: user.novaPoshtaWarehouse.shortAddress,
          number: user.novaPoshtaWarehouse.number,
        }
      : null;

    setFormData({
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      phone: user?.phone || '',
      email: user?.email || '',
      citySearch: profileCity?.description || '',
      selectedCity: profileCity,
      selectedWarehouse: profileWarehouse,
      warehouseSearch: profileWarehouse?.description || '',
    });
  }, [user]);

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
    if (!isEditing) return;

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
  }, [formData.citySearch, formData.selectedCity, isCityDropdownOpen, isEditing]);

  useEffect(() => {
    if (!formData.selectedCity?.ref || !isEditing) {
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
  }, [formData.selectedCity?.ref, isEditing]);

  useEffect(() => {
    const search = formData.warehouseSearch.trim();
    if (!formData.selectedCity?.ref || formData.selectedWarehouse || search.length < 2 || !isEditing) {
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
  }, [formData.warehouseSearch, formData.selectedCity, formData.selectedWarehouse, isEditing]);

  useEffect(() => {
    async function loadRecentOrders() {
      try {
        const nextOrders = await orderService.getMyOrders();
        setOrders(nextOrders.slice(0, 2));
        setOrdersError('');
      } catch {
        setOrders([]);
        setOrdersError('Unable to load recent orders.');
      } finally {
        setIsLoadingOrders(false);
      }
    }

    loadRecentOrders();
  }, []);

  const displayName =
    `${formData.firstName} ${formData.lastName}`.trim() || user?.name || 'Solution customer';
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

  const handleSaveProfile = async () => {
    if (!user) return;

    await updateProfile({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      phone: formData.phone.trim(),
      city: formData.selectedCity
        ? {
            ref: formData.selectedCity.ref,
            description: formData.selectedCity.description,
          }
        : undefined,
      novaPoshtaWarehouse: formData.selectedWarehouse
        ? {
            ref: formData.selectedWarehouse.ref,
            description: formData.selectedWarehouse.description,
            shortAddress: formData.selectedWarehouse.shortAddress,
            number: formData.selectedWarehouse.number,
          }
        : undefined,
    });
    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleFieldChange = (field: keyof ProfileForm, value: string) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [field]: value,
    }));
  };

  const handleCitySelect = (city: NovaPoshtaCity) => {
    console.debug('[Nova Poshta] selected city:', city);
    setFormData((currentFormData) => ({
      ...currentFormData,
      citySearch: city.description,
      selectedCity: city,
      warehouseSearch: '',
      selectedWarehouse: null,
    }));
    setCitySearchResults([]);
    setWarehouseSearchResults([]);
    setHasInteractedWithCity(true);
    setIsCityDropdownOpen(false);
  };

  const handleWarehouseSelect = (warehouseRef: string) => {
    const warehouse = warehouseOptions.find((item) => item.ref === warehouseRef);
    setFormData((currentFormData) => ({
      ...currentFormData,
      selectedWarehouse: warehouse || null,
      warehouseSearch: warehouse?.description || '',
    }));
    setWarehouseSearchResults([]);
  };

  const handleStartTwoFactorSetup = async () => {
    setIsUpdatingTwoFactor(true);

    try {
      const setup = await setupTwoFactor();
      setTwoFactorSetup(setup);
      setTwoFactorOtp('');
      toast.success('Scan or enter the setup key, then verify the code');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to start two-factor setup');
    } finally {
      setIsUpdatingTwoFactor(false);
    }
  };

  const handleEnableTwoFactor = async () => {
    if (twoFactorOtp.length !== 6) {
      toast.error('Enter the 6-digit authentication code');
      return;
    }

    setIsUpdatingTwoFactor(true);

    try {
      await enableTwoFactor(twoFactorOtp);
      setTwoFactorSetup(null);
      setTwoFactorOtp('');
      toast.success('Two-factor authentication enabled');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to enable two-factor authentication');
    } finally {
      setIsUpdatingTwoFactor(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    if (twoFactorOtp.length !== 6) {
      toast.error('Enter the 6-digit authentication code');
      return;
    }

    setIsUpdatingTwoFactor(true);

    try {
      await disableTwoFactor(twoFactorOtp);
      setTwoFactorSetup(null);
      setTwoFactorOtp('');
      toast.success('Two-factor authentication disabled');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to disable two-factor authentication');
    } finally {
      setIsUpdatingTwoFactor(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl md:text-4xl mb-8">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="bg-white border border-black/10 rounded-lg p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-[#F5F5F5] rounded-full flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-[#7A1F2A]" />
              </div>
              <div>
                <h3 className="mb-1">{displayName}</h3>
                <p className="text-sm text-[#1A1A1A]">{formData.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  disabled={!isEditing}
                  onChange={(event) => handleFieldChange('firstName', event.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A] disabled:opacity-70"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  disabled={!isEditing}
                  onChange={(event) => handleFieldChange('lastName', event.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A] disabled:opacity-70"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  disabled={!isEditing}
                  onChange={(event) => handleFieldChange('phone', event.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A] disabled:opacity-70"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  readOnly
                  className="w-full px-4 py-2.5 bg-[#F5F5F5] rounded border-none focus:outline-none opacity-70"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">City in Ukraine</label>
                <input
                  type="text"
                  value={formData.citySearch}
                  disabled={!isEditing}
                  onFocus={() => {
                    setHasInteractedWithCity(true);
                    setIsCityDropdownOpen(true);
                  }}
                  onChange={(event) => {
                    setHasInteractedWithCity(true);
                    setIsCityDropdownOpen(true);
                    setFormData((currentFormData) => ({
                      ...currentFormData,
                      citySearch: event.target.value,
                      selectedCity: null,
                      warehouseSearch: '',
                      selectedWarehouse: null,
                    }));
                  }}
                  className="w-full px-4 py-2.5 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A] disabled:opacity-70"
                  placeholder="Select city"
                />
                {isEditing && isCityDropdownOpen && (isLoadingCities || isSearchingCities) && (
                  <p className="text-xs text-[#1A1A1A] mt-2">Loading cities...</p>
                )}
                {isEditing
                  && hasInteractedWithCity
                  && isCityDropdownOpen
                  && hasLoadedCities
                  && !isLoadingCities
                  && !isSearchingCities
                  && cityOptions.length === 0
                  && !formData.selectedCity && (
                  <p className="text-xs text-[#1A1A1A] mt-2">No cities found</p>
                )}
                {isEditing && isCityDropdownOpen && cityOptions.length > 0 && (
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
                {isEditing && formData.selectedCity && (
                  <p className="text-xs text-[#1A1A1A] mt-2">
                    Selected: {formData.selectedCity.description}
                    {formData.selectedCity.areaDescription ? `, ${formData.selectedCity.areaDescription}` : ''}
                  </p>
                )}
              </div>
              <div>
                <label className="block mb-2 text-sm">Nova Poshta Warehouse / Branch</label>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={formData.warehouseSearch}
                      onChange={(event) => {
                        setFormData((currentFormData) => ({
                          ...currentFormData,
                          warehouseSearch: event.target.value,
                          selectedWarehouse: null,
                        }));
                      }}
                      disabled={!formData.selectedCity || isLoadingWarehouses}
                      className="w-full mb-2 px-4 py-2.5 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A] disabled:opacity-70"
                      placeholder="Search warehouse, branch, or parcel locker"
                    />
                    <select
                      value={formData.selectedWarehouse?.ref || ''}
                      onChange={(event) => handleWarehouseSelect(event.target.value)}
                      disabled={!formData.selectedCity || isLoadingWarehouses}
                      className="w-full px-4 py-2.5 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A] disabled:opacity-70"
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
                  </>
                ) : (
                  <input
                    type="text"
                    value={formData.selectedWarehouse?.description || ''}
                    disabled
                    className="w-full px-4 py-2.5 bg-[#F5F5F5] rounded border-none focus:outline-none disabled:opacity-70"
                    placeholder="No warehouse saved"
                  />
                )}
                {formData.selectedWarehouse?.shortAddress && (
                  <p className="text-xs text-[#1A1A1A] mt-1">{formData.selectedWarehouse.shortAddress}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="w-full py-3 border border-black/10 rounded flex items-center justify-center gap-2 hover:bg-[#F5F5F5] transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit profile
              </button>

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={!isEditing}
                className="w-full py-3 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save changes
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-3 border border-black/10 rounded flex items-center justify-center gap-2 hover:bg-[#F5F5F5] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>

          <div className="bg-white border border-black/10 rounded-lg p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="mb-1">Security</h3>
                <p className="text-sm text-[#1A1A1A]">
                  Two-factor authentication is {user?.twoFactorEnabled ? 'enabled' : 'disabled'}.
                </p>
              </div>
              {user?.twoFactorEnabled ? (
                <ShieldCheck className="h-6 w-6 text-green-600" />
              ) : (
                <ShieldOff className="h-6 w-6 text-[#7A1F2A]" />
              )}
            </div>

            {(twoFactorSetup || user?.twoFactorEnabled) && (
              <div className="mb-5 space-y-4 rounded border border-black/10 bg-[#F5F5F5] p-4">
                {twoFactorSetup.qrCodeUrl && (
                  <img
                    src={twoFactorSetup.qrCodeUrl}
                    alt="Two-factor authentication QR code"
                    className="mx-auto h-40 w-40"
                  />
                )}
                {twoFactorSetup.secret && (
                  <div>
                    <p className="text-xs text-[#1A1A1A] mb-1">Setup key</p>
                    <code className="block break-all rounded bg-white px-3 py-2 text-sm">
                      {twoFactorSetup.secret}
                    </code>
                  </div>
                )}
                <div>
                  <label className="block mb-3 text-sm">
                    {user?.twoFactorEnabled ? 'Code to disable' : 'Verification code'}
                  </label>
                  <InputOTP
                    maxLength={6}
                    value={twoFactorOtp}
                    onChange={(value) => setTwoFactorOtp(value.replace(/\D/g, ''))}
                    containerClassName="justify-center"
                  >
                    <InputOTPGroup>
                      {Array.from({ length: 6 }).map((_, index) => (
                        <InputOTPSlot key={index} index={index} className="h-10 w-9 bg-white" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {user?.twoFactorEnabled ? (
                <button
                  type="button"
                  onClick={handleDisableTwoFactor}
                  disabled={isUpdatingTwoFactor}
                  className="w-full py-3 border border-black/10 rounded flex items-center justify-center gap-2 hover:bg-[#F5F5F5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShieldOff className="w-4 h-4" />
                  {isUpdatingTwoFactor ? 'Updating...' : 'Disable 2FA'}
                </button>
              ) : twoFactorSetup ? (
                <button
                  type="button"
                  onClick={handleEnableTwoFactor}
                  disabled={isUpdatingTwoFactor}
                  className="w-full py-3 bg-[#7A1F2A] text-white rounded flex items-center justify-center gap-2 hover:bg-[#5A1520] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {isUpdatingTwoFactor ? 'Verifying...' : 'Verify and enable'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartTwoFactorSetup}
                  disabled={isUpdatingTwoFactor}
                  className="w-full py-3 bg-[#7A1F2A] text-white rounded flex items-center justify-center gap-2 hover:bg-[#5A1520] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <KeyRound className="w-4 h-4" />
                  {isUpdatingTwoFactor ? 'Preparing...' : 'Enable 2FA'}
                </button>
              )}
              <p className="text-xs text-[#1A1A1A]">
                Mock mode accepts code 123456.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white border border-black/10 rounded-lg p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h3>Recent Orders</h3>
              <Link to="/orders" className="text-sm text-[#7A1F2A] hover:underline">
                View all orders
              </Link>
            </div>

            {isLoadingOrders ? (
              <div className="text-center py-12 text-[#1A1A1A]">
                Loading profile orders...
              </div>
            ) : ordersError ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{ordersError}</p>
                <Link
                  to="/orders"
                  className="inline-block px-6 py-3 border border-black/10 rounded hover:bg-[#F5F5F5] transition-colors"
                >
                  Open orders
                </Link>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#F5F5F5] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-[#1A1A1A]" />
                </div>
                <p className="text-[#1A1A1A] mb-4">No orders yet</p>
                <Link
                  to="/catalog"
                  className="inline-block px-6 py-3 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors"
                >
                  Go to catalog
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border border-black/10 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                      <div>
                        <h4 className="mb-1">Order</h4>
                        <p className="text-sm text-[#1A1A1A]">{formatOrderDateTime(order.date)}</p>
                      </div>
                      <div className="sm:text-right">
                        <p className="mb-2">₴{order.total}</p>
                        <div className="flex gap-2 sm:justify-end">
                          <StatusBadge status={toBadgeStatus(order.paymentStatus)} size="sm" />
                          <StatusBadge status={toBadgeStatus(order.orderStatus || order.status)} size="sm" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {(order.items || []).map((item, index) => {
                        const itemName = item.name || 'Product';
                        return (
                        <div key={`${order.id}-${item.productId || itemName}-${index}`} className="flex items-center gap-3">
                          <div className="w-16 h-16 bg-[#F5F5F5] rounded overflow-hidden relative">
                            <img
                              src={item.screenshot3dUrl || item.previewUrl || item.customDesignImage || item.customImage || item.image}
                              alt={itemName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{itemName}</p>
                            <p className="text-xs text-[#1A1A1A]">Quantity: {item.quantity || 1}</p>
                            {(item.customImage || item.customDesignImage || item.hasCustomDesign) && (
                              <p className="text-xs text-green-600 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Custom design
                              </p>
                            )}
                          </div>
                        </div>
                        );
                      })}
                    </div>

                    {order.trackingNumber && (
                      <div className="bg-[#F5F5F5] rounded p-3 flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                        <Package className="w-4 h-4 text-[#7A1F2A] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#1A1A1A] mb-0.5">Tracking Number</p>
                          <p className="text-sm break-all">{order.trackingNumber}</p>
                        </div>
                        <a
                          href={`https://novaposhta.ua/tracking/?cargo_number=${order.trackingNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#7A1F2A] hover:underline whitespace-nowrap"
                        >
                          Track
                        </a>
                      </div>
                    )}

                    <Link
                      to={`/orders/${order.id}`}
                      className="block w-full py-2.5 text-center border border-black/10 rounded hover:bg-[#F5F5F5] transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
