import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../store/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      await login(formData);
      toast.success('Login successful');
      setIsLoading(false);
      navigate('/profile');
    } catch {
      setErrors({ form: 'Unable to sign in. Please try again.' });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl tracking-tight inline-block mb-2">
            Solution.
          </Link>
          <h1 className="text-2xl mb-2">Welcome back</h1>
          <p className="text-[#1A1A1A]">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-lg border border-black/10 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.form && (
              <p className="text-red-600 text-sm">{errors.form}</p>
            )}
            <div>
              <label htmlFor="email" className="block mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 ${
                  errors.password ? 'ring-2 ring-red-500' : 'focus:ring-[#7A1F2A]'
                }`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-red-600 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#1A1A1A]">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#7A1F2A] hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
