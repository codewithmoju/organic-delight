import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Upload, X, Shield, User, Lock, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Logo from '../../components/ui/Logo';
import { validateEmail, validatePassword, validatePhone, validateUsername } from '../../lib/utils/validation';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface RegistrationData {
  // Step 1 - Basic Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  dateOfBirth: string;

  // Step 2 - Account Security
  username: string;
  password: string;
  confirmPassword: string;
  securityQuestion: string;
  securityAnswer: string;

  // Step 3 - Additional Details
  profilePicture?: File;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What city were you born in?",
  "What was your mother's maiden name?",
  "What was the name of your first school?",
  "What is your favorite movie?",
  "What was the make of your first car?",
];

const COUNTRIES = [
  { code: '+1', name: 'United States', flag: '🇺🇸' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: '+86', name: 'China', flag: '🇨🇳' },
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+1', name: 'Canada', flag: '🇨🇦' },
  { code: '+55', name: 'Brazil', flag: '🇧🇷' },
];

export default function MultiStepRegister() {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [captchaVerified, setCaptchaVerified] = useState(false);

  const [formData, setFormData] = useState<RegistrationData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    countryCode: '+1',
    dateOfBirth: '',
    username: '',
    password: '',
    confirmPassword: '',
    securityQuestion: '',
    securityAnswer: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    acceptTerms: false,
    acceptPrivacy: false,
  });

  // Password strength calculation
  useEffect(() => {
    if (formData.password) {
      let strength = 0;
      if (formData.password.length >= 8) strength += 25;
      if (/[A-Z]/.test(formData.password)) strength += 25;
      if (/[a-z]/.test(formData.password)) strength += 25;
      if (/\d/.test(formData.password)) strength += 12.5;
      if (/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) strength += 12.5;
      setPasswordStrength(Math.min(strength, 100));
    } else {
      setPasswordStrength(0);
    }
  }, [formData.password]);

  // Username availability check
  useEffect(() => {
    const checkUsername = async () => {
      if (formData.username.length >= 3) {
        try {
          const q = query(collection(db, 'profiles'), where('username', '==', formData.username));
          const querySnapshot = await getDocs(q);
          setIsUsernameAvailable(querySnapshot.empty);
        } catch (error) {
          console.error('Error checking username:', error);
        }
      } else {
        setIsUsernameAvailable(null);
      }
    };

    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.username]);

  const updateFormData = (field: keyof RegistrationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: { [key: string]: string } = {};

    switch (step) {
      case 1:
        // Basic Information validation
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';

        const emailError = validateEmail(formData.email);
        if (emailError) newErrors.email = emailError;

        const phoneError = validatePhone(formData.phone);
        if (phoneError) newErrors.phone = phoneError;

        if (!formData.dateOfBirth) newErrors.dateOfBirth = t('auth.register.errors.dobRequired');
        else {
          const birthDate = new Date(formData.dateOfBirth);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          if (age < 13) newErrors.dateOfBirth = t('auth.register.errors.ageRequirement');
        }
        break;

      case 2:
        // Account Security validation
        const usernameError = validateUsername(formData.username);
        if (usernameError) newErrors.username = usernameError;
        else if (isUsernameAvailable === false) newErrors.username = t('auth.register.errors.usernameTaken');

        const passwordError = validatePassword(formData.password);
        if (passwordError) newErrors.password = passwordError;

        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = t('auth.register.errors.passwordMismatch');
        }

        if (!formData.securityQuestion) newErrors.securityQuestion = t('auth.register.errors.securityQuestionRequired');
        if (!formData.securityAnswer.trim()) newErrors.securityAnswer = t('auth.register.errors.securityAnswerRequired');
        break;

      case 3:
        // Additional Details validation
        if (!formData.street.trim()) newErrors.street = t('auth.register.errors.streetRequired');
        if (!formData.city.trim()) newErrors.city = t('auth.register.errors.cityRequired');
        if (!formData.state.trim()) newErrors.state = t('auth.register.errors.stateRequired');
        if (!formData.postalCode.trim()) newErrors.postalCode = t('auth.register.errors.postalCodeRequired');
        if (!formData.country.trim()) newErrors.country = t('auth.register.errors.countryRequired');
        if (!formData.acceptTerms) newErrors.acceptTerms = t('auth.register.errors.termsRequired');
        if (!formData.acceptPrivacy) newErrors.acceptPrivacy = t('auth.register.errors.privacyRequired');
        if (!captchaVerified) newErrors.captcha = t('auth.register.errors.captchaRequired');
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsLoading(true);
    try {
      // Create user account
      const { user } = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

      // Create user profile
      await setDoc(doc(db, 'profiles', user.uid), {
        id: user.uid,
        firstName: formData.firstName,
        lastName: formData.lastName,
        full_name: `${formData.firstName} ${formData.lastName}`,
        username: formData.username,
        email: formData.email,
        phone: `${formData.countryCode}${formData.phone}`,
        dateOfBirth: formData.dateOfBirth,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
        },
        securityQuestion: formData.securityQuestion,
        securityAnswer: formData.securityAnswer, // In production, hash this
        preferred_currency: 'USD',
        role: 'user',
        emailVerified: false,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Send verification email
      await sendEmailVerification(user);

      toast.success(t('auth.register.errors.registrationSuccess'));

      // Redirect to verification page or login
      window.location.href = '/login?message=verify-email';

    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setErrors({ email: t('auth.register.errors.emailExists') });
        setCurrentStep(1);
      } else {
        toast.error(t('auth.register.errors.registrationFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, profilePicture: 'File size must be less than 5MB' }));
        return;
      }
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, profilePicture: 'Please select an image file' }));
        return;
      }
      updateFormData('profilePicture', file);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return 'bg-red-500';
    if (passwordStrength < 50) return 'bg-orange-500';
    if (passwordStrength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return t('auth.register.strength.weak');
    if (passwordStrength < 50) return t('auth.register.strength.fair');
    if (passwordStrength < 75) return t('auth.register.strength.good');
    return t('auth.register.strength.strong');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF7ED] via-white to-[#FFF7ED] px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute -bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-accent/20 rounded-full blur-[120px] animate-pulse-slow" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl relative z-10 my-10"
      >
        <div className="bg-white dark:bg-slate-900 p-8 lg:p-12 rounded-[2.5rem] border border-orange-100/50 dark:border-slate-800 shadow-2xl shadow-orange-200/20 dark:shadow-none">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <Logo size="lg" />
            </div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight"
            >
              {t('auth.register.title')}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-3 text-slate-500 dark:text-slate-400 text-lg font-medium"
            >
              {t('auth.register.steps.stepIndicator', { current: currentStep, total: 3 })}
            </motion.p>
          </div>

          {/* Progress Bar */}
          <div className="mb-12 relative px-4">
            <div className="flex justify-between items-center relative z-10">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`flex items-center justify-center w-12 h-12 rounded-2xl border-2 transition-all duration-500 shadow-sm ${step <= currentStep
                    ? 'border-primary bg-primary text-white shadow-primary/30 scale-110'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400'
                    }`}
                >
                  {step < currentStep ? <Check className="w-6 h-6" /> : <span className="text-lg font-bold">{step}</span>}
                </div>
              ))}
            </div>
            <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 rounded-full overflow-hidden">
              <motion.div
                className="bg-primary h-full rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                initial={{ width: '33%' }}
                animate={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                transition={{ duration: 0.5, ease: "circOut" }}
              />
            </div>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center mb-8 bg-orange-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-orange-100 dark:border-slate-800">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('auth.register.steps.basicInfo')}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                      {t('auth.register.firstName')} *
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => updateFormData('firstName', e.target.value)}
                      className={`w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200 ${errors.firstName ? 'ring-error-500/20 border-error-500' : ''}`}
                      placeholder={t('auth.register.placeholders.firstName')}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-xs text-error-500 ml-1">{errors.firstName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                      {t('auth.register.lastName')} *
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => updateFormData('lastName', e.target.value)}
                      className={`w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200 ${errors.lastName ? 'ring-error-500/20 border-error-500' : ''}`}
                      placeholder={t('auth.register.placeholders.lastName')}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-xs text-error-500 ml-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                    {t('auth.register.email')} *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    className={`w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200 ${errors.email ? 'ring-error-500/20 border-error-500' : ''}`}
                    placeholder={t('auth.register.placeholders.email')}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-error-500 ml-1">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                    {t('auth.register.phone')} *
                  </label>
                  <div className="flex gap-3">
                    <select
                      value={formData.countryCode}
                      onChange={(e) => updateFormData('countryCode', e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-4 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all w-28 cursor-pointer"
                    >
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code} className="dark:bg-slate-900">
                          {country.flag} {country.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateFormData('phone', e.target.value)}
                      className={`flex-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200 ${errors.phone ? 'ring-error-500/20 border-error-500' : ''}`}
                      placeholder={t('auth.register.placeholders.phone')}
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-xs text-error-500 ml-1">{errors.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                    {t('auth.register.dob')} *
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                    className={`w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200 ${errors.dateOfBirth ? 'ring-error-500/20 border-error-500' : ''}`}
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-xs text-error-500 ml-1">{errors.dateOfBirth}</p>
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center mb-8 bg-orange-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-orange-100 dark:border-slate-800">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
                    <Lock className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('auth.register.steps.security')}</h3>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                    {t('auth.register.username')} *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => updateFormData('username', e.target.value)}
                      className={`w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200 pr-10 ${errors.username ? 'ring-error-500/20 border-error-500' : ''}`}
                      placeholder={t('auth.register.placeholders.username')}
                    />
                    {formData.username.length >= 3 && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {isUsernameAvailable === true && (
                          <Check className="w-5 h-5 text-success-500" />
                        )}
                        {isUsernameAvailable === false && (
                          <X className="w-5 h-5 text-error-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {errors.username && (
                    <p className="mt-1 text-xs text-error-500 ml-1">{errors.username}</p>
                  )}
                  {isUsernameAvailable === true && (
                    <p className="mt-1 text-xs text-success-600 dark:text-success-400 ml-1 font-medium">Username is available!</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                    {t('auth.register.password')} *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => updateFormData('password', e.target.value)}
                      className={`w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 pr-12 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200 ${errors.password ? 'ring-error-500/20 border-error-500' : ''}`}
                      placeholder={t('auth.register.placeholders.password')}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  {formData.password && (
                    <div className="mt-4 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('auth.register.strength.label')}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${passwordStrength < 50 ? 'bg-error-50 text-error-600' :
                          passwordStrength < 75 ? 'bg-warning-50 text-warning-600' : 'bg-success-50 text-success-600'
                          }`}>
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getPasswordStrengthColor()}`}
                          style={{ width: `${passwordStrength}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {errors.password && (
                    <p className="mt-1 text-xs text-error-500 ml-1">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                    {t('auth.register.confirmPassword')} *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                      className={`w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 pr-12 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200 ${errors.confirmPassword ? 'ring-error-500/20 border-error-500' : ''}`}
                      placeholder={t('auth.register.placeholders.confirmPassword')}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-error-500 ml-1">{errors.confirmPassword}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                    {t('auth.register.securityQuestion')} *
                  </label>
                  <select
                    value={formData.securityQuestion}
                    onChange={(e) => updateFormData('securityQuestion', e.target.value)}
                    className={`w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200 cursor-pointer ${errors.securityQuestion ? 'ring-error-500/20 border-error-500' : ''}`}
                  >
                    <option value="" className="dark:bg-slate-900">Select a security question</option>
                    {SECURITY_QUESTIONS.map((question, index) => (
                      <option key={index} value={question} className="dark:bg-slate-900">
                        {question}
                      </option>
                    ))}
                  </select>
                  {errors.securityQuestion && (
                    <p className="mt-1 text-xs text-error-500 ml-1">{errors.securityQuestion}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                    {t('auth.register.securityAnswer')} *
                  </label>
                  <input
                    type="text"
                    value={formData.securityAnswer}
                    onChange={(e) => updateFormData('securityAnswer', e.target.value)}
                    className={`w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200 ${errors.securityAnswer ? 'ring-error-500/20 border-error-500' : ''}`}
                    placeholder={t('auth.register.placeholders.securityAnswer')}
                  />
                  {errors.securityAnswer && (
                    <p className="mt-1 text-xs text-error-500 ml-1">{errors.securityAnswer}</p>
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center mb-8 bg-orange-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-orange-100 dark:border-slate-800">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('auth.register.steps.additional')}</h3>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                    {t('auth.register.profilePicture')}
                  </label>
                  <div className="flex items-center space-x-6 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700">
                      {formData.profilePicture ? (
                        <img
                          src={URL.createObjectURL(formData.profilePicture)}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    <label className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-bold text-sm text-slate-700 dark:text-slate-300">
                      <Upload className="w-4 h-4 text-primary" />
                      {t('auth.register.uploadPhoto')}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {errors.profilePicture && (
                    <p className="mt-1 text-xs text-error-500 ml-1">{errors.profilePicture}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                    {t('auth.register.address.street')} *
                  </label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => updateFormData('street', e.target.value)}
                    className={`w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200 ${errors.street ? 'ring-error-500/20 border-error-500' : ''}`}
                    placeholder={t('auth.register.placeholders.street')}
                  />
                  {errors.street && (
                    <p className="mt-1 text-xs text-error-500 ml-1">{errors.street}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                      {t('auth.register.address.city')} *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => updateFormData('city', e.target.value)}
                      className={`w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200 ${errors.city ? 'ring-error-500/20 border-error-500' : ''}`}
                      placeholder={t('auth.register.placeholders.city')}
                    />
                    {errors.city && (
                      <p className="mt-1 text-xs text-error-500 ml-1">{errors.city}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                      {t('auth.register.address.state')} *
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => updateFormData('state', e.target.value)}
                      className={`w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200 ${errors.state ? 'ring-error-500/20 border-error-500' : ''}`}
                      placeholder={t('auth.register.placeholders.state')}
                    />
                    {errors.state && (
                      <p className="mt-1 text-xs text-error-500 ml-1">{errors.state}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                      {t('auth.register.address.postalCode')} *
                    </label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => updateFormData('postalCode', e.target.value)}
                      className={`w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200 ${errors.postalCode ? 'ring-error-500/20 border-error-500' : ''}`}
                      placeholder={t('auth.register.placeholders.postalCode')}
                    />
                    {errors.postalCode && (
                      <p className="mt-1 text-xs text-error-500 ml-1">{errors.postalCode}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                      {t('auth.register.address.country')} *
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) => updateFormData('country', e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200 cursor-pointer w-full"
                    >
                      {COUNTRIES.map((country) => (
                        <option key={country.name} value={country.name} className="dark:bg-slate-900">
                          {country.flag} {country.name}
                        </option>
                      ))}
                    </select>
                    {errors.country && (
                      <p className="mt-1 text-xs text-error-500 ml-1">{errors.country}</p>
                    )}
                  </div>
                </div>

                <div className="bg-orange-50/50 dark:bg-slate-800/30 p-5 rounded-2xl border border-orange-100 dark:border-slate-800">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <label className="flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={captchaVerified}
                          onChange={(e) => setCaptchaVerified(e.target.checked)}
                          className="w-5 h-5 rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-primary focus:ring-primary/20 mr-3 transition-all cursor-pointer"
                        />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 transition-colors">{t('auth.register.terms.captcha')}</span>
                      </label>
                    </div>
                  </div>
                  {errors.captcha && (
                    <p className="mt-2 text-xs text-error-500 ml-14 font-medium">{errors.captcha}</p>
                  )}
                </div>

                <div className="space-y-4 px-1">
                  <label className="flex items-start cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.acceptTerms}
                      onChange={(e) => updateFormData('acceptTerms', e.target.checked)}
                      className="w-5 h-5 rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-primary focus:ring-primary/20 mr-3 mt-0.5 transition-all cursor-pointer"
                    />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                      {t('auth.register.terms.agree')}{' '}
                      <Link to="/terms" className="text-primary font-bold hover:text-primary-dark transition-colors">
                        {t('auth.register.terms.service')}
                      </Link>
                    </span>
                  </label>
                  {errors.acceptTerms && (
                    <p className="text-xs text-error-500 ml-8 font-medium">{errors.acceptTerms}</p>
                  )}

                  <label className="flex items-start cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.acceptPrivacy}
                      onChange={(e) => updateFormData('acceptPrivacy', e.target.checked)}
                      className="w-5 h-5 rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-primary focus:ring-primary/20 mr-3 mt-0.5 transition-all cursor-pointer"
                    />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                      {t('auth.register.terms.agree')}{' '}
                      <Link to="/privacy" className="text-primary font-bold hover:text-primary-dark transition-colors">
                        {t('auth.register.terms.privacy')}
                      </Link>
                    </span>
                  </label>
                  {errors.acceptPrivacy && (
                    <p className="text-xs text-error-500 ml-8 font-medium">{errors.acceptPrivacy}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
            {currentStep > 1 ? (
              <motion.button
                whileHover={{ x: -4 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={prevStep}
                className="btn-secondary flex items-center gap-2 px-6 py-3 font-bold"
              >
                <ArrowLeft className="w-5 h-5" />
                {t('auth.register.buttons.previous')}
              </motion.button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <motion.button
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={nextStep}
                className="btn-primary flex items-center gap-2 px-8 py-3 font-bold shadow-lg shadow-primary/20"
              >
                {t('auth.register.buttons.next')}
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="btn-primary flex items-center justify-center gap-3 px-10 py-3 font-bold shadow-lg shadow-primary/25 min-w-[180px]"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    {t('auth.register.buttons.createAccount')}
                  </>
                )}
              </motion.button>
            )}
          </div>

          {/* Login Link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 text-center text-slate-500 dark:text-slate-400 font-medium"
          >
            {t('auth.register.hasAccount')}{' '}
            <Link
              to="/login"
              className="font-bold text-primary hover:text-primary-dark transition-colors duration-200"
            >
              {t('auth.register.signIn')}
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}