import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF7ED] via-white to-[#FFF7ED] px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute -bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-accent/20 rounded-full blur-[120px] animate-pulse-slow" />
      </div>

      <div className="w-full max-w-[500px] relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 p-8 lg:p-12 rounded-[2.5rem] border border-orange-100/50 dark:border-slate-800 shadow-2xl shadow-orange-200/20 dark:shadow-none"
        >
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <Logo size="lg" />
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t('auth.login.title')}
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400 text-lg">
              {t('auth.login.subtitle')}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                {t('auth.login.email')}
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200 ${errors.email ? 'ring-error-500/20 border-error-500' : ''}`}
                  placeholder="name@company.com"
                />
              </div>
              {errors.email && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center text-sm text-error-500 mt-1 ml-1">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.email}
                </motion.div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {t('auth.login.password')}
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-bold text-primary hover:text-primary-dark transition-colors duration-200"
                >
                  {t('auth.login.forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className={`w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 pr-12 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200 ${errors.password ? 'ring-error-500/20 border-error-500' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center text-sm text-error-500 mt-1 ml-1">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.password}
                </motion.div>
              )}
            </div>

            <div className="flex items-center ml-1">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-5 w-5 rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-primary focus:ring-primary/20 transition-all cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-3 block text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer">
                {t('auth.login.rememberMe')}
              </label>
            </div>

            <div className="pt-2">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-lg font-bold shadow-lg shadow-primary/25"
              >
                {isLoading ? <LoadingSpinner size="sm" color="white" /> : t('auth.login.signIn')}
              </motion.button>
            </div>
          </form>

          <div className="mt-10 text-center">
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {t('auth.login.noAccount')}{' '}
              <Link
                to="/register-multi"
                className="font-bold text-primary hover:text-primary-dark transition-colors duration-200"
              >
                {t('auth.login.signUp')}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
