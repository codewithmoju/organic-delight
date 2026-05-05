import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useEffect, Suspense, lazy, useRef } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import TourProvider from './components/tour/TourProvider';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getProfile } from './lib/api/auth';
import { useAuthStore, clearSessionCaches } from './lib/store';
import { resolveActiveOrganization } from './lib/auth/orgResolver';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AppLoader from './components/ui/AppLoader';
import type { Permission } from './lib/types/org';
import OfflineIndicator from './components/ui/OfflineIndicator';

// Lazy load components for better performance
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const MultiStepRegister = lazy(() => import('./pages/auth/MultiStepRegister'));
const EmailVerification = lazy(() => import('./pages/auth/EmailVerification'));
const AcceptInvite = lazy(() => import('./pages/auth/AcceptInvite'));
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
const Purchases = lazy(() => import('./pages/purchases/Purchases'));
const PurchaseReturnPage = lazy(() => import('./pages/purchases/PurchaseReturnPage'));

const VendorLedgerPage = lazy(() => import('./pages/vendors/VendorLedgerPage'));
const CustomerLedger = lazy(() => import('./pages/customers/CustomerLedger'));
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'));
const StockAdjustments = lazy(() => import('./pages/inventory/StockAdjustments'));
const InventoryCount = lazy(() => import('./pages/inventory/InventoryCount'));
const ExpiryTracking = lazy(() => import('./pages/inventory/ExpiryTracking'));
const StockTransfer = lazy(() => import('./pages/inventory/StockTransfer'));
const BarcodeLabels = lazy(() => import('./pages/inventory/BarcodeLabels'));
const AuditLogPage = lazy(() => import('./pages/settings/AuditLogPage'));
const LocationsPage = lazy(() => import('./pages/settings/LocationsPage'));
const TeamPage = lazy(() => import('./pages/settings/TeamPage'));
const InvitePage = lazy(() => import('./pages/settings/InvitePage'));
const OrgSettingsPage = lazy(() => import('./pages/settings/OrgSettingsPage'));

// Page-level loading fallback — uses the shared AppLoader
const LoadingFallback = ({ text }: { text: string }) => (
  <AppLoader label={text} />
);

// Wraps a lazy-loaded page with Suspense + optional permission guard
function Page({ component: Component, text, permission }: {
  component: React.LazyExoticComponent<React.ComponentType>;
  text: string;
  permission?: Permission;
}) {
  const content = (
    <Suspense fallback={<LoadingFallback text={text} />}>
      <Component />
    </Suspense>
  );
  if (permission) {
    return <ProtectedRoute requiredPermission={permission}>{content}</ProtectedRoute>;
  }
  return content;
}

function App() {
  const { setUser, setProfile, setInitialized } = useAuthStore();
  const lastUserRef = useRef<string | null>(null);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const nextUserId = user?.uid || null;
      const previousUid = lastUserRef.current;
      if (previousUid && previousUid !== nextUserId) {
        clearSessionCaches(previousUid);
      }
      if (!nextUserId && previousUid) {
        clearSessionCaches(previousUid);
      }
      lastUserRef.current = nextUserId;

      setUser(user);
      if (user) {
        // Run profile + org resolution in parallel — neither depends on the other
        const [profileResult] = await Promise.allSettled([
          getProfile(user),
          resolveActiveOrganization(user.uid),
        ]);
        if (profileResult.status === 'fulfilled') {
          setProfile(profileResult.value);
        } else {
          console.error('Error fetching profile:', profileResult.reason);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      // Mark auth as initialized after first check
      setInitialized(true);

      // One-time role redirect: cashier→POS, accountant→reports (only on initial load at '/')
      if (user && window.location.pathname === '/') {
        const membership = useAuthStore.getState().membership;
        const ROLE_LANDING: Record<string, string> = { cashier: '/pos', accountant: '/reports' };
        const landing = membership ? ROLE_LANDING[membership.role] : undefined;
        if (landing) {
          window.location.replace(landing);
        }
      }

      // Check low stock and push notifications (fire-and-forget)
      if (user) {
        import('./lib/api/lowStock').then(({ getLowStockItems }) =>
          getLowStockItems().then(items => {
            if (items.length > 0) {
              import('./lib/hooks/useNotifications').then(({ notify }) => {
                notify(
                  'warning',
                  `${items.length} Low Stock Alert${items.length !== 1 ? 's' : ''}`,
                  items.slice(0, 3).map(i => i.name).join(', ') + (items.length > 3 ? ` +${items.length - 3} more` : ''),
                  '/inventory/alerts'
                );
              });
            }
          }).catch(() => {})
        );
      }
    });

    return () => unsubscribe();
  }, [setUser, setProfile, setInitialized]);

  return (
    <ThemeProvider defaultTheme="light">
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
            <Route path="/accept-invite" element={
              <Suspense fallback={<LoadingFallback text="Loading invite..." />}>
                <AcceptInvite />
              </Suspense>
            } />

            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<Page component={Dashboard} text="Loading dashboard" permission="dashboard.view" />} />
              <Route path="/pos" element={<Page component={POS} text="Loading POS system" permission="pos.access" />} />
              <Route path="/inventory/categories" element={<Page component={Categories} text="Loading categories" permission="categories.view" />} />
              <Route path="/inventory/items" element={<Page component={Items} text="Loading items" permission="inventory.view" />} />
              <Route path="/inventory/alerts" element={<Page component={Alerts} text="Loading alerts" permission="inventory.view" />} />
              <Route path="/vendors" element={<Page component={Vendors} text="Loading vendors" permission="vendors.view" />} />
              <Route path="/vendors/:id/ledger" element={<Page component={VendorLedgerPage} text="Loading ledger" permission="vendors.view" />} />
              <Route path="/purchases/new" element={<Page component={NewPurchase} text="Loading new purchase" permission="procurement.create" />} />
              <Route path="/purchases" element={<Page component={Purchases} text="Loading purchases" permission="procurement.view" />} />
              <Route path="/purchases/:id" element={<Page component={Purchases} text="Loading purchase" permission="procurement.view" />} />
              <Route path="/purchases/:id/return" element={<Page component={PurchaseReturnPage} text="Loading return" permission="procurement.view" />} />
              <Route path="/customers" element={<Page component={Customers} text="Loading customers" permission="customers.view" />} />
              <Route path="/customers/:id/ledger" element={<Page component={CustomerLedger} text="Loading customer ledger" permission="customers.view" />} />
              <Route path="/expenses" element={<Page component={Expenses} text="Loading expenses" permission="expenses.view" />} />
              <Route path="/transactions" element={<Page component={Transactions} text="Loading transactions" permission="inventory.view" />} />
              <Route path="/reports/performance" element={<Page component={PerformancePage} text="Loading performance analytics" permission="reports.performance" />} />
              <Route path="/inventory/valuation" element={<Page component={ValuationPage} text="Calculating valuation" permission="inventory.view" />} />
              <Route path="/reports" element={<Page component={ReportsPage} text="Loading reports" permission="reports.view" />} />
              <Route path="/inventory/adjustments" element={<Page component={StockAdjustments} text="Loading adjustments" permission="inventory.adjust_stock" />} />
              <Route path="/inventory/count" element={<Page component={InventoryCount} text="Loading inventory count" permission="inventory.view" />} />
              <Route path="/inventory/expiry" element={<Page component={ExpiryTracking} text="Loading expiry tracking" permission="inventory.view" />} />
              <Route path="/inventory/transfer" element={<Page component={StockTransfer} text="Loading stock transfer" permission="inventory.transfer" />} />
              <Route path="/inventory/barcodes" element={<Page component={BarcodeLabels} text="Loading barcode labels" permission="inventory.view" />} />
              <Route path="/settings" element={<Page component={Settings} text="Loading settings" permission="settings.view" />} />
              <Route path="/settings/audit" element={<Page component={AuditLogPage} text="Loading audit log" permission="audit.view" />} />
              <Route path="/settings/locations" element={<Page component={LocationsPage} text="Loading locations" permission="settings.view" />} />
              <Route path="/settings/team" element={<Page component={TeamPage} text="Loading team" permission="settings.team" />} />
              <Route path="/settings/invite" element={<Page component={InvitePage} text="Loading invite" permission="settings.invites" />} />
              <Route path="/settings/organization" element={<Page component={OrgSettingsPage} text="Loading org settings" permission="settings.org" />} />
            </Route>
          </Routes>
        </TourProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;