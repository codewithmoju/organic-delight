import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Upload, X, Shield, Mail, User, Lock, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Logo from '../../components/ui/Logo';
import { validateEmail, validatePassword, validateRequired, validatePhone, validateUsername } from '../../lib/utils/validation';
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

        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
        else {
          const birthDate = new Date(formData.dateOfBirth);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          if (age < 13) newErrors.dateOfBirth = 'You must be at least 13 years old';
        }
        break;

      case 2:
        // Account Security validation
        const usernameError = validateUsername(formData.username);
        if (usernameError) newErrors.username = usernameError;
        else if (isUsernameAvailable === false) newErrors.username = 'Username is already taken';

        const passwordError = validatePassword(formData.password);
        if (passwordError) newErrors.password = passwordError;

        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }

        if (!formData.securityQuestion) newErrors.securityQuestion = 'Please select a security question';
        if (!formData.securityAnswer.trim()) newErrors.securityAnswer = 'Security answer is required';
        break;

      case 3:
        // Additional Details validation
        if (!formData.street.trim()) newErrors.street = 'Street address is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.state.trim()) newErrors.state = 'State/Province is required';
        if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
        if (!formData.country.trim()) newErrors.country = 'Country is required';
        if (!formData.acceptTerms) newErrors.acceptTerms = 'You must accept the terms of service';
        if (!formData.acceptPrivacy) newErrors.acceptPrivacy = 'You must accept the privacy policy';
        if (!captchaVerified) newErrors.captcha = 'Please complete the CAPTCHA verification';
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

      toast.success('Registration successful! Please check your email to verify your account.');

      // Redirect to verification page or login
      window.location.href = '/login?message=verify-email';

    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setErrors({ email: 'An account with this email already exists' });
        setCurrentStep(1);
      } else {
        toast.error('Registration failed. Please try again.');
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
        className="w-full max-w-2xl relative z-10"
      >
        <div className="glass-effect p-8 lg:p-10 rounded-2xl border border-dark-700/50 shadow-dark-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <Logo size="lg" />
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 text-3xl lg:text-4xl font-bold text-white"
            >
              {t('auth.register.title')}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-2 text-gray-400 text-lg"
            >
              {t('auth.register.steps.stepIndicator', { current: currentStep, total: 3 })}
            </motion.p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${step <= currentStep
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : 'border-gray-600 text-gray-400'
                    }`}
                >
                  {step < currentStep ? <Check className="w-5 h-5" /> : step}
                </div>
              ))}
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full"
                initial={{ width: '33%' }}
                animate={{ width: `${(currentStep / 3) * 100}%` }}
                transition={{ duration: 0.3 }}
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
                <div className="flex items-center mb-6">
                  <User className="w-6 h-6 text-primary-400 mr-3" />
                  <h3 className="text-xl font-semibold text-white">{t('auth.register.steps.basicInfo')}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-base font-medium text-gray-300 mb-3">
                      {t('auth.register.firstName')} *
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => updateFormData('firstName', e.target.value)}
                      className={`w-full input-dark input-large ${errors.firstName ? 'ring-error-500 border-error-500' : ''}`}
                      placeholder={t('auth.register.placeholders.firstName')}
                    />
                    {errors.firstName && (
                      <p className="mt-2 text-sm text-error-400">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-base font-medium text-gray-300 mb-3">
                      {t('auth.register.lastName')} *
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => updateFormData('lastName', e.target.value)}
                      className={`w-full input-dark input-large ${errors.lastName ? 'ring-error-500 border-error-500' : ''}`}
                      placeholder={t('auth.register.placeholders.lastName')}
                    />
                    {errors.lastName && (
                      <p className="mt-2 text-sm text-error-400">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-300 mb-3">
                    {t('auth.register.email')} *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    className={`w-full input-dark input-large ${errors.email ? 'ring-error-500 border-error-500' : ''}`}
                    placeholder={t('auth.register.placeholders.email')}
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-error-400">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-300 mb-3">
                    {t('auth.register.phone')} *
                  </label>
                  <div className="flex gap-3">
                    <select
                      value={formData.countryCode}
                      onChange={(e) => updateFormData('countryCode', e.target.value)}
                      className="input-dark input-large w-32"
                    >
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateFormData('phone', e.target.value)}
                      className={`flex-1 input-dark input-large ${errors.phone ? 'ring-error-500 border-error-500' : ''}`}
                      placeholder={t('auth.register.placeholders.phone')}
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-2 text-sm text-error-400">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-300 mb-3">
                    {t('auth.register.dob')} *
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                    className={`w-full input-dark input-large ${errors.dateOfBirth ? 'ring-error-500 border-error-500' : ''}`}
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-2 text-sm text-error-400">{errors.dateOfBirth}</p>
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
                <div className="flex items-center mb-6">
                  <Lock className="w-6 h-6 text-primary-400 mr-3" />
                  <h3 className="text-xl font-semibold text-white">{t('auth.register.steps.security')}</h3>
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-300 mb-3">
                    {t('auth.register.username')} *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => updateFormData('username', e.target.value)}
                      className={`w-full input-dark input-large pr-10 ${errors.username ? 'ring-error-500 border-error-500' : ''}`}
                      placeholder={t('auth.register.placeholders.username')}
                    />
                    {formData.username.length >= 3 && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {isUsernameAvailable === true && (
                          <Check className="w-5 h-5 text-green-500" />
                        )}
                        {isUsernameAvailable === false && (
                          <X className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {errors.username && (
                    <p className="mt-2 text-sm text-error-400">{errors.username}</p>
                  )}
                  {isUsernameAvailable === true && (
                    <p className="mt-2 text-sm text-green-400">Username is available!</p>
                  )}
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-300 mb-3">
                    {t('auth.register.password')} *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => updateFormData('password', e.target.value)}
                      className={`w-full input-dark input-large pr-12 ${errors.password ? 'ring-error-500 border-error-500' : ''}`}
                      placeholder={t('auth.register.placeholders.password')}
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

                  {formData.password && (
                    <div className="mt-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-400">{t('auth.register.strength.label')}</span>
                        <span className={`text-sm font-medium ${passwordStrength < 50 ? 'text-red-400' :
                          passwordStrength < 75 ? 'text-yellow-400' : 'text-green-400'
                          }`}>
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                          style={{ width: `${passwordStrength}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {errors.password && (
                    <p className="mt-2 text-sm text-error-400">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-300 mb-3">
                    {t('auth.register.confirmPassword')} *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                      className={`w-full input-dark input-large pr-12 ${errors.confirmPassword ? 'ring-error-500 border-error-500' : ''}`}
                      placeholder={t('auth.register.placeholders.confirmPassword')}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-4"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-6 w-6 text-gray-400 hover:text-gray-200" />
                      ) : (
                        <Eye className="h-6 w-6 text-gray-400 hover:text-gray-200" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-error-400">{errors.confirmPassword}</p>
                  )}
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-300 mb-3">
                    {t('auth.register.securityQuestion')} *
                  </label>
                  <select
                    value={formData.securityQuestion}
                    onChange={(e) => updateFormData('securityQuestion', e.target.value)}
                    className={`w-full input-dark input-large ${errors.securityQuestion ? 'ring-error-500 border-error-500' : ''}`}
                  >
                    <option value="">Select a security question</option>
                    {SECURITY_QUESTIONS.map((question, index) => (
                      <option key={index} value={question}>
                        {question}
                      </option>
                    ))}
                  </select>
                  {errors.securityQuestion && (
                    <p className="mt-2 text-sm text-error-400">{errors.securityQuestion}</p>
                  )}
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-300 mb-3">
                    {t('auth.register.securityAnswer')} *
                  </label>
                  <input
                    type="text"
                    value={formData.securityAnswer}
                    onChange={(e) => updateFormData('securityAnswer', e.target.value)}
                    className={`w-full input-dark input-large ${errors.securityAnswer ? 'ring-error-500 border-error-500' : ''}`}
                    placeholder={t('auth.register.placeholders.securityAnswer')}
                  />
                  {errors.securityAnswer && (
                    <p className="mt-2 text-sm text-error-400">{errors.securityAnswer}</p>
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
                <div className="flex items-center mb-6">
                  <MapPin className="w-6 h-6 text-primary-400 mr-3" />
                  <h3 className="text-xl font-semibold text-white">{t('auth.register.steps.additional')}</h3>
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-300 mb-3">
                    {t('auth.register.profilePicture')}
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 rounded-full bg-dark-700 flex items-center justify-center overflow-hidden">
                      {formData.profilePicture ? (
                        <img
                          src={URL.createObjectURL(formData.profilePicture)}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <label className="btn-secondary cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
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
                    <p className="mt-2 text-sm text-error-400">{errors.profilePicture}</p>
                  )}
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-300 mb-3">
                    {t('auth.register.address.street')} *
                  </label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => updateFormData('street', e.target.value)}
                    className={`w-full input-dark input-large ${errors.street ? 'ring-error-500 border-error-500' : ''}`}
                    placeholder={t('auth.register.placeholders.street')}
                  />
                  {errors.street && (
                    <p className="mt-2 text-sm text-error-400">{errors.street}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-base font-medium text-gray-300 mb-3">
                      {t('auth.register.address.city')} *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => updateFormData('city', e.target.value)}
                      className={`w-full input-dark input-large ${errors.city ? 'ring-error-500 border-error-500' : ''}`}
                      placeholder={t('auth.register.placeholders.city')}
                    />
                    {errors.city && (
                      <p className="mt-2 text-sm text-error-400">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-base font-medium text-gray-300 mb-3">
                      {t('auth.register.address.state')} *
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => updateFormData('state', e.target.value)}
                      className={`w-full input-dark input-large ${errors.state ? 'ring-error-500 border-error-500' : ''}`}
                      placeholder={t('auth.register.placeholders.state')}
                    />
                    {errors.state && (
                      <p className="mt-2 text-sm text-error-400">{errors.state}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-base font-medium text-gray-300 mb-3">
                      {t('auth.register.address.postalCode')} *
                    </label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => updateFormData('postalCode', e.target.value)}
                      className={`w-full input-dark input-large ${errors.postalCode ? 'ring-error-500 border-error-500' : ''}`}
                      placeholder={t('auth.register.placeholders.postalCode')}
                    />
                    {errors.postalCode && (
                      <p className="mt-2 text-sm text-error-400">{errors.postalCode}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-base font-medium text-gray-300 mb-3">
                      {t('auth.register.address.country')} *
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) => updateFormData('country', e.target.value)}
                      className={`w-full input-dark input-large ${errors.country ? 'ring-error-500 border-error-500' : ''}`}
                    >
                      {COUNTRIES.map((country) => (
                        <option key={country.name} value={country.name}>
                          {country.flag} {country.name}
                        </option>
                      ))}
                    </select>
                    {errors.country && (
                      <p className="mt-2 text-sm text-error-400">{errors.country}</p>
                    )}
                  </div>
                </div>

                {/* Simple CAPTCHA */}
                <div className="bg-dark-800/50 p-4 rounded-xl border border-dark-700/50">
                  <div className="flex items-center space-x-4">
                    <Shield className="w-6 h-6 text-primary-400" />
                    <div className="flex-1">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={captchaVerified}
                          onChange={(e) => setCaptchaVerified(e.target.checked)}
                          className="w-5 h-5 rounded border-dark-600 bg-dark-700 text-primary-600 focus:ring-primary-600 focus:ring-offset-dark-800 mr-3"
                        />
                        <span className="text-gray-300">{t('auth.register.terms.captcha')}</span>
                      </label>
                    </div>
                  </div>
                  {errors.captcha && (
                    <p className="mt-2 text-sm text-error-400">{errors.captcha}</p>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={formData.acceptTerms}
                      onChange={(e) => updateFormData('acceptTerms', e.target.checked)}
                      className="w-5 h-5 rounded border-dark-600 bg-dark-700 text-primary-600 focus:ring-primary-600 focus:ring-offset-dark-800 mr-3 mt-0.5"
                    />
                    <span className="text-gray-300">
                      {t('auth.register.terms.agree')}{' '}
                      <Link to="/terms" className="text-primary-400 hover:text-primary-300">
                        {t('auth.register.terms.service')}
                      </Link>
                    </span>
                  </label>
                  {errors.acceptTerms && (
                    <p className="text-sm text-error-400">{errors.acceptTerms}</p>
                  )}

                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={formData.acceptPrivacy}
                      onChange={(e) => updateFormData('acceptPrivacy', e.target.checked)}
                      className="w-5 h-5 rounded border-dark-600 bg-dark-700 text-primary-600 focus:ring-primary-600 focus:ring-offset-dark-800 mr-3 mt-0.5"
                    />
                    <span className="text-gray-300">
                      {t('auth.register.terms.agree')}{' '}
                      <Link to="/privacy" className="text-primary-400 hover:text-primary-300">
                        {t('auth.register.terms.privacy')}
                      </Link>
                    </span>
                  </label>
                  {errors.acceptPrivacy && (
                    <p className="text-sm text-error-400">{errors.acceptPrivacy}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-dark-700/50">

            {currentStep > 1 ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={prevStep}
                className="btn-secondary flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                {t('auth.register.buttons.previous')}
              </motion.button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={nextStep}
                className="btn-primary flex items-center gap-2"
              >
                {t('auth.register.buttons.next')}
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="btn-primary flex items-center gap-2 min-w-[140px]"
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
            transition={{ delay: 0.9 }}
            className="mt-8 text-center text-base text-gray-400"
          >
            {t('auth.register.hasAccount')}{' '}
            <Link
              to="/login"
              className="font-semibold text-primary-400 hover:text-primary-300 transition-colors duration-200 text-lg"
            >
              {t('auth.register.signIn')}
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}