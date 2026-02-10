import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { signUp } from '../../lib/api/auth';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Logo from '../../components/ui/Logo';

import { useTranslation } from 'react-i18next';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const passwordRequirements = [
    { label: 'At least 8 characters', test: (pwd: string) => pwd.length >= 8 },
    { label: 'Contains uppercase letter', test: (pwd: string) => /[A-Z]/.test(pwd) },
    { label: 'Contains lowercase letter', test: (pwd: string) => /[a-z]/.test(pwd) },
    { label: 'Contains number', test: (pwd: string) => /\d/.test(pwd) },
    { label: 'Contains special character', test: (pwd: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) },
  ];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const fullName = formData.get('fullName') as string;

    // Validate inputs
    const newErrors: typeof errors = {};

    if (!fullName.trim()) {
      newErrors.fullName = t('auth.register.errors.fullNameRequired');
    }

    if (!email) {
      newErrors.email = t('auth.register.errors.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('auth.register.errors.invalidEmail');
    }

    if (!password) {
      newErrors.password = t('auth.register.errors.passwordRequired');
    } else if (!passwordRequirements.every(req => req.test(password))) {
      newErrors.password = t('auth.register.errors.passwordRequirements');
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = t('auth.register.errors.passwordMismatch');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      await signUp(email, password, fullName);

      toast.success(t('auth.register.errors.registrationSuccess'));
      navigate('/login');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setErrors({ email: t('auth.register.errors.emailExists') });
      } else if (error.code === 'auth/weak-password') {
        setErrors({ password: t('auth.register.errors.weakPassword') });
      } else {
        toast.error(t('auth.register.errors.registrationFailed'));
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[550px] relative z-10"
      >
        <div className="bg-white dark:bg-slate-900 p-8 lg:p-12 rounded-[2.5rem] border border-orange-100/50 dark:border-slate-800 shadow-2xl shadow-orange-200/20 dark:shadow-none">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <Logo size="lg" />
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t('auth.register.title')}
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400 text-lg">
              {t('auth.register.subtitle')}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                {t('auth.register.fullName')}
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                className={`w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200 ${errors.fullName ? 'ring-error-500/20 border-error-500' : ''}`}
                placeholder={t('auth.register.fullName')}
              />
              {errors.fullName && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center text-sm text-error-500 mt-1 ml-1">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.fullName}
                </motion.div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                {t('auth.register.email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200 ${errors.email ? 'ring-error-500/20 border-error-500' : ''}`}
                placeholder={t('auth.register.placeholders.email')}
              />
              {errors.email && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center text-sm text-error-500 mt-1 ml-1">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.email}
                </motion.div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                {t('auth.register.password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 pr-12 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200 ${errors.password ? 'ring-error-500/20 border-error-500' : ''}`}
                  placeholder={t('auth.register.placeholders.password')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {password && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 ml-1">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center text-xs">
                      <div className={`p-0.5 rounded-full mr-2 ${req.test(password) ? 'bg-success-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                        <Check className={`h-3 w-3 ${req.test(password) ? 'text-white' : 'text-transparent'}`} />
                      </div>
                      <span className={req.test(password) ? 'text-success-600 dark:text-success-400 font-medium' : 'text-slate-400 dark:text-slate-500'}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}

              {errors.password && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center text-sm text-error-500 mt-1 ml-1">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.password}
                </motion.div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                {t('auth.register.confirmPassword')}
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className={`w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 pr-12 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200 ${errors.confirmPassword ? 'ring-error-500/20 border-error-500' : ''}`}
                  placeholder={t('auth.register.placeholders.confirmPassword')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center text-sm text-error-500 mt-1 ml-1">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.confirmPassword}
                </motion.div>
              )}
            </div>

            <div className="pt-4">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-lg font-bold shadow-lg shadow-primary/25"
              >
                {isLoading ? (
                  <><LoadingSpinner size="sm" color="white" />{t('auth.register.creating')}</>
                ) : (
                  t('auth.register.createAccount')
                )}
              </motion.button>
            </div>
          </form>

          <div className="mt-10 text-center">
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {t('auth.register.hasAccount')}{' '}
              <Link
                to="/login"
                className="font-bold text-primary hover:text-primary-dark transition-colors duration-200"
              >
                {t('auth.register.signIn')}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
