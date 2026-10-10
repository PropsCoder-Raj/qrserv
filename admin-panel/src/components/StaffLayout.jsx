import { useState, useRef, useEffect } from 'react';
import { Outlet, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { HiOutlineLogout, HiOutlineClipboardList, HiOutlineViewGrid, HiOutlineBell } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function StaffLayout() {
  const { user, loading, logout, notificationsEnabled, updateNotificationSettings } = useAuth();
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-body">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleNotifications = async () => {
    try {
      await updateNotificationSettings(!notificationsEnabled);
    } catch {
      toast.error('Failed to update notification settings');
    }
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${isActive ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'}`;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stroke bg-card px-4 py-3 shadow-sm sm:px-6">
        <div className="flex items-center gap-1 sm:gap-2">
          <h1 className="mr-2 font-bold text-slate-800 sm:mr-4"><img src="/img/QRSERVE_MAIN_LOGO.png" alt="" srcset="" style={{ height: '2.5rem' }} /></h1>
          <NavLink to="/staff/menu" className={linkClass}>
            <HiOutlineViewGrid size={18} />
            <span className="hidden sm:inline">Menu Items</span>
          </NavLink>
          <NavLink to="/staff/orders" className={linkClass}>
            <HiOutlineClipboardList size={18} />
            <span className="hidden sm:inline">Orders</span>
          </NavLink>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-100 cursor-pointer"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-medium">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium text-slate-800">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.role?.replace('_', ' ')}</p>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-70 rounded-lg border border-stroke bg-card py-2 shadow-lg">
              <div className="border-b border-stroke px-4 py-2 sm:hidden">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.role?.replace('_', ' ')}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notificationsEnabled}
                onClick={toggleNotifications}
                className="flex w-full items-center justify-between gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <HiOutlineBell size={18} />
                  Order notifications
                </span>
                <span className={`relative h-5 w-9 rounded-full transition ${notificationsEnabled ? 'bg-primary' : 'bg-slate-300'}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${notificationsEnabled ? 'left-[1.125rem]' : 'left-0.5'}`} />
                </span>
              </button>
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
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}
