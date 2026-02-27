import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Suppliers from './pages/settings/Suppliers';
import Parts from './pages/settings/Parts';
import Customers from './pages/settings/Customers';
import BillList from './pages/bills/BillList';
import BillForm from './pages/bills/BillForm';
import BillDetails from './pages/bills/BillDetails';


// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route wrapper (redirect if logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Navigation Link component
const NavLink = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <Link
      to={to}
      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
        ? 'bg-blue-50 text-blue-700'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
    >
      {children}
    </Link>
  );
};

// Layout with navigation
const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <Navbar user={user} logout={logout} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
};

// Dashboard placeholder
const Dashboard = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>
      <p className="text-gray-600">Dashboard coming soon...</p>
    </div>
  );
};


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />

          {/* Bills */}
        <Route
          path="/bills"
          element={
            <ProtectedRoute>
              <AppLayout>
                <BillList />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bills/new"
          element={
            <ProtectedRoute>
              <AppLayout>
                <BillForm />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bills/:id/edit"
          element={
            <ProtectedRoute>
              <AppLayout>
                <BillForm />
              </AppLayout>
            </ProtectedRoute>
          }
        />
{/* Master Data */}
        <Route
          path="/suppliers"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Suppliers />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/parts"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Parts />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Customers />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900">404</h1>
                <p className="text-gray-600 mt-2">Page not found</p>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;