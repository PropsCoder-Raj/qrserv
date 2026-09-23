import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { HiOutlineMenu, HiOutlineLogout, HiOutlineUser } from 'react-icons/hi';

export default function Header({ setSidebarOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stroke bg-card px-4 py-3 shadow-sm sm:px-6">
      <button
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <HiOutlineMenu size={22} />
      </button>

      <div className="hidden lg:block">
        <h1 className="text-lg font-semibold text-slate-800">Dashboard</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative" ref={dropdownRef}>
          <button
            className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-100 cursor-pointer"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-medium">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium text-slate-800">{user?.name || 'Admin'}</p>
              <p className="text-xs text-slate-500">{user?.role?.replace('_', ' ')}</p>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg border border-stroke bg-card py-2 shadow-lg">
              <div className="border-b border-stroke px-4 py-2 sm:hidden">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.role?.replace('_', ' ')}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-slate-100 cursor-pointer"
              >
                <HiOutlineLogout size={18} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
