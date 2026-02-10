import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, AlertCircle, CheckCircle, Clock, Eye, EyeOff, Lock } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF7ED] via-white to-[#FFF7ED] px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-200/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-100/30 rounded-full blur-[100px] animate-pulse-slow" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="bg-white p-8 lg:p-12 rounded-[2.5rem] border border-orange-100/50 shadow-2xl shadow-orange-200/20">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <Logo size="lg" />
            </div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight"
            >
              {mode === 'request' ? t('auth.forgotPassword.titles.request') :
                mode === 'reset' ? t('auth.forgotPassword.titles.reset') :
                  t('auth.forgotPassword.titles.success')}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-3 text-slate-500 text-lg font-medium"
            >
              {mode === 'request' ? t('auth.forgotPassword.subtitles.request') :
                mode === 'reset' ? t('auth.forgotPassword.subtitles.reset') :
                  t('auth.forgotPassword.subtitles.success')}
            </motion.p>
          </div>

          {mode === 'success' ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-green-50 mb-8 border border-green-100 shadow-sm shadow-green-200/50">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <div className="text-slate-600">
                <p className="mb-4 font-bold text-slate-900 text-2xl">
                  {mode === 'success' && email ? t('auth.forgotPassword.success.checkEmail') : t('auth.forgotPassword.titles.success')}
                </p>
                {email && (
                  <div className="space-y-6">
                    <p className="text-lg leading-relaxed">
                      {t('auth.forgotPassword.success.sentTo')} <span className="font-bold text-slate-900">{email}</span>
                    </p>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-left">
                      <p className="text-sm text-slate-500 mb-4 font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-400" />
                        {t('auth.forgotPassword.success.checkSpam')}
                      </p>
                      <div className="flex items-center text-sm text-slate-500 font-bold">
                        <Clock className="w-4 h-4 mr-2 text-primary" />
                        {t('auth.forgotPassword.success.expires')}
                      </div>
                    </div>
                  </div>
                )}
                {!email && (
                  <p className="mb-8 text-lg font-medium">
                    {t('auth.forgotPassword.success.loginWithNew')}
                  </p>
                )}
              </div>
              <div className="mt-10">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    to="/login"
                    className="btn-primary flex items-center justify-center px-10 py-4 text-lg font-bold w-full shadow-lg shadow-primary/20"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    {t('auth.forgotPassword.success.returnLogin')}
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          ) : mode === 'request' ? (
            <form className="space-y-8" onSubmit={handleSubmit}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-3 ml-1">
                  {t('auth.forgotPassword.email')}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={`w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 text-slate-900 placeholder:text-slate-400 font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200 ${error ? 'ring-error-500/20 border-error-500' : ''}`}
                    placeholder={t('auth.forgotPassword.form.emailPlaceholder')}
                  />
                </div>
                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 flex items-center px-1 text-sm text-error-600 font-bold"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {error}
                  </motion.div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-lg font-bold shadow-lg shadow-primary/20"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      {t('auth.forgotPassword.form.sending')}
                    </>
                  ) : (
                    <>
                      {t('auth.forgotPassword.form.sendButton')}
                      <ArrowLeft className="h-4 w-4 rotate-180" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            </form>
          ) : (
            <form className="space-y-8" onSubmit={handleSubmit}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label htmlFor="newPassword" className="block text-sm font-bold text-slate-700 mb-3 ml-1">
                  {t('auth.forgotPassword.form.newPassword')}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className={`w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-14 py-4 text-slate-900 placeholder:text-slate-400 font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200 ${error ? 'ring-error-500/20 border-error-500' : ''}`}
                    placeholder={t('auth.forgotPassword.form.newPasswordPlaceholder')}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-5 text-slate-400 hover:text-slate-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-6 w-6" />
                    ) : (
                      <Eye className="h-6 w-6" />
                    )}
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label htmlFor="confirmPassword" className="block text-sm font-bold text-slate-700 mb-3 ml-1">
                  {t('auth.forgotPassword.form.confirmPassword')}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={`w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 text-slate-900 placeholder:text-slate-400 font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200 ${error ? 'ring-error-500/20 border-error-500' : ''}`}
                    placeholder={t('auth.forgotPassword.form.confirmPasswordPlaceholder')}
                  />
                </div>
                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 flex items-center px-1 text-sm text-error-600 font-bold"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {error}
                  </motion.div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-lg font-bold shadow-lg shadow-primary/20"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      {t('auth.forgotPassword.form.resetting')}
                    </>
                  ) : (
                    <>
                      {t('auth.forgotPassword.form.resetButton')}
                      <CheckCircle className="h-5 w-5" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            </form>
          )}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-10 text-center text-slate-500 font-medium"
          >
            {t('auth.forgotPassword.rememberPassword')}{' '}
            <Link
              to="/login"
              className="font-bold text-primary hover:text-primary-dark transition-colors duration-200"
            >
              {t('auth.forgotPassword.signIn')}
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}