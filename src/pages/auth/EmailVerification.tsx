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
          <div className="text-center">
            <Logo size="lg" />

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-10 mb-8 flex justify-center"
            >
              <div className={`p-6 rounded-[2rem] ${status === 'success' ? 'bg-green-50 border border-green-100 shadow-sm shadow-green-200/50' :
                  status === 'loading' ? 'bg-orange-50 border border-orange-100 shadow-sm shadow-orange-200/50' :
                    'bg-red-50 border border-red-100 shadow-sm shadow-red-200/50'
                }`}>
                {getStatusIcon()}
              </div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-4"
            >
              {getStatusTitle()}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-slate-500 text-lg font-medium mb-10 leading-relaxed"
            >
              {getStatusMessage()}
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              {status === 'success' && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to="/login"
                    className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-lg font-bold shadow-lg shadow-primary/20"
                  >
                    {t('auth.verifyEmail.buttons.continueLogin')}
                  </Link>
                </motion.div>
              )}

              {(status === 'expired' || status === 'error') && auth.currentUser && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <button
                    onClick={resendVerificationEmail}
                    disabled={isResending || !canResend}
                    className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-lg font-bold shadow-lg shadow-primary/20"
                  >
                    {isResending ? (
                      <>
                        <LoadingSpinner size="sm" color="white" />
                        {t('auth.verifyEmail.buttons.sending')}
                      </>
                    ) : (
                      <>
                        <RefreshCw className={`h-5 w-5 ${!canResend ? 'animate-spin-slow' : ''}`} />
                        {canResend ? t('auth.verifyEmail.buttons.resend') : t('auth.verifyEmail.buttons.resendIn', { seconds: countdown })}
                      </>
                    )}
                  </button>
                </motion.div>
              )}

              <motion.div whileHover={{ x: -4 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/login"
                  className="btn-secondary w-full flex items-center justify-center gap-3 py-4 text-lg font-bold"
                >
                  <ArrowLeft className="h-5 w-5" />
                  {t('auth.verifyEmail.buttons.backLogin')}
                </Link>
              </motion.div>
            </motion.div>

            {/* Help Text */}
            {(status === 'expired' || status === 'error') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-10 p-6 bg-slate-50 rounded-2xl border border-slate-100 text-left"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="text-slate-900 font-bold">{t('auth.verifyEmail.help.title')}</h4>
                </div>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
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