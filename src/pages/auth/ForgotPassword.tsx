import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Logo from '../../components/ui/Logo';

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      
      setIsEmailSent(true);
      toast.success('Password reset instructions sent to your email');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email address');
      } else if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address');
      } else {
        toast.error('Failed to send reset email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-xl sm:px-10 border border-gray-100">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="flex justify-center mb-6">
              <Logo size="lg" />
            </div>
            <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
              Reset your password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your email to receive reset instructions
            </p>
          </div>

          {isEmailSent ? (
            <div className="mt-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-sm text-gray-700">
                <p className="mb-2 font-medium text-gray-900">
                  Check your email
                </p>
                <p className="mb-4">
                  We've sent password reset instructions to <strong>{email}</strong>
                </p>
                <p className="text-xs text-gray-500">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
              </div>
              <div className="mt-6">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold leading-6 text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all duration-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Return to login
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6 mt-8" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                  Email address
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={`block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 transition-all duration-200 ${
                      error 
                        ? 'ring-red-300 focus:ring-red-500' 
                        : 'ring-gray-300 focus:ring-blue-600'
                    }`}
                  />
                  {error && (
                    <div className="mt-1 flex items-center text-sm text-red-600">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {error}
                    </div>
                  )}
                </div>
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
                      <span className="ml-2">Sending...</span>
                    </div>
                  ) : (
                    'Send reset instructions'
                  )}
                </button>
              </div>
            </form>
          )}

          <p className="mt-10 text-center text-sm text-gray-500">
            Remember your password?{' '}
            <Link
              to="/login"
              className="font-semibold leading-6 text-blue-600 hover:text-blue-500 transition-colors duration-200"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}