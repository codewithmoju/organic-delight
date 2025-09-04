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
import { useTranslation } from 'react-i18next';

export default function Login() {
  const { t } = useTranslation();
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

      if (!email) {
        setErrors(prev => ({ ...prev, email: t('auth.login.errors.emailRequired') }));
        return;
      }
      if (!password) {
        setErrors(prev => ({ ...prev, password: t('auth.login.errors.passwordRequired') }));
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
        setErrors({ email: t('auth.login.errors.userNotFound') });
      } else if (error.code === 'auth/wrong-password') {
        setErrors({ password: t('auth.login.errors.wrongPassword') });
      } else if (error.code === 'auth/invalid-credential') {
        setErrors({ email: t('auth.login.errors.invalidCredentials') });
      } else if (error.code === 'auth/invalid-email') {
        setErrors({ email: t('auth.login.errors.invalidEmail') });
      } else if (error.code === 'auth/too-many-requests') {
        toast.error(t('auth.login.errors.tooManyRequests'));
      } else {
        toast.error(t('errors.generic'));
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        <div className="glass-effect p-8 lg:p-10 rounded-2xl border border-dark-700/50 shadow-dark-lg">
          <div className="text-center mb-8">
            <Logo size="lg" />
            <h2 className="mt-6 text-3xl lg:text-4xl font-bold text-white">
              Welcome back
            </h2>
            <p className="mt-2 text-gray-400 text-lg">
              Sign in to your StockSuite account
            </p>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-base font-medium text-gray-300 mb-3">
                {t('auth.login.email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`w-full input-dark input-large ${errors.email ? 'ring-error-500 border-error-500' : ''}`}
                placeholder={t('auth.login.password')}
              />
              {errors.email && (
                <div className="mt-2 flex items-center text-sm text-error-400">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.email}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-base font-medium text-gray-300 mb-3">
                {t('auth.login.password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className={`w-full input-dark input-large pr-12 ${errors.password ? 'ring-error-500 border-error-500' : ''}`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-4"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-6 w-6 text-gray-400 hover:text-gray-200" />
                  ) : (
                    <Eye className="h-6 w-6 text-gray-400 hover:text-gray-200" />
                  )}
                </button>
              </div>
              {errors.password && (
                <div className="mt-2 flex items-center text-sm text-error-400">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.password}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-5 w-5 rounded border-dark-600 bg-dark-700 text-primary-600 focus:ring-primary-600 focus:ring-offset-dark-800"
                />
                <label htmlFor="remember-me" className="ml-3 block text-base text-gray-300">
                  Remember me
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-base font-semibold text-primary-400 hover:text-primary-300 transition-colors duration-200"
              >
                Forgot password?
              </Link>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg font-semibold"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                   Signing in...
                  </>
                ) : (
                  t('auth.login.signIn')
                )}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-base text-gray-400">
            {t('auth.login.noAccount')}{' '}
            <Link
              to="/register-multi"
              className="font-semibold text-primary-400 hover:text-primary-300 transition-colors duration-200 text-lg"
            >
              {t('auth.login.signUp')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}