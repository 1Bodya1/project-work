import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../components/ui/input-otp';
import { useAuth } from '../store/AuthContext';
import { isAdminUser } from '../lib/auth';
import type { OtpChallenge } from '../services/authService';

export default function Register() {
  const navigate = useNavigate();
  const { register, verifyRegisterOtp } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [otp, setOtp] = useState('');
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field] && !current.form) return current;

      const nextErrors = { ...current };
      delete nextErrors[field];
      delete nextErrors.form;
      return nextErrors;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    const newErrors: Record<string, string> = {};
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      const result = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
      });

      if ('otpRequired' in result) {
        setChallenge(result);
        setOtp('');
        toast.info('Enter the verification code sent to your email');
        setIsLoading(false);
        return;
      }

      const user = result;
      toast.success('Account created successfully');
      setIsLoading(false);
      navigate(isAdminUser(user) ? '/admin' : '/profile');
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : 'Unable to create account. Please try again.' });
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (otp.length !== 6) {
      setErrors({ otp: 'Enter the 6-digit verification code' });
      return;
    }

    setIsLoading(true);

    try {
      const user = await verifyRegisterOtp({
        challengeId: challenge?.challengeId,
        email: challenge?.email || formData.email,
        otp,
      });
      toast.success('Account verified');
      setIsLoading(false);
      navigate(isAdminUser(user) ? '/admin' : '/profile');
    } catch (error) {
      setErrors({ otp: error instanceof Error ? error.message : 'Unable to verify code. Please try again.' });
      setIsLoading(false);
    }
  };

  const resetChallenge = () => {
    setChallenge(null);
    setOtp('');
    setErrors({});
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-start sm:items-center justify-center bg-[#F5F5F5] px-4 py-8 sm:py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl tracking-tight inline-block mb-2">
            Solution.
          </Link>
          <h1 className="text-2xl mb-2">{challenge ? 'Verify account' : 'Create account'}</h1>
          <p className="text-[#1A1A1A]">
            {challenge ? 'Enter the code sent during signup' : 'Start creating your custom designs'}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-black/10 p-6 sm:p-8">
          {challenge ? (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div className="flex items-center gap-3 rounded border border-black/10 bg-[#F5F5F5] p-4">
                <ShieldCheck className="h-5 w-5 text-[#7A1F2A]" />
                <p className="text-sm text-[#1A1A1A]">
                  Verifying {challenge.email || formData.email}
                </p>
              </div>
              {errors.otp && (
                <p className="text-red-600 text-sm">{errors.otp}</p>
              )}
              <div>
                <label htmlFor="otp" className="block mb-3">
                  Verification code
                </label>
                <InputOTP
                  id="otp"
                  maxLength={6}
                  value={otp}
                  onChange={(value) => setOtp(value.replace(/\D/g, ''))}
                  containerClassName="justify-center"
                >
                  <InputOTPGroup>
                    {Array.from({ length: 6 }).map((_, index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className="h-11 w-10 sm:h-12 sm:w-11 bg-[#F5F5F5] text-base"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying...' : 'Verify account'}
              </button>
              <button
                type="button"
                onClick={resetChallenge}
                className="w-full py-3 border border-black/10 rounded hover:bg-[#F5F5F5] transition-colors"
              >
                Back to signup
              </button>
              <p className="text-center text-xs text-[#1A1A1A]">
                Mock mode accepts code 123456.
              </p>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {errors.form && (
                  <p className="text-red-600 text-sm">{errors.form}</p>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="block mb-2">
                      First Name
                    </label>
                    <input
                      id="firstName"
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
                  <label htmlFor="lastName" className="block mb-2">
                    Last Name
                  </label>
                  <input
                    id="lastName"
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
              </div>

              <div>
                <label htmlFor="phone" className="block mb-2">
                  Phone Number
                </label>
                <input
                  id="phone"
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
                <label htmlFor="email" className="block mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className={`w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 ${
                    errors.email ? 'ring-2 ring-red-500' : 'focus:ring-[#7A1F2A]'
                  }`}
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className={`w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 ${
                    errors.password ? 'ring-2 ring-red-500' : 'focus:ring-[#7A1F2A]'
                  }`}
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="text-red-600 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  className={`w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 ${
                    errors.confirmPassword ? 'ring-2 ring-red-500' : 'focus:ring-[#7A1F2A]'
                  }`}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[#1A1A1A]">
                Already have an account?{' '}
                <Link to="/login" className="text-[#7A1F2A] hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
            </>
          )}
          </div>
      </div>
    </div>
  );
}
