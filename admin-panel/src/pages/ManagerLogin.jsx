import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineBackspace } from 'react-icons/hi';
import api from '../services/api';

const PIN_LENGTH = 6;

export default function ManagerLogin() {
  const [passcode, setPasscode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [restaurantName, setRestaurantName] = useState('');
  const [loadingRestaurant, setLoadingRestaurant] = useState(true);
  const [invalidRestaurant, setInvalidRestaurant] = useState(false);
  const { loginManager } = useAuth();
  const navigate = useNavigate();
  const { restaurantId } = useParams();

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const res = await api.get(`/restaurants/${restaurantId}/info`);
        setRestaurantName(res.data.data.name);
      } catch {
        setInvalidRestaurant(true);
      } finally {
        setLoadingRestaurant(false);
      }
    };
    fetchRestaurant();
  }, [restaurantId]);

  const handlePasscodeLogin = async (pin) => {
    if (pin.length < 4) return;
    setIsLoading(true);
    try {
      const result = await loginManager(pin, restaurantId);
      if (result.user.role !== 'manager') {
        toast.error('This login is for managers only');
        localStorage.clear();
        window.location.reload();
        return;
      }
      toast.success('Login successful!');
      navigate('/staff/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid passcode');
      setPasscode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (key) => {
    if (isLoading) return;
    if (key === 'backspace') {
      setPasscode((prev) => prev.slice(0, -1));
    } else if (key === 'clear') {
      setPasscode('');
    } else if (key === 'submit') {
      handlePasscodeLogin(passcode);
    } else {
      const newPasscode = passcode + key;
      if (newPasscode.length <= PIN_LENGTH) {
        setPasscode(newPasscode);
      }
    }
  };

  if (loadingRestaurant) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-body px-4">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  if (invalidRestaurant) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-body px-4">
        <div className="w-full max-w-md rounded-2xl bg-card p-8 shadow-lg border border-stroke text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800">Invalid Restaurant</h1>
          <p className="mt-2 text-sm text-slate-500">This restaurant link is invalid or the restaurant no longer exists.</p>
          <Link to="/login" className="mt-4 inline-block text-sm text-primary hover:underline">Go to Admin Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-body px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-card p-8 shadow-lg border border-stroke">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Manager Login</h1>
            <p className="mt-1 text-sm font-medium text-blue-600">{restaurantName}</p>
            <p className="mt-1 text-sm text-slate-500">Enter your passcode to continue</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-center gap-3">
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <div
                  key={i}
                  className={`h-4 w-4 rounded-full border-2 transition-all duration-150 ${
                    i < passcode.length
                      ? 'border-blue-600 bg-blue-600 scale-110'
                      : 'border-slate-300 bg-transparent'
                  }`}
                />
              ))}
            </div>

            <div className="mx-auto grid w-64 grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(String(num))}
                  disabled={isLoading}
                  className="flex h-14 items-center justify-center rounded-xl border border-stroke bg-white text-xl font-semibold text-slate-800 transition hover:bg-slate-50 active:bg-slate-100 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleKeyPress('clear')}
                disabled={isLoading}
                className="flex h-14 items-center justify-center rounded-xl border border-stroke bg-white text-xs font-medium text-slate-500 transition hover:bg-slate-50 active:bg-slate-100 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                disabled={isLoading}
                className="flex h-14 items-center justify-center rounded-xl border border-stroke bg-white text-xl font-semibold text-slate-800 transition hover:bg-slate-50 active:bg-slate-100 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('backspace')}
                disabled={isLoading}
                className="flex h-14 items-center justify-center rounded-xl border border-stroke bg-white text-slate-500 transition hover:bg-slate-50 active:bg-slate-100 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <HiOutlineBackspace size={22} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => handlePasscodeLogin(passcode)}
              disabled={isLoading || passcode.length < 4}
              className="w-full rounded-lg bg-blue-600 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? 'Verifying...' : 'Unlock'}
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-sm">
            <Link to="/login" className="text-primary hover:underline">Admin Login</Link>
            <span className="text-slate-300">|</span>
            <Link to={`/staff-login/${restaurantId}`} className="text-primary hover:underline">Staff Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
