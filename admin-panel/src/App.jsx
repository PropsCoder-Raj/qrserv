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
import MenuManagement from './pages/MenuManagement';
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
import Settings from './pages/Settings';
import RestaurantProfileSettings from './pages/RestaurantProfileSettings';
import OrderStatistics from './pages/OrderStatistics';
import OrderAnalytics from './pages/OrderAnalytics';
import Coupons from './pages/Coupons';
import AdminBillPrintPreview from './pages/AdminBillPrintPreview';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/captain-login/:restaurantId" element={<ManagerLogin />} />
          <Route path="/kitchen-login/:restaurantId" element={<StaffLogin />} />
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
            <Route path="/categories" element={<Navigate to="/menu-items" replace />} />
            <Route path="/menu-items" element={<MenuManagement />} />
            <Route path="/coupons" element={<Coupons />} />
            <Route path="/tables" element={<Tables />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/order-analytics" element={<OrderAnalytics />} />
            <Route path="/users" element={<Users />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/subscription-histories" element={<SubscriptionHistories />} />
            <Route path="/my-subscription" element={<MySubscription />} />
            <Route path="/withdraw-requests" element={<WithdrawRequests />} />
            <Route path="/settings" element={<Settings />}>
              <Route index element={<Navigate to="restaurant-profile" replace />} />
              <Route path="restaurant-profile" element={<RestaurantProfileSettings />} />
              <Route path="order-statistics" element={<OrderStatistics />} />
            </Route>
          </Route>
          <Route element={<StaffLayout />}>
            <Route path="/staff/menu" element={<StaffMenuItems />} />
            <Route path="/staff/orders" element={<StaffOrders />} />
          </Route>
          {/* Admin / POS Paroso-Style Thermal Print & KOT Preview */}
          <Route path="/admin/print/bill/:id" element={<AdminBillPrintPreview />} />
          <Route path="/print/bill/:id" element={<AdminBillPrintPreview />} />
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
