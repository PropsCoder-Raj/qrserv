import { useAuth } from '../contexts/AuthContext';

export default function useSubscription() {
  const { user, subscription } = useAuth();

  // super_admin and org_admin see everything
  if (user?.role === 'super_admin' || user?.role === 'org_admin') {
    return {
      hasTables: true,
      maxTables: 999999,
      hasCustomerData: true,
      customerDataIncluded: true,
      planName: user?.role === 'super_admin' ? 'Super Admin' : 'Org Admin',
    };
  }

  return {
    hasTables: subscription?.maxTables > 0,
    maxTables: subscription?.maxTables || 0,
    hasCustomerData: subscription?.customerDataAccess !== 'none',
    customerDataIncluded: subscription?.customerDataAccess === 'included',
    planName: subscription?.name || 'No Plan',
  };
}
