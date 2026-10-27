import React from 'react';

/**
 * Paroso-Style Kitchen Order Ticket (KOT) Component
 * Activated via query parameter (?kot=1) or direct admin action.
 * Strictly hides all pricing, taxes, and financial figures.
 * Prominently presents table/token numbers, item quantities, variants,
 * cooking notes, and kitchen instructions.
 */
export default function ThermalKOT({
  order,
  restaurant = {},
  paperWidth = '80mm',
}) {
  if (!order) return null;

  const effectiveRestaurant =
    restaurant && (restaurant.name || restaurant.address)
      ? restaurant
      : order?.restaurantId && typeof order.restaurantId === 'object'
        ? order.restaurantId
        : restaurant || {};

  const widthClass = paperWidth === '58mm' ? 'thermal-width-58mm' : 'thermal-width-80mm';

  // Order Details
  const items = order.items || [];
  const orderNumber = String(order.orderNumber || order._id || '').replace(/^#/, '');
  const orderType = (order.orderType || 'dine_in').toUpperCase().replace('_', '-');
  const tableNum =
    order.tableNumber ||
    (order.tableId && typeof order.tableId === 'object'
      ? order.tableId.tableNumber
      : order.tableId || '');

  // Timestamps
  const now = new Date();
  const printTimeFormatted = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  const printDateFormatted = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const createdAt = order.createdAt ? new Date(order.createdAt) : null;
  const orderTimeFormatted = createdAt
    ? createdAt.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : null;

  // Active kitchen items calculation
  const totalKitchenDishes = items.reduce((sum, item) => {
    const qty = Number(item.quantity || 0);
    const cQty = Number(item.cancelledQuantity || 0);
    return sum + Math.max(0, qty - cQty);
  }, 0);

  const orderNote = (
    order.order_instructions ||
    order.orderInstructions ||
    order.notes ||
    ''
  ).trim();

  return (
    <div
      className={`thermal-paper-printable ${widthClass} thermal-font bg-white text-black text-[12px] leading-tight select-none thermal-paper-shadow relative mx-auto my-4 p-4`}
      style={{
        boxSizing: 'border-box',
        color: '#000000',
        backgroundColor: '#ffffff',
      }}
    >
      {/* Decorative receipt tear top for screen preview */}
      <div className="receipt-tear-top h-2 w-full absolute -top-2 left-0 no-print" />

      {/* ================================================================
          1. KOT HEADER
          ================================================================ */}
      <div className="text-center thermal-keep-together">
        <div className="text-[11px] font-bold tracking-widest text-black/70">
          *** KITCHEN ORDER TICKET ***
        </div>
        <h1 className="font-black text-[18px] tracking-wider uppercase my-0.5">
          {effectiveRestaurant.name || 'KITCHEN PASS'}
        </h1>
        <div className="text-[10px] uppercase font-semibold">
          KOT PRINT #{orderNumber.slice(-4) || '1'}
        </div>
      </div>

      <div className="thermal-double-dash" />

      {/* ================================================================
          2. HIGH-PRIORITY TABLE & TICKET IDENTIFIER
          ================================================================ */}
      <div className="thermal-keep-together">
        {/* Giant Table / Token Box */}
        <div className="border-2 border-black p-2 my-1 text-center bg-black/5">
          <div className="flex justify-between items-center px-1">
            <span className="text-[12px] font-bold uppercase">{orderType}</span>
            <span className="text-[12px] font-bold">ORD #{orderNumber}</span>
          </div>

          <div className="text-[22px] font-black tracking-tight my-0.5">
            {tableNum ? `TABLE: ${tableNum}` : `TOKEN #${order.tokenNumber || '---'}`}
          </div>

          {tableNum && order.tokenNumber && (
            <div className="text-[11px] font-bold">
              TOKEN: #{order.tokenNumber}
            </div>
          )}
        </div>

        {/* Timestamps & Server info */}
        <div className="text-[10px] space-y-0.5 pt-1">
          <div className="flex justify-between">
            <span>KOT PRINT TIME:</span>
            <span className="font-bold">{printDateFormatted} {printTimeFormatted}</span>
          </div>
          {orderTimeFormatted && (
            <div className="flex justify-between">
              <span>ORDER PLACED:</span>
              <span>{orderTimeFormatted}</span>
            </div>
          )}
          {(order.serverName || order.captainName || order.billedBy) && (
            <div className="flex justify-between">
              <span>CAPTAIN / SERVER:</span>
              <span className="font-semibold uppercase">
                {order.serverName || order.captainName || order.billedBy}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="thermal-dash" />

      {/* ================================================================
          3. KITCHEN ITEMS LIST (STRICTLY NO PRICING)
          ================================================================ */}
      <div className="thermal-keep-together">
        <div className="flex justify-between font-extrabold text-[11px] pb-1 border-b border-dashed border-black">
          <span className="w-12 text-left">QTY</span>
          <span className="flex-1 text-left">ITEM & INSTRUCTIONS</span>
        </div>

        <div className="divide-y divide-dashed divide-black/40 text-[12px]">
          {items.map((item, index) => {
            const totalQty = Number(item.quantity || 0);
            const cancelledQty = Number(item.cancelledQuantity || 0);
            const remainingQty = Math.max(0, totalQty - cancelledQty);
            const isFullyCancelled = remainingQty <= 0 && cancelledQty > 0;
            const isPartialCancelled = remainingQty > 0 && cancelledQty > 0;
            const isLiquor = (item.itemType || '').toLowerCase() === 'liquor';
            const note = (
              item.cookingNote ||
              item.specialInstructions ||
              item.notes ||
              item.instruction ||
              ''
            ).trim();

            return (
              <div
                key={item._id || index}
                className={`py-1.5 ${
                  isFullyCancelled
                    ? 'line-through opacity-50 bg-red-50/50'
                    : ''
                }`}
              >
                <div className="flex items-start">
                  {/* Quantity Indicator */}
                  <div className="w-12 text-left">
                    <span className="inline-block font-black text-[14px] border-2 border-black px-1.5 py-0.5 rounded-sm">
                      {isFullyCancelled ? '0X' : `${remainingQty}X`}
                    </span>
                  </div>

                  {/* Item Description */}
                  <div className="flex-1 pl-1">
                    <div className="font-extrabold text-[13px] uppercase leading-tight">
                      {item.name}
                      {isLiquor && ' [BAR / LIQUOR]'}
                    </div>

                    {/* Cancellation Alert */}
                    {isFullyCancelled && (
                      <div className="text-[10px] font-bold text-red-600 border border-red-600 px-1 inline-block mt-0.5">
                        CANCELLED - DO NOT PREPARE
                      </div>
                    )}

                    {isPartialCancelled && (
                      <div className="text-[10px] font-bold text-red-600 mt-0.5">
                        * {cancelledQty} of {totalQty} cancelled (PREPARE ONLY {remainingQty})
                      </div>
                    )}

                    {/* Spice / Add-ons / Variants */}
                    {(item.spiceLevel?.name || (item.addOns && item.addOns.length > 0)) && (
                      <div className="text-[10px] font-bold text-black/90 mt-0.5 pl-1">
                        {item.spiceLevel?.name && (
                          <div>• SPICE: {item.spiceLevel.name.toUpperCase()}</div>
                        )}
                        {item.addOns?.map((addon, aIdx) => (
                          <div key={aIdx}>• ADD-ON: {addon.name.toUpperCase()}</div>
                        ))}
                      </div>
                    )}

                    {/* Kitchen Cooking Note */}
                    {note && (
                      <div className="border border-black bg-black/5 p-1 text-[10px] font-bold mt-1 text-black">
                        &gt;&gt; NOTE: {note.toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="thermal-dash" />

      {/* ================================================================
          4. OVERALL KITCHEN MEMO / SPECIAL INSTRUCTIONS
          ================================================================ */}
      {orderNote && (
        <div className="thermal-keep-together my-1">
          <div className="border-2 border-dashed border-black p-2 bg-yellow-50/60">
            <div className="font-black text-[11px] uppercase tracking-wide mb-0.5">
              *** SPECIAL KITCHEN MEMO ***
            </div>
            <div className="text-[11px] font-bold uppercase leading-snug">
              {orderNote}
            </div>
          </div>
          <div className="thermal-dash" />
        </div>
      )}

      {/* ================================================================
          5. KITCHEN SUMMARY & FOOTER
          ================================================================ */}
      <div className="text-center pt-1 thermal-keep-together">
        <div className="font-bold text-[12px] flex justify-between px-2">
          <span>TOTAL DISHES TO PREPARE:</span>
          <span className="font-black text-[14px]">{totalKitchenDishes}</span>
        </div>

        <div className="text-[10px] font-bold tracking-widest text-black/60 my-2">
          ================================
        </div>

        <div className="font-black text-[12px] tracking-wider uppercase">
          *** END OF KITCHEN TICKET ***
        </div>
        <div className="text-[9px] text-black/60 mt-1">
          Kitchen Dispatch Pass • POS Realtime Ticket
        </div>
      </div>

      {/* Decorative receipt tear bottom for screen preview */}
      <div className="receipt-tear-bottom h-2 w-full absolute -bottom-2 left-0 no-print" />
    </div>
  );
}
