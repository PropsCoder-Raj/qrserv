import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import restaurantService from '../services/restaurantService';
import organizationService from '../services/organizationService';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrgData = async (userData) => {
    if (!userData?.organizationId) return;
    try {
      const res = await organizationService.getOne(userData.organizationId);
      const org = res.data.data;
      setOrganization(org);
      setSubscription(org.subscriptionPlan || null);
    } catch {
      // silently fail
    }
  };

  const fetchRestaurantData = async (userData) => {
    if (!userData?.restaurantId) return;
    try {
      const res = await restaurantService.getOne(userData.restaurantId);
      const rest = res.data.data;
      setRestaurant(rest);
      // If no org subscription yet, try to get it from the restaurant's org
      if (!subscription && rest.organizationId) {
        const orgId = rest.organizationId?._id || rest.organizationId;
        try {
          const orgRes = await organizationService.getOne(orgId);
          const org = orgRes.data.data;
          setOrganization(org);
          setSubscription(org.subscriptionPlan || null);
        } catch {}
      }
    } catch {
      // silently fail - subscription data is optional
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        fetchOrgData(parsed);
        fetchRestaurantData(parsed);
      } catch {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await authService.login({ email, password });
    const result = data.data;
    localStorage.setItem('accessToken', result.accessToken);
    localStorage.setItem('refreshToken', result.refreshToken);
    localStorage.setItem('user', JSON.stringify(result.user));
    setUser(result.user);
    await fetchOrgData(result.user);
    await fetchRestaurantData(result.user);
    return result;
  };

  const loginManager = async (passcode, restaurantId) => {
    const { data } = await authService.loginManager({ passcode, restaurantId });
    const result = data.data;
    localStorage.setItem('accessToken', result.accessToken);
    localStorage.setItem('refreshToken', result.refreshToken);
    localStorage.setItem('user', JSON.stringify(result.user));
    setUser(result.user);
    await fetchOrgData(result.user);
    await fetchRestaurantData(result.user);
    return result;
  };

  const loginStaff = async (passcode, restaurantId) => {
    const { data } = await authService.loginStaff({ passcode, restaurantId });
    const result = data.data;
    localStorage.setItem('accessToken', result.accessToken);
    localStorage.setItem('refreshToken', result.refreshToken);
    localStorage.setItem('user', JSON.stringify(result.user));
    setUser(result.user);
    await fetchOrgData(result.user);
    await fetchRestaurantData(result.user);
    return result;
  };

  const refreshOrgData = async () => {
    const currentUser = user || JSON.parse(localStorage.getItem('user'));
    if (currentUser) {
      await fetchOrgData(currentUser);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    setOrganization(null);
    setRestaurant(null);
    setSubscription(null);
  };

  return (
    <AuthContext.Provider value={{ user, organization, restaurant, subscription, login, loginManager, loginStaff, logout, refreshOrgData, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
