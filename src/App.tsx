import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useEffect } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getProfile } from './lib/api/auth';
import { useAuthStore } from './lib/store';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Items from './pages/inventory/Items';
import Categories from './pages/inventory/Categories';
import Transactions from './pages/inventory/Transactions';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

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
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory/items" element={<Items />} />
          <Route path="/inventory/categories" element={<Categories />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;