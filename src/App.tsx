import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useEffect, Suspense, lazy } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import TourProvider from './components/tour/TourProvider';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getProfile } from './lib/api/auth';
import { useAuthStore } from './lib/store';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/ui/LoadingSpinner';
import OfflineIndicator from './components/ui/OfflineIndicator';

// Lazy load components for better performance
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const MultiStepRegister = lazy(() => import('./pages/auth/MultiStepRegister'));
const EmailVerification = lazy(() => import('./pages/auth/EmailVerification'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const POS = lazy(() => import('./pages/POS'));
const Items = lazy(() => import('./pages/inventory/Items'));
const Alerts = lazy(() => import('./pages/inventory/Alerts'));
const Categories = lazy(() => import('./pages/inventory/Categories'));
const Transactions = lazy(() => import('./pages/inventory/Transactions'));
const Vendors = lazy(() => import('./pages/vendors/Vendors'));
const Customers = lazy(() => import('./pages/customers/Customers'));
const Expenses = lazy(() => import('./pages/expenses/Expenses'));
const Settings = lazy(() => import('./pages/Settings'));
const ValuationPage = lazy(() => import('./pages/inventory/ValuationPage'));
const PerformancePage = lazy(() => import('./pages/reports/PerformancePage'));
const NewPurchase = lazy(() => import('./pages/purchases/NewPurchase'));

const VendorLedgerPage = lazy(() => import('./pages/vendors/VendorLedgerPage'));
const CustomerLedger = lazy(() => import('./pages/customers/CustomerLedger'));

// Simple loading fallback
const LoadingFallback = ({ text }: { text: string }) => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <LoadingSpinner size="lg" text={text} />
  </div>
);

function App() {
  const { setUser, setProfile, setInitialized } = useAuthStore();

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
      // Mark auth as initialized after first check
      setInitialized(true);
    });

    return () => unsubscribe();
  }, [setUser, setProfile, setInitialized]);

  return (
    <ThemeProvider defaultTheme="light">
      <Router>
        <TourProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgb(var(--card))',
                color: 'rgb(var(--foreground))',
                border: '1px solid rgb(var(--border))',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
              },
            }}
          />
          <OfflineIndicator />
          <Routes>
            <Route path="/login" element={
              <Suspense fallback={<LoadingFallback text="Loading login" />}>
                <Login />
              </Suspense>
            } />
            <Route path="/register" element={
              <Suspense fallback={<LoadingFallback text="Loading register" />}>
                <Register />
              </Suspense>
            } />
            <Route path="/register-multi" element={
              <Suspense fallback={<LoadingFallback text="Loading register" />}>
                <MultiStepRegister />
              </Suspense>
            } />
            <Route path="/forgot-password" element={
              <Suspense fallback={<LoadingFallback text="Loading password reset" />}>
                <ForgotPassword />
              </Suspense>
            } />
            <Route path="/verify-email" element={
              <Suspense fallback={<LoadingFallback text="Loading verification" />}>
                <EmailVerification />
              </Suspense>
            } />

            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={
                <Suspense fallback={<LoadingFallback text="Loading dashboard" />}>
                  <Dashboard />
                </Suspense>
              } />
              <Route path="/pos" element={
                <Suspense fallback={<LoadingFallback text="Loading POS system" />}>
                  <POS />
                </Suspense>
              } />
              <Route path="/inventory/categories" element={
                <Suspense fallback={<LoadingFallback text="Loading categories" />}>
                  <Categories />
                </Suspense>
              } />
              <Route path="/inventory/items" element={
                <Suspense fallback={<LoadingFallback text="Loading items" />}>
                  <Items />
                </Suspense>
              } />
              <Route path="/inventory/alerts" element={
                <Suspense fallback={<LoadingFallback text="Loading alerts" />}>
                  <Alerts />
                </Suspense>
              } />
              <Route path="/vendors" element={
                <Suspense fallback={<LoadingFallback text="Loading vendors" />}>
                  <Vendors />
                </Suspense>
              } />
              <Route path="/vendors/:id/ledger" element={
                <Suspense fallback={<LoadingFallback text="Loading ledger" />}>
                  <VendorLedgerPage />
                </Suspense>
              } />
              <Route path="/purchases/new" element={
                <Suspense fallback={<LoadingFallback text="Loading new purchase" />}>
                  <NewPurchase />
                </Suspense>
              } />
              <Route path="/customers" element={
                <Suspense fallback={<LoadingFallback text="Loading customers" />}>
                  <Customers />
                </Suspense>
              } />
              <Route path="/customers/:id/ledger" element={
                <Suspense fallback={<LoadingFallback text="Loading customer ledger" />}>
                  <CustomerLedger />
                </Suspense>
              } />
              <Route path="/expenses" element={
                <Suspense fallback={<LoadingFallback text="Loading expenses" />}>
                  <Expenses />
                </Suspense>
              } />
              <Route path="/transactions" element={
                <Suspense fallback={<LoadingFallback text="Loading transactions" />}>
                  <Transactions />
                </Suspense>
              } />
              <Route path="/reports/performance" element={
                <Suspense fallback={<LoadingFallback text="Loading performance analytics" />}>
                  <PerformancePage />
                </Suspense>
              } />
              <Route path="/inventory/valuation" element={
                <Suspense fallback={<LoadingFallback text="Calculating valuation" />}>
                  <ValuationPage />
                </Suspense>
              } />
              <Route path="/settings" element={
                <Suspense fallback={<LoadingFallback text="Loading settings" />}>
                  <Settings />
                </Suspense>
              } />
            </Route>
          </Routes>
        </TourProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;