import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { getProfile } from '../../lib/api/auth';
import { useAuthStore } from '../../lib/store';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Logo from '../../components/ui/Logo';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { setUser, setProfile } = useAuthStore();

  const from = location.state?.from?.pathname || '/';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      // Validate inputs
      if (!email) {
        setErrors(prev => ({ ...prev, email: 'Email is required' }));
        return;
      }
      if (!password) {
        setErrors(prev => ({ ...prev, password: 'Password is required' }));
        return;
      }

      const { user } = await signInWithEmailAndPassword(auth, email, password);
      setUser(user);

      try {
        const profile = await getProfile(user);
        setProfile(profile);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }

      toast.success('Successfully signed in');
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.code === 'auth/user-not-found') {
        setErrors({ email: 'No account found with this email' });
      } else if (error.code === 'auth/wrong-password') {
        setErrors({ password: 'Incorrect password' });
      } else if (error.code === 'auth/invalid-email') {
        setErrors({ email: 'Invalid email address' });
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many failed attempts. Please try again later.');
      } else {
        toast.error('Failed to sign in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-xl sm:px-10 border border-gray-100">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="flex justify-center mb-6">
              <Logo size="lg" />
            </div>
            <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
              Welcome back
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Sign in to your StockSuite account
            </p>
          </div>

          <form className="space-y-6 mt-8" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 transition-all duration-200 ${
                    errors.email 
                      ? 'ring-red-300 focus:ring-red-500' 
                      : 'ring-gray-300 focus:ring-blue-600'
                  }`}
                />
                {errors.email && (
                  <div className="mt-1 flex items-center text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.email}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Password
              </label>
              <div className="mt-2 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className={`block w-full rounded-md border-0 py-2.5 pr-10 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 transition-all duration-200 ${
                    errors.password 
                      ? 'ring-red-300 focus:ring-red-500' 
                      : 'ring-gray-300 focus:ring-blue-600'
                  }`}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
                {errors.password && (
                  <div className="mt-1 flex items-center text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.password}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm font-semibold text-blue-600 hover:text-blue-500 transition-colors duration-200"
              >
                Forgot password?
              </Link>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-2.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" color="white" />
                    <span className="ml-2">Signing in...</span>
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold leading-6 text-blue-600 hover:text-blue-500 transition-colors duration-200"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}