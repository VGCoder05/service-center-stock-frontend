import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Suppliers from './pages/settings/Suppliers';

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

// Layout with navigation
const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            {/* Left - Logo & Nav */}
            <div className="flex items-center gap-8">
              <Link to="/dashboard" className="font-bold text-xl text-gray-900">
                Stock Manager
              </Link>
              <div className="flex gap-4">
                <Link 
                  to="/dashboard" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/suppliers" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Suppliers
                </Link>
              </div>
            </div>

            {/* Right - User */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.fullName}</span>
              <span className="badge-in-stock">{user?.role}</span>
              <button onClick={logout} className="btn-secondary text-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

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

// Temporary Dashboard placeholder
// const Dashboard = () => {
//   const { user, logout } = useAuth();
  
//   return (
//     <div className="min-h-screen bg-gray-50 p-8">
//       <div className="max-w-4xl mx-auto">
//         <div className="card">
//           <h1 className="text-2xl font-bold text-gray-900 mb-4">
//             Dashboard
//           </h1>
//           <p className="text-gray-600 mb-4">
//             Welcome, <span className="font-semibold">{user?.fullName}</span>!
//           </p>
//           <div className="flex gap-2 mb-4">
//             <span className="badge-in-stock">{user?.role}</span>
//             <span className="text-sm text-gray-500">{user?.email}</span>
//           </div>
//           <button onClick={logout} className="btn-danger">
//             Logout
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

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