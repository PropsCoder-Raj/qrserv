import React from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { detectCurrency } from '../utils/orderHelper';

/**
 * Paroso-Style Digital Bill Component
 * Formatted for 80mm / 58mm thermal receipt paper roll standards.
 * Provides crisp monospace typography, dashed dividers, full financial breakdown,
 * store details, and payment/settlement information.
 */
export default function ThermalReceipt({
  order,
  restaurant = {},
  paperWidth = '80mm',
  customerInfoEnabled = true,
  currency,
}) {
  if (!order) return null;

  const effectiveRestaurant =
    restaurant && (restaurant.name || restaurant.address)
      ? restaurant
      : order?.restaurantId && typeof order.restaurantId === 'object'
        ? order.restaurantId
        : restaurant || {};

  const widthClass = paperWidth === '58mm' ? 'thermal-width-58mm' : 'thermal-width-80mm';
  const is58mm = paperWidth === '58mm';

  // Currency symbol or code auto-detected dynamically from restaurant or order
  const currencySymbol = currency || detectCurrency(effectiveRestaurant, order);

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
  const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
  const dateFormatted = createdAt.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeFormatted = createdAt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Customer Data (with masking if required)
  const maskString = (str) => {
    if (!str || typeof str !== 'string') return '';
    if (str.length <= 4) return '***';
    return `${str.slice(0, 2)}***${str.slice(-2)}`;
  };

  const rawCustomerName = order.customerName || '';
  const rawCustomerPhone = order.customerPhone || '';
  const customerName = customerInfoEnabled ? rawCustomerName : maskString(rawCustomerName);
  const customerPhone = customerInfoEnabled ? rawCustomerPhone : maskString(rawCustomerPhone);

  // Financial calculations
  const subtotal = Number(order.subtotalAmount || 0);
  const totalAmount = Number(order.totalAmount || 0);

  // Discounts
  const couponDiscount = Number(order.couponDiscountAmount || 0);
  const manualDiscount =
    Number(order.manualDiscountAmount ?? order.manual_discount_amount) || 0;
  const manualReason = order.manualDiscountReason || order.manual_discount_reason || '';
  const totalDiscount = Number(order.discountAmount || 0) || (couponDiscount + manualDiscount);

  // Taxes
  const cgstAmount = Number(order.cgstAmount || 0);
  const sgstAmount = Number(order.sgstAmount || 0);
  const vatAmount = Number(order.vatAmount || 0);
  const taxAmount = Number(order.taxAmount || 0);
  const cgstRate = Number(order.cgstRate || 0);
  const sgstRate = Number(order.sgstRate || 0);
  const vatRate = Number(order.vatRate || 0);
  const taxRate = Number(order.taxRate || 0);

  // Total active quantities
  const totalQuantity = items.reduce((sum, item) => {
    const qty = Number(item.quantity || 0);
    const cQty = Number(item.cancelledQuantity || 0);
    return sum + Math.max(0, qty - cQty);
  }, 0);

  // Payment info
  const paymentStatus = (order.paymentStatus || 'pending').toUpperCase();
  const paymentMethod = (order.paymentMethod || 'CASH').toUpperCase();
  const isPaid = paymentStatus === 'PAID';
  const isCancelled = ['CANCELLED', 'CANCELED'].includes((order.status || '').toUpperCase());

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
          1. RESTAURANT / STORE HEADER
          ================================================================ */}
      <div className="text-center thermal-keep-together">
        <h1 className="font-extrabold text-[16px] tracking-wider uppercase mb-0.5">
          {effectiveRestaurant.name || 'POS RESTAURANT'}
        </h1>

        {effectiveRestaurant.receipt_header_note && (
          <p className="text-[11px] font-medium italic mb-1">
            {effectiveRestaurant.receipt_header_note}
          </p>
        )}

        {effectiveRestaurant.cr_number && (
          <p className="text-[10px]">CR No: {effectiveRestaurant.cr_number}</p>
        )}

        {effectiveRestaurant.address && (
          <p className="text-[10px] whitespace-pre-line leading-snug px-1">
            {effectiveRestaurant.address}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-x-2 text-[10px] mt-0.5">
          {effectiveRestaurant.phone && <span>Ph: {effectiveRestaurant.phone}</span>}
          {effectiveRestaurant.gst_no && <span>GST: {effectiveRestaurant.gst_no}</span>}
          {effectiveRestaurant.vat_no && <span>VAT: {effectiveRestaurant.vat_no}</span>}
        </div>
      </div>

      <div className="thermal-dash" />

      {/* ================================================================
          2. BILL & ORDER META
          ================================================================ */}
      <div className="text-[11px] space-y-0.5 thermal-keep-together">
        <div className="flex justify-between font-bold">
          <span>INVOICE: #{orderNumber}</span>
          <span className="border border-black px-1 text-[10px] uppercase">
            {orderType}
          </span>
        </div>

        <div className="flex justify-between text-[10px]">
          <span>DATE: {dateFormatted}</span>
          <span>TIME: {timeFormatted}</span>
        </div>

        {tableNum ? (
          <div className="flex justify-between font-bold text-[12px]">
            <span>TABLE: {tableNum}</span>
            {order.tokenNumber && <span>TOKEN: #{order.tokenNumber}</span>}
          </div>
        ) : (
          order.tokenNumber && (
            <div className="font-bold text-[12px]">
              <span>TOKEN: #{order.tokenNumber}</span>
            </div>
          )
        )}

        {order.billedBy || order.serverName || order.captainName ? (
          <div className="text-[10px]">
            <span>SERVER: {order.billedBy || order.serverName || order.captainName}</span>
          </div>
        ) : null}

        {(customerName || customerPhone) && (
          <div className="text-[10px] pt-0.5">
            {customerName && <div>CUST: {customerName}</div>}
            {customerPhone && <div>PHONE: {customerPhone}</div>}
          </div>
        )}
      </div>

      <div className="thermal-dash" />

      {/* ================================================================
          3. ITEMIZED TABLE
          ================================================================ */}
      <div className="thermal-keep-together">
        {/* Table Column Headers */}
        <div className="flex justify-between font-bold text-[10px] pb-1 border-b border-dashed border-black">
          <span className="flex-1 text-left">ITEM</span>
          <span className="w-8 text-center">QTY</span>
          {!is58mm && <span className="w-14 text-right">RATE</span>}
          <span className="w-16 text-right">AMOUNT</span>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-dashed divide-black/30 text-[11px]">
          {items.map((item, index) => {
            const qty = Number(item.quantity || 0);
            const cancelledQty = Number(item.cancelledQuantity || 0);
            const remainingQty = Math.max(0, qty - cancelledQty);
            const unitPrice = Number(item.price || item.unitPrice || 0);
            const itemTotal = Number(item.totalPrice || unitPrice * (remainingQty || qty));
            const isFullyCancelled = remainingQty <= 0 && cancelledQty > 0;
            const isPartialCancelled = remainingQty > 0 && cancelledQty > 0;
            const isLiquor = (item.itemType || '').toLowerCase() === 'liquor';

            return (
              <div
                key={item._id || index}
                className={`py-1 ${isFullyCancelled ? 'opacity-60 line-through' : ''}`}
              >
                {/* Item Line */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 text-left pr-1">
                    <span className="font-semibold uppercase">
                      {item.name}
                      {isLiquor && ' [L]'}
                    </span>
                    {isFullyCancelled && (
                      <span className="ml-1 text-[9px] font-bold text-red-600 border border-red-600 px-0.5">
                        CANCELLED
                      </span>
                    )}
                  </div>
                  <span className="w-8 text-center font-bold">
                    {isPartialCancelled ? `${remainingQty} (${qty})` : (remainingQty || qty)}
                  </span>
                  {!is58mm && (
                    <span className="w-14 text-right text-[10px]">
                      {formatCurrency(unitPrice)}
                    </span>
                  )}
                  <span className="w-16 text-right font-medium">
                    {formatCurrency(isFullyCancelled ? 0 : itemTotal)}
                  </span>
                </div>

                {/* Variants / Addons */}
                {(item.spiceLevel?.name || (item.addOns && item.addOns.length > 0)) && (
                  <div className="text-[9px] pl-2 text-black/80">
                    {item.spiceLevel?.name && (
                      <div>+ Spice: {item.spiceLevel.name}</div>
                    )}
                    {item.addOns?.map((addon, aIdx) => (
                      <div key={aIdx}>
                        + {addon.name}
                        {Number(addon.priceDelta || 0) > 0 &&
                          ` (${currencySymbol}${formatCurrency(addon.priceDelta)})`}
                      </div>
                    ))}
                  </div>
                )}

                {/* Item Notes */}
                {(item.cookingNote || item.specialInstructions || item.notes) && (
                  <div className="text-[9px] pl-2 italic text-black/70">
                    * {item.cookingNote || item.specialInstructions || item.notes}
                  </div>
                )}

                {/* Cancellation notice */}
                {isPartialCancelled && (
                  <div className="text-[9px] pl-2 text-red-600">
                    * {cancelledQty} qty cancelled
                    {item.cancelReason && ` (${item.cancelReason})`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="thermal-dash" />

      {/* ================================================================
          4. FINANCIAL BREAKDOWN & TAXES
          ================================================================ */}
      <div className="text-[11px] space-y-0.5 thermal-keep-together">
        {/* Subtotal */}
        <div className="flex justify-between">
          <span>SUBTOTAL:</span>
          <span>{currencySymbol} {formatCurrency(subtotal || (totalAmount + totalDiscount))}</span>
        </div>

        {/* Coupon Discount */}
        {couponDiscount > 0 && (
          <div className="flex justify-between text-[10px]">
            <span>COUPON {order.couponCode ? `(${order.couponCode})` : ''}:</span>
            <span>- {currencySymbol} {formatCurrency(couponDiscount)}</span>
          </div>
        )}

        {/* Manual Discount */}
        {manualDiscount > 0 && (
          <div className="flex justify-between text-[10px]">
            <span>DISCOUNT {manualReason ? `(${manualReason})` : ''}:</span>
            <span>- {currencySymbol} {formatCurrency(manualDiscount)}</span>
          </div>
        )}

        {/* Taxes Breakdown */}
        {cgstAmount > 0 && (
          <div className="flex justify-between text-[10px]">
            <span>CGST {cgstRate > 0 ? `(${cgstRate}%)` : ''}:</span>
            <span>{currencySymbol} {formatCurrency(cgstAmount)}</span>
          </div>
        )}

        {sgstAmount > 0 && (
          <div className="flex justify-between text-[10px]">
            <span>SGST {sgstRate > 0 ? `(${sgstRate}%)` : ''}:</span>
            <span>{currencySymbol} {formatCurrency(sgstAmount)}</span>
          </div>
        )}

        {vatAmount > 0 && (
          <div className="flex justify-between text-[10px]">
            <span>VAT {vatRate > 0 ? `(${vatRate}%)` : ''}:</span>
            <span>{currencySymbol} {formatCurrency(vatAmount)}</span>
          </div>
        )}

        {taxAmount > 0 && cgstAmount === 0 && vatAmount === 0 && (
          <div className="flex justify-between text-[10px]">
            <span>TAX {taxRate > 0 ? `(${taxRate}%)` : ''}:</span>
            <span>{currencySymbol} {formatCurrency(taxAmount)}</span>
          </div>
        )}

        {cgstAmount === 0 && sgstAmount === 0 && vatAmount === 0 && taxAmount === 0 && (
          <div className="flex justify-between text-[10px]">
            <span>
              TAX {effectiveRestaurant.taxRate > 0 ? `(${effectiveRestaurant.taxRate}%)` : '(0%)'}:
            </span>
            <span>{currencySymbol} {formatCurrency(0)}</span>
          </div>
        )}

        {(order.taxType || effectiveRestaurant.taxType) && (
          <div className="text-[9px] text-black/60 italic text-right">
            * Tax: {(order.taxType || effectiveRestaurant.taxType).toUpperCase()}
          </div>
        )}
      </div>

      <div className="thermal-double-dash" />

      {/* ================================================================
          5. GRAND TOTAL BANNER
          ================================================================ */}
      <div className="thermal-keep-together">
        <div className="flex items-center justify-between font-extrabold text-[15px] py-0.5">
          <span>TOTAL:</span>
          <span className="text-[17px] tracking-tight">
            {currencySymbol} {formatCurrency(totalAmount)}
          </span>
        </div>

        <div className="flex justify-between text-[10px] text-black/80 font-medium">
          <span>Total Items: {items.length}</span>
          <span>Total Qty: {totalQuantity}</span>
        </div>
      </div>

      <div className="thermal-dash" />

      {/* ================================================================
          6. PAYMENT & SETTLEMENT STATUS
          ================================================================ */}
      <div className="text-[11px] thermal-keep-together space-y-0.5">
        <div className="flex justify-between items-center font-bold">
          <span>PAYMENT STATUS:</span>
          <span
            className={`border px-1 text-[10px] tracking-wide ${
              isPaid
                ? 'border-black bg-black text-white'
                : isCancelled
                  ? 'border-red-600 text-red-600'
                  : 'border-black text-black'
            }`}
          >
            {isCancelled ? 'CANCELLED' : isPaid ? 'PAID / SETTLED' : paymentStatus}
          </span>
        </div>

        <div className="flex justify-between text-[10px]">
          <span>MODE: {paymentMethod}</span>
          {order.paymentId && <span>REF: {String(order.paymentId).slice(-8)}</span>}
        </div>
      </div>

      {/* Order Instructions (if any) */}
      {(order.order_instructions || order.orderInstructions || order.notes) && (
        <>
          <div className="thermal-dash" />
          <div className="text-[10px] thermal-keep-together">
            <span className="font-bold">NOTES: </span>
            <span className="italic">
              {order.order_instructions || order.orderInstructions || order.notes}
            </span>
          </div>
        </>
      )}

      <div className="thermal-dash" />

      {/* ================================================================
          7. BARCODE & FOOTER
          ================================================================ */}
      <div className="text-center pt-1 space-y-1 thermal-keep-together">
        {/* Simulated Thermal POS Barcode */}
        <div className="mx-auto my-1 w-3/4 h-8 barcode-stripes" />
        <div className="text-[9px] tracking-widest uppercase">
          *{orderNumber}*
        </div>

        <p className="font-bold text-[11px] uppercase tracking-wide">
          THANK YOU FOR DINING WITH US!
        </p>
        <p className="text-[9px] text-black/70">
          Please visit again • No refund without receipt
        </p>
        <p className="text-[8px] text-black/50">
          POS Bill • {dateFormatted} {timeFormatted}
        </p>
      </div>

      {/* Decorative receipt tear bottom for screen preview */}
      <div className="receipt-tear-bottom h-2 w-full absolute -bottom-2 left-0 no-print" />
    </div>
  );
}
