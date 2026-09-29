import { NavLink, Outlet } from 'react-router-dom';
import { HiOutlineClipboardList } from 'react-icons/hi';

const settingsGroups = [
  {
    label: 'Order Management',
    items: [
      {
        path: '/settings/order-statistics',
        label: 'Order Statistics',
        icon: HiOutlineClipboardList,
      },
    ],
  },
];

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Settings</h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage configuration and preferences for your account.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="space-y-5">
          {settingsGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {group.label}
              </p>
              <ul className="mt-2 space-y-1">
                {group.items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`
                      }
                    >
                      <item.icon size={16} />
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
