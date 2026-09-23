import { NavLink } from 'react-router-dom';
import {
  HiOutlineViewGrid,
  HiOutlineGlobe,
  HiOutlineOfficeBuilding,
  HiOutlineBookOpen,
  HiOutlineTag,
  HiOutlineQrcode,
  HiOutlineClipboardList,
  HiOutlineChartBar,
  HiOutlineUsers,
  HiOutlineCreditCard,
  HiOutlineCollection,
  HiOutlineCash,
  HiOutlineX,
} from 'react-icons/hi';
import useSubscription from '../hooks/useSubscription';
import { useAuth } from '../contexts/AuthContext';

const allMenuItems = [
  { path: '/', label: 'Dashboard', icon: HiOutlineViewGrid },
  { path: '/organizations', label: 'Organizations', icon: HiOutlineGlobe, roles: ['super_admin'] },
  { path: '/restaurants', label: 'Restaurants', icon: HiOutlineOfficeBuilding, roles: ['super_admin', 'org_admin'] },
  { path: '/categories', label: 'Categories', icon: HiOutlineTag },
  { path: '/menu-items', label: 'Menu Items', icon: HiOutlineBookOpen },
  { path: '/tables', label: 'Tables', icon: HiOutlineQrcode,  },
  { path: '/orders', label: 'Orders', icon: HiOutlineClipboardList },
  { path: '/order-payments', label: 'Order Payments', icon: HiOutlineChartBar, roles: ['super_admin', 'org_admin'] },
  { path: '/users', label: 'Users', icon: HiOutlineUsers },
  { path: '/subscriptions', label: 'Subscriptions', icon: HiOutlineCreditCard, roles: ['super_admin'] },
  { path: '/subscription-histories', label: 'Sub. Histories', icon: HiOutlineCollection, roles: ['super_admin'] },
  { path: '/my-subscription', label: 'My Subscription', icon: HiOutlineCreditCard, roles: ['org_admin'] },
  { path: '/withdraw-requests', label: 'Withdraw Requests', icon: HiOutlineCash, roles: ['super_admin', 'org_admin', 'restaurant_owner'] },
];

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const { hasTables } = useSubscription();
  const { user } = useAuth();

  const menuItems = allMenuItems.filter((item) => {
    if (item.requiresTables && !hasTables) return false;
    if (item.roles && !item.roles.includes(user?.role)) return false;
    return true;
  });

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}

        style={{ background: 'linear-gradient(180deg, #187932, #146a2c)' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <h2 className="text-xl font-bold bg-white rounded-xl"><img src="/img/QRSERVE_MAIN_LOGO.png" alt="" srcset="" /></h2>
          <button
            className="text-white lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <HiOutlineX size={22} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-4 py-4">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-slate-300 hover:bg-sidebar-hover hover:text-white'
                    }`
                  }
                  end={item.path === '/'}
                >
                  <item.icon size={20} />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-white/10 px-6 py-4">
          <p className="text-xs text-slate-400">v1.0.0</p>
        </div>
      </aside>
    </>
  );
}
