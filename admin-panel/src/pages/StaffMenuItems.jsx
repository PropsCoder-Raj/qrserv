import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineSearch, HiOutlineClock } from 'react-icons/hi';
import menuService from '../services/menuService';
import { useAuth } from '../contexts/AuthContext';

export default function StaffMenuItems() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const restaurantId = user?.restaurantId;

  const loadItems = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const res = await menuService.getMenuItems(restaurantId, selectedCategory || undefined, { limit: 200 });
      const result = res.data.data;
      setItems(result.data || result);
    } catch {
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  }, [restaurantId, selectedCategory]);

  useEffect(() => { loadItems(); }, [loadItems]);

  useEffect(() => {
    if (!restaurantId) return;
    const loadCategories = async () => {
      try {
        const res = await menuService.getCategories(restaurantId, { limit: 100 });
        const result = res.data.data;
        setCategories(result.data || result);
      } catch {}
    };
    loadCategories();
  }, [restaurantId]);

  const filtered = items.filter((item) =>
    item.name?.toLowerCase().includes(search.toLowerCase()) ||
    item.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (!restaurantId) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        No restaurant assigned to your account.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-800">Menu Items</h2>
        <div className="relative w-full sm:w-72">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <HiOutlineSearch size={18} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menu items..."
            className="w-full rounded-lg border border-stroke bg-transparent py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition cursor-pointer ${!selectedCategory ? 'bg-primary text-white' : 'border border-stroke text-slate-600 hover:bg-slate-50'}`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategory(cat._id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition cursor-pointer ${selectedCategory === cat._id ? 'bg-primary text-white' : 'border border-stroke text-slate-600 hover:bg-slate-50'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-slate-500">
          No menu items found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => {
            const categoryName = categories.find((c) => c._id === item.categoryId)?.name;
            return (
              <div
                key={item._id}
                className="rounded-xl border border-stroke bg-card p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="text-sm font-semibold text-slate-800 leading-tight">{item.name}</h3>
                  <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${item.isVeg ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {item.isVeg ? 'VEG' : 'NON-VEG'}
                  </span>
                </div>
                {item.description && (
                  <p className="mb-3 text-xs text-slate-500 line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">
                    ₹{item.price}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {categoryName && (
                      <span className="rounded bg-slate-100 px-2 py-0.5">{categoryName}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <HiOutlineClock size={12} />
                      {item.preparationTime}m
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
