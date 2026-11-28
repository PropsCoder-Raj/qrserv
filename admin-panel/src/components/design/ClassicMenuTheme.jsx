import { useMemo, useState } from 'react';
import {
  HiOutlineSearch,
  HiOutlineShoppingBag,
  HiOutlineClock,
  HiOutlineLocationMarker,
  HiPlus,
  HiMinus,
  HiX,
} from 'react-icons/hi';
import { MdTableBar } from 'react-icons/md';
import { buildClassicCssVars, mergeClassicConfig } from '../../utils/designTheme';

const SAMPLE_CATEGORIES = [
  {
    _id: 'starters',
    name: 'Starters',
    items: [
      {
        _id: 's1',
        name: 'Truffle Mushroom Bruschetta',
        description: 'Toasted sourdough topped with roasted wild mushrooms, garlic confit & herbs.',
        price: 240,
        isVeg: true,
        prepTime: 12,
        emoji: '🥖',
        tint: '#FEF3C7',
      },
      {
        _id: 's2',
        name: 'Smoky Peri-Peri Wings',
        description: 'Char-grilled chicken wings glazed in house peri-peri butter with ranch dip.',
        price: 320,
        isVeg: false,
        prepTime: 16,
        emoji: '🍗',
        tint: '#FEE2E2',
      },
    ],
  },
  {
    _id: 'mains',
    name: 'Mains',
    items: [
      {
        _id: 'm1',
        name: 'Burrata Margherita Pizza',
        description: 'San Marzano tomato base, creamy pugliese burrata, fresh basil & olive oil.',
        price: 460,
        isVeg: true,
        prepTime: 18,
        emoji: '🍕',
        tint: '#FFEDD5',
      },
      {
        _id: 'm2',
        name: 'Herb Crusted Salmon Bowl',
        description: 'Pan-seared Atlantic salmon over warm jasmine rice, avocado & citrus glaze.',
        price: 590,
        isVeg: false,
        prepTime: 20,
        emoji: '🍣',
        tint: '#DBEAFE',
      },
    ],
  },
  {
    _id: 'beverages',
    name: 'Beverages',
    items: [
      {
        _id: 'b1',
        name: 'Yuzu Mint Cooler',
        description: 'Sparkling Japanese yuzu citrus infused with crushed garden mint.',
        price: 160,
        isVeg: true,
        prepTime: 5,
        emoji: '🍹',
        tint: '#D1FAE5',
      },
    ],
  },
  {
    _id: 'desserts',
    name: 'Desserts',
    items: [
      {
        _id: 'd1',
        name: 'Classic Tiramisu',
        description: 'Espresso-soaked savoiardi layered with whipped mascarpone & cocoa.',
        price: 280,
        isVeg: true,
        prepTime: 8,
        emoji: '🍰',
        tint: '#FCE7F3',
      },
    ],
  },
];

function DietaryBadge({ isVeg }) {
  return (
    <span
      className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
        isVeg ? 'border-emerald-600' : 'border-red-600'
      }`}
      title={isVeg ? 'Veg' : 'Non-Veg'}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          isVeg ? 'bg-emerald-600' : 'bg-red-600'
        }`}
      />
    </span>
  );
}

function getButtonStyleProps(buttonStyle) {
  if (buttonStyle === 'outline') {
    return {
      backgroundColor: 'transparent',
      color: 'var(--qr-primary)',
      border: '1.5px solid var(--qr-primary)',
      borderRadius: 'var(--qr-btn-radius)',
    };
  }
  return {
    backgroundColor: 'var(--qr-primary)',
    color: '#FFFFFF',
    border: '1.5px solid var(--qr-primary)',
    borderRadius: 'var(--qr-btn-radius)',
  };
}

export default function ClassicMenuTheme({
  config,
  restaurant,
  viewport = 'mobile',
}) {
  const safeConfig = useMemo(() => mergeClassicConfig(config), [config]);
  const cssVars = useMemo(() => buildClassicCssVars(safeConfig), [safeConfig]);

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderType, setOrderType] = useState('dine_in');
  const [cart, setCart] = useState({ s1: 1, m1: 1 });

  const { layout, shape } = safeConfig;
  const isGrid = layout.itemViewMode === 'grid';
  const isDesktop = viewport === 'desktop';

  const restaurantName = restaurant?.name || 'Bistro Royale';
  const tagline =
    restaurant?.receipt_header_note ||
    restaurant?.description ||
    'Freshly crafted dishes • Order directly from your table';
  const logoSrc = restaurant?.logo
    ? restaurant.logo.startsWith('http')
      ? restaurant.logo
      : `${import.meta.env.VITE_API_URL ? '' : ''}${restaurant.logo}`
    : '';

  const visibleCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return SAMPLE_CATEGORIES.filter(
      (cat) => activeCategory === 'all' || cat._id === activeCategory,
    )
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            !q ||
            item.name.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q),
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [activeCategory, searchQuery]);

  const updateCart = (id, delta) => {
    setCart((prev) => {
      const next = (prev[id] || 0) + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  const cartSummary = useMemo(() => {
    const allItems = SAMPLE_CATEGORIES.flatMap((c) => c.items);
    let count = 0;
    let total = 0;
    Object.entries(cart).forEach(([id, qty]) => {
      const found = allItems.find((i) => i._id === id);
      if (found && qty > 0) {
        count += qty;
        total += found.price * qty;
      }
    });
    return { count, total };
  }, [cart]);

  const primaryButtonStyle = getButtonStyleProps(shape.buttonStyle);

  return (
    <div
      style={{
        ...cssVars,
        fontFamily: 'var(--qr-font)',
        backgroundColor: 'var(--qr-bg)',
        color: 'var(--qr-text)',
      }}
      className="relative flex min-h-full flex-col pb-20 transition-colors duration-200"
    >
      {/* Header / Banner */}
      {layout.showBanner ? (
        <header
          style={{
            background:
              'linear-gradient(135deg, var(--qr-primary) 0%, var(--qr-secondary) 100%)',
          }}
          className="relative overflow-hidden px-4 py-4 text-white"
        >
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20"
            style={{ backgroundColor: '#FFFFFF' }}
          />
          <div className={isDesktop ? 'mx-auto max-w-4xl' : ''}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {layout.showLogo && (
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden bg-white/20 text-base font-bold text-white backdrop-blur-sm border border-white/25"
                    style={{ borderRadius: 'var(--qr-radius-sm)' }}
                  >
                    {logoSrc ? (
                      <img
                        src={logoSrc}
                        alt={restaurantName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      restaurantName.slice(0, 2).toUpperCase()
                    )}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <HiOutlineLocationMarker size={15} className="shrink-0 opacity-90" />
                    <h1 className="truncate text-base font-bold tracking-tight">
                      {restaurantName}
                    </h1>
                  </div>
                  {layout.showLogo && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-white/85">
                      {tagline}
                    </p>
                  )}
                </div>
              </div>

              <span
                className="inline-flex shrink-0 items-center gap-1 bg-white/20 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm"
                style={{ borderRadius: 'var(--qr-btn-radius)' }}
              >
                <MdTableBar size={13} />
                Table #04
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <div
                className="inline-flex bg-black/15 p-0.5"
                style={{ borderRadius: 'var(--qr-btn-radius)' }}
              >
                {[
                  { id: 'dine_in', label: 'Dine In' },
                  { id: 'takeaway', label: 'Takeaway' },
                ].map((opt) => {
                  const active = orderType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setOrderType(opt.id)}
                      style={{ borderRadius: 'var(--qr-btn-radius)' }}
                      className={`px-3 py-1 text-[11px] font-semibold transition ${
                        active
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-white/80 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <span className="text-[11px] font-medium text-white/80">
                Classic Theme
              </span>
            </div>
          </div>
        </header>
      ) : (
        <header
          style={{
            backgroundColor: 'var(--qr-surface)',
            borderColor: 'var(--qr-border)',
          }}
          className="border-b px-4 py-3"
        >
          <div
            className={`flex items-center justify-between gap-2 ${
              isDesktop ? 'mx-auto max-w-4xl' : ''
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {layout.showLogo && (
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center text-xs font-bold text-white"
                  style={{
                    backgroundColor: 'var(--qr-primary)',
                    borderRadius: 'var(--qr-radius-sm)',
                  }}
                >
                  {logoSrc ? (
                    <img
                      src={logoSrc}
                      alt={restaurantName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    restaurantName.slice(0, 2).toUpperCase()
                  )}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="truncate text-sm font-bold">{restaurantName}</h1>
                {layout.showLogo && (
                  <p
                    className="truncate text-[11px]"
                    style={{ color: 'var(--qr-text-muted)' }}
                  >
                    {tagline}
                  </p>
                )}
              </div>
            </div>
            <span
              className="inline-flex shrink-0 items-center gap-1 px-2.5 py-1 text-[11px] font-semibold"
              style={{
                backgroundColor: 'var(--qr-primary-soft)',
                color: 'var(--qr-primary)',
                borderRadius: 'var(--qr-btn-radius)',
              }}
            >
              <MdTableBar size={12} />
              Table #04
            </span>
          </div>
        </header>
      )}

      {/* Sticky Search & Category Tabs */}
      <div
        style={{
          backgroundColor: 'var(--qr-surface)',
          borderColor: 'var(--qr-border)',
        }}
        className="sticky top-0 z-10 border-b backdrop-blur-md"
      >
        <div className={isDesktop ? 'mx-auto max-w-4xl' : ''}>
          <div className="px-4 pt-3">
            <div className="relative">
              <HiOutlineSearch
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--qr-text-muted)' }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes..."
                style={{
                  backgroundColor: 'var(--qr-bg)',
                  color: 'var(--qr-text)',
                  borderColor: 'var(--qr-border)',
                  borderRadius: 'var(--qr-btn-radius)',
                }}
                className="w-full border py-2 pl-9 pr-8 text-xs outline-none transition focus:ring-1"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--qr-text-muted)' }}
                >
                  <HiX size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto px-4 py-3">
            {[
              { _id: 'all', name: 'All' },
              ...SAMPLE_CATEGORIES.map((c) => ({ _id: c._id, name: c.name })),
            ].map((cat) => {
              const active = activeCategory === cat._id;
              return (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => setActiveCategory(cat._id)}
                  style={{
                    backgroundColor: active
                      ? 'var(--qr-primary)'
                      : 'var(--qr-bg)',
                    color: active ? '#FFFFFF' : 'var(--qr-text-muted)',
                    borderColor: active
                      ? 'var(--qr-primary)'
                      : 'var(--qr-border)',
                    borderRadius: 'var(--qr-btn-radius)',
                  }}
                  className="shrink-0 border px-3.5 py-1.5 text-xs font-semibold transition"
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className={`flex-1 px-4 pt-4 ${isDesktop ? 'mx-auto w-full max-w-4xl' : ''}`}>
        {visibleCategories.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-medium" style={{ color: 'var(--qr-text-muted)' }}>
              No dishes match "{searchQuery}"
            </p>
          </div>
        ) : (
          visibleCategories.map((category) => (
            <section key={category._id} className="mb-5">
              <div className="mb-2.5 flex items-center gap-2">
                <h2 className="text-sm font-bold">{category.name}</h2>
                <span
                  className="px-2 py-0.5 text-[11px] font-semibold"
                  style={{
                    backgroundColor: 'var(--qr-primary-soft)',
                    color: 'var(--qr-primary)',
                    borderRadius: 'var(--qr-btn-radius)',
                  }}
                >
                  {category.items.length}
                </span>
              </div>

              <div
                className={
                  isGrid
                    ? isDesktop
                      ? 'grid grid-cols-3 gap-3'
                      : 'grid grid-cols-2 gap-2.5'
                    : isDesktop
                      ? 'grid grid-cols-2 gap-3'
                      : 'space-y-2.5'
                }
              >
                {category.items.map((item) => {
                  const qty = cart[item._id] || 0;
                  return (
                    <div
                      key={item._id}
                      style={{
                        backgroundColor: 'var(--qr-surface)',
                        borderColor: 'var(--qr-border)',
                        borderRadius: 'var(--qr-radius)',
                      }}
                      className={`border p-3 shadow-xs transition ${
                        isGrid
                          ? 'flex flex-col justify-between gap-2.5'
                          : 'flex items-stretch justify-between gap-3'
                      }`}
                    >
                      {isGrid && (
                        <div
                          className="flex h-24 w-full items-center justify-center text-3xl"
                          style={{
                            backgroundColor: item.tint,
                            borderRadius: 'var(--qr-radius-sm)',
                          }}
                        >
                          {item.emoji}
                        </div>
                      )}

                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div>
                          <div className="flex items-start gap-1.5">
                            {layout.showDietaryBadges && (
                              <DietaryBadge isVeg={item.isVeg} />
                            )}
                            <h3 className="line-clamp-2 text-xs font-semibold leading-snug">
                              {item.name}
                            </h3>
                          </div>
                          {layout.showDescriptions && (
                            <p
                              className="mt-1 line-clamp-2 text-[11px] leading-relaxed"
                              style={{ color: 'var(--qr-text-muted)' }}
                            >
                              {item.description}
                            </p>
                          )}
                        </div>

                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          <div>
                            <div className="text-xs font-bold">
                              ₹{item.price.toFixed(0)}
                            </div>
                            <div
                              className="mt-0.5 flex items-center gap-0.5 text-[10px]"
                              style={{ color: 'var(--qr-text-muted)' }}
                            >
                              <HiOutlineClock size={10} />
                              {item.prepTime}m
                            </div>
                          </div>

                          {qty === 0 ? (
                            <button
                              type="button"
                              onClick={() => updateCart(item._id, 1)}
                              style={primaryButtonStyle}
                              className="px-3 py-1 text-[11px] font-bold uppercase tracking-wide transition hover:opacity-90"
                            >
                              Add
                            </button>
                          ) : (
                            <div
                              style={{
                                backgroundColor: 'var(--qr-primary)',
                                borderRadius: 'var(--qr-btn-radius)',
                              }}
                              className="inline-flex items-center gap-1 px-1 py-0.5 text-white"
                            >
                              <button
                                type="button"
                                onClick={() => updateCart(item._id, -1)}
                                className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-black/15"
                              >
                                <HiMinus size={11} />
                              </button>
                              <span className="min-w-[14px] text-center text-[11px] font-bold">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateCart(item._id, 1)}
                                className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-black/15"
                              >
                                <HiPlus size={11} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {!isGrid && (
                        <div
                          className="flex h-20 w-20 shrink-0 items-center justify-center text-3xl"
                          style={{
                            backgroundColor: item.tint,
                            borderRadius: 'var(--qr-radius-sm)',
                          }}
                        >
                          {item.emoji}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Floating View Cart Bar */}
      {cartSummary.count > 0 && (
        <div
          className={`sticky bottom-3 z-20 mt-auto px-4 ${
            isDesktop ? 'mx-auto w-full max-w-4xl' : ''
          }`}
        >
          <div
            style={{
              backgroundColor: 'var(--qr-primary)',
              borderRadius:
                shape.buttonStyle === 'pill' ? '9999px' : 'var(--qr-radius)',
            }}
            className="flex items-center justify-between px-4 py-3 text-white shadow-lg"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <HiOutlineShoppingBag size={18} />
                <span
                  style={{ backgroundColor: 'var(--qr-secondary)' }}
                  className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                >
                  {cartSummary.count}
                </span>
              </div>
              <span className="text-xs font-medium text-white/90">
                {cartSummary.count}{' '}
                {cartSummary.count === 1 ? 'item' : 'items'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">
                ₹{cartSummary.total.toFixed(0)}
              </span>
              <span className="text-[11px] font-semibold text-white/90">
                View Cart →
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
