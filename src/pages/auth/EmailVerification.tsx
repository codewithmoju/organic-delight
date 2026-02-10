import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, XCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { applyActionCode, sendEmailVerification } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Logo from '../../components/ui/Logo';
import { useTranslation } from 'react-i18next';

export default function EmailVerification() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [isResending, setIsResending] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);

  const oobCode = searchParams.get('oobCode');
  const mode = searchParams.get('mode');

  useEffect(() => {
    if (mode === 'verifyEmail' && oobCode) {
      verifyEmail();
    } else {
      setStatus('error');
    }
  }, [oobCode, mode]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, canResend]);

  const verifyEmail = async () => {
    try {
      await applyActionCode(auth, oobCode!);

      // Update user profile to mark email as verified
      if (auth.currentUser) {
        await updateDoc(doc(db, 'profiles', auth.currentUser.uid), {
          emailVerified: true,
          updated_at: new Date()
        });
      }

      setStatus('success');
      toast.success(t('auth.verifyEmail.toast.verified'));
    } catch (error: any) {
      console.error('Email verification error:', error);

      if (error.code === 'auth/expired-action-code') {
        setStatus('expired');
      } else if (error.code === 'auth/invalid-action-code') {
        setStatus('error');
      } else {
        setStatus('error');
      }
    }
  };

  const resendVerificationEmail = async () => {
    if (!auth.currentUser || !canResend) return;

    setIsResending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast.success(t('auth.verifyEmail.toast.sent'));
      setCanResend(false);
      setCountdown(60); // 60 second cooldown
    } catch (error: any) {
      console.error('Resend verification error:', error);
      toast.error(t('auth.verifyEmail.toast.failed'));
    } finally {
      setIsResending(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <LoadingSpinner size="lg" color="primary" />;
      case 'success':
        return <CheckCircle className="h-16 w-16 text-success-400" />;
      case 'error':
      case 'expired':
        return <XCircle className="h-16 w-16 text-error-400" />;
      default:
        return <Mail className="h-16 w-16 text-primary-400" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return t('auth.verifyEmail.verifying');
      case 'success':
        return t('auth.verifyEmail.verified');
      case 'expired':
        return t('auth.verifyEmail.expired');
      case 'error':
        return t('auth.verifyEmail.failed');
      default:
        return t('auth.verifyEmail.title');
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'loading':
        return t('auth.verifyEmail.messages.loading');
      case 'success':
        return t('auth.verifyEmail.messages.success');
      case 'expired':
        return t('auth.verifyEmail.messages.expired');
      case 'error':
        return t('auth.verifyEmail.messages.error');
      default:
        return '';
    }
  };

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
          <div className="text-center">
            <Logo size="lg" />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8 mb-6"
            >
              {getStatusIcon()}
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl lg:text-4xl font-bold text-white mb-4"
            >
              {getStatusTitle()}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-400 text-lg mb-8"
            >
              {getStatusMessage()}
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              {status === 'success' && (
                <Link
                  to="/login"
                  className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg font-semibold"
                >
                  {t('auth.verifyEmail.buttons.continueLogin')}
                </Link>
              )}

              {(status === 'expired' || status === 'error') && auth.currentUser && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={resendVerificationEmail}
                  disabled={isResending || !canResend}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg font-semibold"
                >
                  {isResending ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      {t('auth.verifyEmail.buttons.sending')}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      {canResend ? t('auth.verifyEmail.buttons.resend') : t('auth.verifyEmail.buttons.resendIn', { seconds: countdown })}
                    </>
                  )}
                </motion.button>
              )}

              <Link
                to="/login"
                className="btn-secondary w-full flex items-center justify-center gap-2 py-4 text-lg font-semibold"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('auth.verifyEmail.buttons.backLogin')}
              </Link>
            </motion.div>

            {/* Help Text */}
            {(status === 'expired' || status === 'error') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-8 p-4 bg-dark-800/50 rounded-xl border border-dark-700/50"
              >
                <h4 className="text-white font-semibold mb-2">{t('auth.verifyEmail.help.title')}</h4>
                <p className="text-gray-400 text-sm">
                  {t('auth.verifyEmail.help.text')}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}