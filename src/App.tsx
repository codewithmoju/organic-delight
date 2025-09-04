import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useEffect, Suspense, lazy } from 'react';
import TourProvider from './components/tour/TourProvider';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getProfile } from './lib/api/auth';
import { useAuthStore } from './lib/store';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/ui/LoadingSpinner';
import PerformanceMonitor from './components/ui/PerformanceMonitor';
import SmoothLoader from './components/ui/SmoothLoader';
import { PageSkeleton } from './components/ui/SkeletonLoader';

// Lazy load components for better performance
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const MultiStepRegister = lazy(() => import('./pages/auth/MultiStepRegister'));
const EmailVerification = lazy(() => import('./pages/auth/EmailVerification'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Items = lazy(() => import('./pages/inventory/Items'));
const Categories = lazy(() => import('./pages/inventory/Categories'));
const Transactions = lazy(() => import('./pages/inventory/Transactions'));
const StockLevels = lazy(() => import('./pages/inventory/StockLevels'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));

// Enhanced loading fallback component with flicker prevention
const PageLoadingFallback = () => (
  <SmoothLoader 
    isLoading={true} 
    variant="full-screen" 
    text="Loading" 
    showLogo={true}
  />
);

// Route-specific loading fallbacks
const RouteLoadingFallback = ({ text }: { text: string }) => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <LoadingSpinner size="lg" text={text} variant="dots" />
  </div>
);

function App() {
  const { setUser, setProfile } = useAuthStore();

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const profile = await getProfile(user);
          setProfile(profile);
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      } else {
        setProfile(null);
      }
    });

    return () => unsubscribe();
  }, [setUser, setProfile]);

  return (
    <Router>
      <TourProvider>
      <PerformanceMonitor />
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          style: {
            background: 'white',
            color: '#374151',
            border: '1px solid #e5e7eb',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
          },
        }}
      />
      <Routes>
        <Route path="/login" element={
          <Suspense fallback={<PageLoadingFallback />}>
            <Login />
          </Suspense>
        } />
        <Route path="/register" element={
          <Suspense fallback={<PageLoadingFallback />}>
            <Register />
          </Suspense>
        } />
        <Route path="/register-multi" element={
          <Suspense fallback={<PageLoadingFallback />}>
            <MultiStepRegister />
          </Suspense>
        } />
        <Route path="/forgot-password" element={
          <Suspense fallback={<PageLoadingFallback />}>
            <ForgotPassword />
          </Suspense>
        } />
        <Route path="/verify-email" element={
          <Suspense fallback={<PageLoadingFallback />}>
            <EmailVerification />
          </Suspense>
        } />
        
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={
            <Suspense fallback={<RouteLoadingFallback text="Loading dashboard" />}>
              <Dashboard />
            </Suspense>
          } />
          <Route path="/inventory/categories" element={
            <Suspense fallback={<RouteLoadingFallback text="Loading categories" />}>
              <Categories />
            </Suspense>
          } />
          <Route path="/inventory/items" element={
            <Suspense fallback={<RouteLoadingFallback text="Loading items" />}>
              <Items />
            </Suspense>
          } />
          <Route path="/transactions" element={
            <Suspense fallback={<RouteLoadingFallback text="Loading transactions" />}>
              <Transactions />
            </Suspense>
          } />
          <Route path="/stock-levels" element={
            <Suspense fallback={<RouteLoadingFallback text="Loading stock levels" />}>
              <StockLevels />
            </Suspense>
          } />
          <Route path="/reports" element={
            <Suspense fallback={<RouteLoadingFallback text="Loading reports" />}>
              <Reports />
            </Suspense>
          } />
          <Route path="/settings" element={
            <Suspense fallback={<RouteLoadingFallback text="Loading settings" />}>
              <Settings />
            </Suspense>
          } />
        </Route>
      </Routes>
      </TourProvider>
    </Router>
  );
}

export default App;