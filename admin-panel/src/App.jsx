import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import StaffLayout from './components/StaffLayout';
import Login from './pages/Login';
import ManagerLogin from './pages/ManagerLogin';
import StaffLogin from './pages/StaffLogin';
import Dashboard from './pages/Dashboard';
import Restaurants from './pages/Restaurants';
import Categories from './pages/Categories';
import MenuItems from './pages/MenuItems';
import Tables from './pages/Tables';
import Orders from './pages/Orders';
import Users from './pages/Users';
import Subscriptions from './pages/Subscriptions';
import Organizations from './pages/Organizations';
import OrganizationDetails from './pages/OrganizationDetails';
import MySubscription from './pages/MySubscription';
import SubscriptionHistories from './pages/SubscriptionHistories';
import StaffMenuItems from './pages/StaffMenuItems';
import StaffOrders from './pages/StaffOrders';
import WithdrawRequests from './pages/WithdrawRequests';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/manager-login/:restaurantId" element={<ManagerLogin />} />
          <Route path="/staff-login/:restaurantId" element={<StaffLogin />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/organizations" element={<Organizations />} />
            <Route
              path="/organizations/:id"
              element={<OrganizationDetails />}
            />
            <Route path="/order-payments" element={<OrganizationDetails />} />
            <Route path="/restaurants" element={<Restaurants />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/menu-items" element={<MenuItems />} />
            <Route path="/tables" element={<Tables />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/users" element={<Users />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/subscription-histories" element={<SubscriptionHistories />} />
            <Route path="/my-subscription" element={<MySubscription />} />
            <Route path="/withdraw-requests" element={<WithdrawRequests />} />
          </Route>
          <Route element={<StaffLayout />}>
            <Route path="/staff/menu" element={<StaffMenuItems />} />
            <Route path="/staff/orders" element={<StaffOrders />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { fontSize: '14px', borderRadius: '8px' },
        }}
      />
    </AuthProvider>
  );
}
