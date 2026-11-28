import { useMemo } from 'react';
import { motion as Motion } from 'framer-motion';
import {
  HiOutlineSearch,
  HiX,
  HiOutlineLocationMarker,
  HiOutlineClock,
  HiOutlineBell,
} from 'react-icons/hi';
import { MdTableBar, MdPeople } from 'react-icons/md';
import CategoryTabs from '../CategoryTabs';
import MenuItemCard from '../MenuItemCard';
import CartBar from '../CartBar';
import { buildClassicCssVars, mergeClassicConfig } from '../../utils/designTheme';

export default function ClassicMenuTheme({
  designConfig,
  restaurantName,
  restaurantLogo,
  restaurantDescription,
  crNumber,
  receiptHeaderNote,
  gstNo,
  vatNo,
  hasTable,
  tableId,
  tableNumber,
  tableCapacity,
  orderType,
  renderOrderTypeToggle,
  waiterCooldown,
  callingWaiter,
  handleCallWaiter,
  onNavigateOrders,
  searchOpen,
  setSearchOpen,
  searchQuery,
  setSearchQuery,
  categories,
  activeCategory,
  onSelectCategory,
  filteredMenu,
  sectionRefs,
}) {
  const safeConfig = useMemo(
    () => mergeClassicConfig(designConfig),
    [designConfig],
  );
  const cssVars = useMemo(
    () => buildClassicCssVars(safeConfig),
    [safeConfig],
  );

  const { layout, shape } = safeConfig;
  const isGrid = layout.itemViewMode === 'grid';
  const tagline = receiptHeaderNote || restaurantDescription || '';
  const logoSrc = restaurantLogo
    ? restaurantLogo.startsWith('http')
      ? restaurantLogo
      : `${import.meta.env.VITE_API_URL || ''}${restaurantLogo}`
    : '';

  return (
    <div
      style={{
        ...cssVars,
        fontFamily: 'var(--qr-font)',
        backgroundColor: 'var(--qr-bg)',
        color: 'var(--qr-text)',
      }}
      className="min-h-screen pb-24 transition-colors duration-200"
    >
      {restaurantName && layout.showBanner && (
        <div
          style={{
            background:
              'linear-gradient(135deg, var(--qr-primary) 0%, var(--qr-secondary) 100%)',
          }}
          className="text-white"
        >
          <div className="mx-auto max-w-2xl px-4 py-3.5">
            <div className="flex items-center justify-center gap-2">
              {layout.showLogo && logoSrc && (
                <img
                  src={logoSrc}
                  alt={restaurantName}
                  style={{ borderRadius: 'var(--qr-radius-sm)' }}
                  className="h-9 w-9 shrink-0 border border-white/30 object-cover"
                />
              )}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <HiOutlineLocationMarker size={18} className="flex-shrink-0" />
                  <h1 className="text-lg font-bold">{restaurantName}</h1>
                </div>
                {layout.showLogo && tagline && (
                  <p className="mt-0.5 text-xs opacity-90">{tagline}</p>
                )}
              </div>
            </div>
            {crNumber && (
              <p className="mt-0.5 text-center text-xs">CR No.: {crNumber}</p>
            )}
            {gstNo && <p className="text-center text-xs">GST No.: {gstNo}</p>}
            {vatNo && <p className="text-center text-xs">VAT No.: {vatNo}</p>}
            {tableNumber || tableId ? (
              <div className="mt-1.5 flex items-center justify-center gap-3 text-xs text-white/85">
                <span className="flex items-center gap-1">
                  <MdTableBar size={14} />
                  Table {tableNumber ? `#${tableNumber}` : `#${tableId.slice(-4)}`}
                </span>
                {tableCapacity > 0 && (
                  <span className="flex items-center gap-1">
                    <MdPeople size={14} />
                    {tableCapacity} Seats
                  </span>
                )}
              </div>
            ) : (
              <div className="mt-2 flex justify-center">
                {renderOrderTypeToggle()}
              </div>
            )}
          </div>
        </div>
      )}

      {restaurantName && !layout.showBanner && (
        <div
          style={{
            backgroundColor: 'var(--qr-surface)',
            borderColor: 'var(--qr-border)',
          }}
          className="border-b px-4 py-3"
        >
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {layout.showLogo && (
                <div
                  style={{
                    backgroundColor: 'var(--qr-primary)',
                    borderRadius: 'var(--qr-radius-sm)',
                  }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden text-xs font-bold text-white"
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
                <h1 className="truncate text-base font-bold">{restaurantName}</h1>
                {layout.showLogo && tagline && (
                  <p
                    style={{ color: 'var(--qr-text-muted)' }}
                    className="truncate text-xs"
                  >
                    {tagline}
                  </p>
                )}
              </div>
            </div>
            {(tableNumber || tableId) && (
              <span
                style={{
                  backgroundColor: 'var(--qr-primary-soft)',
                  color: 'var(--qr-primary)',
                  borderRadius: 'var(--qr-btn-radius)',
                }}
                className="inline-flex shrink-0 items-center gap-1 px-2.5 py-1 text-xs font-semibold"
              >
                <MdTableBar size={14} />
                Table {tableNumber ? `#${tableNumber}` : `#${tableId.slice(-4)}`}
              </span>
            )}
          </div>
        </div>
      )}

      <div
        style={{
          backgroundColor: 'var(--qr-surface)',
          borderColor: 'var(--qr-border)',
        }}
        className="sticky top-0 z-40 border-b backdrop-blur-md"
      >
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between px-4 py-3">
            {!searchOpen ? (
              <>
                <div>
                  <h2 className="text-lg font-bold">Menu</h2>
                  {!restaurantName && tableId && (
                    <p
                      style={{ color: 'var(--qr-text-muted)' }}
                      className="text-xs"
                    >
                      Table {tableNumber ? `#${tableNumber}` : `#${tableId.slice(-4)}`}
                    </p>
                  )}
                  {!restaurantName && !tableId && (
                    <p
                      style={{ color: 'var(--qr-text-muted)' }}
                      className="mt-1 text-xs"
                    >
                      {orderType === 'dine_in' ? 'Dine In Order' : 'Takeaway Order'}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {(!restaurantName || !layout.showBanner) &&
                    !tableId &&
                    renderOrderTypeToggle({
                      containerClassName: 'bg-slate-100',
                      activeClassName: 'bg-white text-slate-900',
                      idleClassName: 'text-slate-500',
                    })}
                  {hasTable && (
                    <button
                      onClick={handleCallWaiter}
                      disabled={waiterCooldown || callingWaiter}
                      title={waiterCooldown ? 'Waiter has been notified' : 'Call waiter'}
                      style={{
                        backgroundColor: 'var(--qr-bg)',
                        color: 'var(--qr-text-muted)',
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-full disabled:opacity-50"
                    >
                      <HiOutlineBell size={18} />
                    </button>
                  )}
                  <button
                    onClick={onNavigateOrders}
                    style={{
                      backgroundColor: 'var(--qr-bg)',
                      color: 'var(--qr-text-muted)',
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full"
                  >
                    <HiOutlineClock size={18} />
                  </button>
                  <button
                    onClick={() => setSearchOpen(true)}
                    style={{
                      backgroundColor: 'var(--qr-bg)',
                      color: 'var(--qr-text-muted)',
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full"
                  >
                    <HiOutlineSearch size={18} />
                  </button>
                </div>
              </>
            ) : (
              <Motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex w-full items-center gap-2"
              >
                <div className="relative flex-1">
                  <HiOutlineSearch
                    size={16}
                    style={{ color: 'var(--qr-text-muted)' }}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                  />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search dishes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      backgroundColor: 'var(--qr-bg)',
                      color: 'var(--qr-text)',
                      borderColor: 'var(--qr-border)',
                      borderRadius: 'var(--qr-btn-radius)',
                    }}
                    className="w-full border py-2.5 pl-9 pr-4 text-sm outline-none"
                  />
                </div>
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                  style={{ color: 'var(--qr-text-muted)' }}
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                >
                  <HiX size={18} />
                </button>
              </Motion.div>
            )}
          </div>

          {!searchOpen && categories.length > 0 && (
            <CategoryTabs
              categories={categories}
              activeId={activeCategory}
              onSelect={onSelectCategory}
            />
          )}
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 pt-4">
        {filteredMenu.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <span className="text-5xl">🍽️</span>
            <p
              style={{ color: 'var(--qr-text-muted)' }}
              className="mt-3 text-sm"
            >
              {searchQuery ? 'No dishes found' : 'Menu is empty'}
            </p>
          </div>
        ) : (
          filteredMenu.map((category) => (
            <div
              key={category._id}
              ref={(el) => {
                sectionRefs.current[category._id] = el;
              }}
              className="mb-6"
            >
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-base font-bold">{category.name}</h2>
                <span
                  style={{
                    backgroundColor: 'var(--qr-primary-soft)',
                    color: 'var(--qr-primary)',
                    borderRadius: 'var(--qr-btn-radius)',
                  }}
                  className="px-2 py-0.5 text-xs font-medium"
                >
                  {category.items?.length}
                </span>
              </div>
              <div
                className={
                  isGrid ? 'grid grid-cols-2 gap-3' : 'space-y-3'
                }
              >
                {category.items?.map((item) => (
                  <MenuItemCard
                    key={item._id}
                    item={item}
                    designConfig={safeConfig}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <CartBar buttonStyle={shape.buttonStyle} />
    </div>
  );
}
