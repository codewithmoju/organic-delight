import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, AlertCircle, CheckCircle, Clock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { sendPasswordResetEmail, confirmPasswordReset } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Logo from '../../components/ui/Logo';

import { useTranslation } from 'react-i18next';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'request' | 'reset' | 'success'>('request');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oobCode, setOobCode] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Check if we're in reset mode (URL contains oobCode)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('oobCode');
    if (code) {
      setOobCode(code);
      setMode('reset');
    }
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'request') {
        if (!email) {
          setError(t('auth.forgotPassword.errors.emailRequired'));
          return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
          setError(t('auth.forgotPassword.errors.validEmail'));
          return;
        }

        await sendPasswordResetEmail(auth, email);
        setMode('success');
        toast.success(t('auth.forgotPassword.success.sentTo'));
      } else if (mode === 'reset') {
        if (!newPassword) {
          setError(t('auth.forgotPassword.errors.newPasswordRequired'));
          return;
        }

        if (newPassword.length < 8) {
          setError(t('auth.forgotPassword.errors.passwordLength'));
          return;
        }

        if (newPassword !== confirmPassword) {
          setError(t('auth.forgotPassword.errors.passwordMismatch'));
          return;
        }

        await confirmPasswordReset(auth, oobCode, newPassword);
        setMode('success');
        toast.success(t('auth.forgotPassword.success.loginWithNew'));
      }
    } catch (error: any) {
      if (mode === 'request') {
        if (error.code === 'auth/user-not-found') {
          setError(t('auth.forgotPassword.errors.userNotFound'));
        } else if (error.code === 'auth/invalid-email') {
          setError(t('auth.forgotPassword.errors.validEmail'));
        } else {
          toast.error(t('auth.forgotPassword.errors.sendFailed'));
        }
      } else {
        if (error.code === 'auth/invalid-action-code') {
          setError(t('auth.forgotPassword.errors.invalidLink'));
        } else if (error.code === 'auth/expired-action-code') {
          setError(t('auth.forgotPassword.errors.expiredLink'));
        } else {
          toast.error(t('auth.forgotPassword.errors.resetFailed'));
        }
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

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="glass-effect p-8 lg:p-10 rounded-2xl border border-dark-700/50 shadow-dark-lg">
          <div className="text-center mb-8">
            <Logo size="lg" />
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 text-3xl lg:text-4xl font-bold text-white"
            >
              {mode === 'request' ? t('auth.forgotPassword.titles.request') :
                mode === 'reset' ? t('auth.forgotPassword.titles.reset') :
                  t('auth.forgotPassword.titles.success')}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-2 text-gray-400 text-lg"
            >
              {mode === 'request' ? t('auth.forgotPassword.subtitles.request') :
                mode === 'reset' ? t('auth.forgotPassword.subtitles.reset') :
                  t('auth.forgotPassword.subtitles.success')}
            </motion.p>
          </div>

          {mode === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-500/20 mb-6">
                <CheckCircle className="h-8 w-8 text-success-400" />
              </div>
              <div className="text-gray-300">
                <p className="mb-3 font-medium text-white text-xl">
                  {mode === 'success' && email ? t('auth.forgotPassword.success.checkEmail') : t('auth.forgotPassword.titles.success')}
                </p>
                {email && (
                  <>
                    <p className="mb-6 text-lg">
                      {t('auth.forgotPassword.success.sentTo')} <strong>{email}</strong>
                    </p>
                    <p className="text-sm text-gray-400 mb-4">
                      {t('auth.forgotPassword.success.checkSpam')}
                    </p>
                    <div className="flex items-center justify-center text-sm text-gray-500 mb-6">
                      <Clock className="w-4 h-4 mr-2" />
                      {t('auth.forgotPassword.success.expires')}
                    </div>
                  </>
                )}
                {!email && (
                  <p className="mb-6 text-lg">
                    {t('auth.forgotPassword.success.loginWithNew')}
                  </p>
                )}
              </div>
              <div className="mt-8">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="/login"
                    className="btn-primary inline-flex items-center justify-center px-6 py-4 text-lg font-semibold w-full sm:w-auto"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('auth.forgotPassword.success.returnLogin')}
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          ) : mode === 'request' ? (
            // Email Request Form
            <form className="space-y-8" onSubmit={handleSubmit}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label htmlFor="email" className="block text-base font-medium text-gray-300 mb-3">
                  {t('auth.forgotPassword.email')}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`w-full input-dark input-large ${error
                      ? 'ring-error-500 border-error-500'
                      : ''
                    }`}
                  placeholder={t('auth.forgotPassword.form.emailPlaceholder')}
                />
                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 flex items-center text-sm text-error-400"
                  >
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {error}
                  </motion.div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg font-semibold"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      {t('auth.forgotPassword.form.sending')}
                    </>
                  ) : (
                    t('auth.forgotPassword.form.sendButton')
                  )}
                </motion.button>
              </motion.div>
            </form>
          ) : (
            // Password Reset Form
            <form className="space-y-8" onSubmit={handleSubmit}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label htmlFor="newPassword" className="block text-base font-medium text-gray-300 mb-3">
                  {t('auth.forgotPassword.form.newPassword')}
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className={`w-full input-dark input-large pr-12 ${error ? 'ring-error-500 border-error-500' : ''
                      }`}
                    placeholder={t('auth.forgotPassword.form.newPasswordPlaceholder')}
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
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label htmlFor="confirmPassword" className="block text-base font-medium text-gray-300 mb-3">
                  {t('auth.forgotPassword.form.confirmPassword')}
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`w-full input-dark input-large ${error ? 'ring-error-500 border-error-500' : ''
                    }`}
                  placeholder={t('auth.forgotPassword.form.confirmPasswordPlaceholder')}
                />
                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 flex items-center text-sm text-error-400"
                  >
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {error}
                  </motion.div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg font-semibold"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      {t('auth.forgotPassword.form.resetting')}
                    </>
                  ) : (
                    t('auth.forgotPassword.form.resetButton')
                  )}
                </motion.button>
              </motion.div>
            </form>
          )}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-center text-base text-gray-400"
          >
            {t('auth.forgotPassword.rememberPassword')}{' '}
            <Link
              to="/login"
              className="font-semibold text-primary-400 hover:text-primary-300 transition-colors duration-200 text-lg"
            >
              {t('auth.forgotPassword.signIn')}
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}