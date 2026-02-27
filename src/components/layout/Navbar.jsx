import { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ user, logout }) => {
  const [isOpen, setIsOpen] = useState(false);

  const NavLink = ({ to, children }) => (
    <Link
      to={to}
      className="relative px-3 py-2 text-sm font-medium text-gray-600 
                 hover:text-indigo-600 transition-colors duration-200
                 after:absolute after:bottom-0 after:left-0 after:h-0.5 
                 after:w-0 after:bg-indigo-600 after:transition-all 
                 hover:after:w-full"
    >
      {children}
    </Link>
  );

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link 
            to="/dashboard" 
            className="flex items-center gap-2 font-bold text-xl 
                       bg-gradient-to-r from-indigo-600 to-purple-600 
                       bg-clip-text text-transparent"
          >
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="hidden sm:inline">Stock Manager</span>
          </Link>

          {/* Center Nav - Desktop */}
          <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1">
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/suppliers">Suppliers</NavLink>
            <NavLink to="/parts">Parts</NavLink>
            <NavLink to="/customers">Customers</NavLink>
          </div>

          {/* Right - User Info */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 
                            flex items-center justify-center text-white text-sm font-medium">
                {user?.fullName?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">{user?.fullName}</span>
                <span className="text-xs text-gray-500">{user?.role}</span>
              </div>
            </div>
            <button 
              onClick={logout} 
              className="px-4 py-2 text-sm font-medium text-gray-600 
                       hover:text-red-600 hover:bg-red-50 rounded-lg 
                       transition-all duration-200"
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 
                     transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu - Bottom Nav Links */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out
                        ${isOpen ? 'max-h-96 pb-4' : 'max-h-0'}`}>
          
          {/* User Info - Mobile */}
          <div className="flex items-center gap-3 py-3 mb-2 border-b border-gray-100">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 
                          flex items-center justify-center text-white font-medium">
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">{user?.fullName}</span>
              <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
            </div>
          </div>

          {/* Nav Links - Mobile */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { to: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
              { to: '/bills', label: 'Bills', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
              { to: '/suppliers', label: 'Suppliers', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
              { to: '/parts', label: 'Parts', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
              { to: '/customers', label: 'Customers', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 
                         hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Logout - Mobile */}
          <button
            onClick={logout}
            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 
                     rounded-xl text-red-600 bg-red-50 hover:bg-red-100 
                     transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;