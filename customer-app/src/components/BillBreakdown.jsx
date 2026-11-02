import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiChevronDown,
  HiChevronUp,
  HiTag,
  HiTruck,
  HiReceiptTax,
  HiCheckCircle,
  HiInformationCircle,
} from 'react-icons/hi';
import { formatCurrency } from '../utils/formatCurrency.js';

/**
 * Reusable, scannable Bill Breakdown component used across both
 * Cart Section and Order Details/Summary Section.
 *
 * Ensures 2-decimal consistency, clean line items, subtle borders,
 * and explicit VAT & GST calculation breakdown (CGST/SGST/IGST).
 */
export default function BillBreakdown({
  breakdown,
  title = 'Bill Summary',
  currencySymbol = '',
  showItemsList = false,
  isReceipt = false,
  defaultExpanded = true,
  vatNo = '',
  gstNo = '',
  paymentMethod,
  paymentStatus,
  className = '',
}) {
  const [taxesExpanded, setTaxesExpanded] = useState(defaultExpanded);
  const [itemsExpanded, setItemsExpanded] = useState(false);

  if (!breakdown) return null;

  const {
    itemGrossTotal = 0,
    taxableSubtotal = 0,
    totalItemCount = 0,
    lines = [],
    discounts = {},
    taxes = {},
    fees = {},
    grandTotal = 0,
    savingsAmount = 0,
  } = breakdown;

  const {
    hasTax = false,
    totalTaxAmount = 0,
    taxMode = 'inclusive',
    gst = {},
    vat = {},
  } = taxes;

  const {
    hasDiscount = false,
    coupon = null,
    manualDiscount = null,
  } = discounts;

  const {
    hasFees = false,
    deliveryFee = 0,
    isDelivery = false,
    isDeliveryFree = false,
    platformFee = 0,
  } = fees;

  const formatPrice = (amount) => {
    const formatted = formatCurrency(amount, 2);
    return currencySymbol ? `${currencySymbol}${formatted}` : formatted;
  };

  const hasVat = vat.enabled && (vat.totalAmount > 0 || vat.groups?.length > 0 || vat.defaultRate > 0);
  const hasGst = gst.enabled && (gst.totalAmount > 0 || gst.groups?.length > 0 || gst.defaultRate > 0);

  return (
    <div
      className={`rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs transition-shadow ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/80">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary">
            <HiReceiptTax size={16} />
          </div>
          <h3 className="text-sm font-bold text-text tracking-tight">{title}</h3>
        </div>
        {totalItemCount > 0 && (
          <span className="rounded-full bg-surface-cool px-2.5 py-0.5 text-[11px] font-semibold text-text-secondary border border-border/60">
            {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      <div className="pt-3 space-y-2.5 text-sm">
        {/* Optional Itemized List (if showItemsList is enabled) */}
        {showItemsList && lines.length > 0 && (
          <div className="pb-2 border-b border-border/60">
            <button
              type="button"
              onClick={() => setItemsExpanded((prev) => !prev)}
              className="flex w-full items-center justify-between py-1 text-xs font-semibold text-text-secondary hover:text-text transition-colors"
            >
              <span>Items Breakdown ({lines.length})</span>
              <span className="flex items-center gap-1 text-[11px] text-primary">
                {itemsExpanded ? 'Hide' : 'Show'}
                {itemsExpanded ? <HiChevronUp size={14} /> : <HiChevronDown size={14} />}
              </span>
            </button>

            <AnimatePresence>
              {itemsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden pt-2 space-y-2"
                >
                  {lines.map((line, idx) => (
                    <div
                      key={line.menuItemId || idx}
                      className="flex items-start justify-between text-xs py-1 px-2 rounded-lg bg-surface-cool/50"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="font-medium text-text truncate">
                          {line.name} <span className="text-text-light font-normal">x {line.quantity}</span>
                        </div>
                        {(line.spiceLevel?.name || (line.addOns && line.addOns.length > 0)) && (
                          <div className="text-[10.5px] text-text-light truncate">
                            {[line.spiceLevel?.name, ...(line.addOns || []).map((a) => a.name)]
                              .filter(Boolean)
                              .join(', ')}
                          </div>
                        )}
                        {line.cookingNote && (
                          <div className="text-[10px] text-amber-700 italic">
                            Note: {line.cookingNote}
                          </div>
                        )}
                        {(line.vatAmount > 0 || line.gstAmount > 0) && (
                          <div className="text-[10px] text-text-light space-x-1.5 mt-0.5">
                            {line.vatAmount > 0 && (
                              <span className="text-purple-700 font-medium">VAT ({line.vatRate}%): {formatPrice(line.vatAmount)}</span>
                            )}
                            {line.gstAmount > 0 && (
                              <span className="text-primary font-medium">GST ({line.gstRate}%): {formatPrice(line.gstAmount)}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right font-semibold text-text shrink-0">
                        {formatPrice(line.grossAmount)}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* 1. Item Total / Subtotal */}
        <div className="flex items-center justify-between text-text-secondary">
          <div className="flex items-center gap-1.5">
            <span>Item Total</span>
            <span className="text-xs text-text-light font-normal">
              ({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'})
            </span>
          </div>
          <span className="font-semibold text-text">{formatPrice(itemGrossTotal)}</span>
        </div>

        {/* 2. Discounts & Coupons (if applied) */}
        {hasDiscount && (
          <div className="space-y-1.5 py-1">
            {coupon && (
              <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-500">
                <div className="flex items-center gap-1.5">
                  <HiTag size={15} className="shrink-0" />
                  <span className="font-medium">Coupon Discount</span>
                  <span className="rounded-md bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    {coupon.code}
                  </span>
                </div>
                <span className="font-bold">-{formatPrice(coupon.amount)}</span>
              </div>
            )}

            {manualDiscount && (
              <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-500">
                <div className="flex items-center gap-1.5">
                  <HiTag size={15} className="shrink-0" />
                  <span className="font-medium">
                    Discount {manualDiscount.reason ? `(${manualDiscount.reason})` : ''}
                  </span>
                </div>
                <span className="font-bold">-{formatPrice(manualDiscount.amount)}</span>
              </div>
            )}

            {/* Savings Callout Pill */}
            {savingsAmount > 0 && (
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200/80 px-2.5 py-1.5 text-xs text-emerald-800">
                <span className="flex items-center gap-1 font-medium">
                  🎉 Total Savings Applied
                </span>
                <span className="font-bold text-emerald-900">
                  {formatPrice(savingsAmount)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 3. Explicit Tax Line Items: GST & VAT */}
        {hasGst && gst.totalAmount > 0 && (
          <div className="flex items-center justify-between text-text-secondary">
            <div className="flex items-center gap-1.5">
              <span>GST</span>
              {gst.groups?.length > 0 && (
                <span className="rounded-md bg-primary-50 border border-primary/20 px-1.5 py-0.2 text-[10px] font-bold text-primary">
                  {gst.groups.map((g) => `${g.rate}%`).join(', ')}
                </span>
              )}
              <span className="text-[10px] text-text-light">
                ({gst.taxType === 'inclusive' ? 'Incl.' : 'Addl.'})
              </span>
            </div>
            <span className="font-semibold text-text">{formatPrice(gst.totalAmount)}</span>
          </div>
        )}

        {/* Dedicated VAT Line Item */}
        {hasVat && vat.totalAmount > 0 && (
          <div className="flex items-center justify-between text-purple-900 bg-purple-50/70 border border-purple-200/80 rounded-xl px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span className="font-bold">VAT</span>
              {vat.groups?.length > 0 ? (
                <span className="rounded-md bg-purple-100 border border-purple-300 px-1.5 py-0.2 text-[10px] font-bold text-purple-800">
                  {vat.groups.map((g) => `${g.rate}%`).join(', ')}
                </span>
              ) : vat.defaultRate > 0 ? (
                <span className="rounded-md bg-purple-100 border border-purple-300 px-1.5 py-0.2 text-[10px] font-bold text-purple-800">
                  {vat.defaultRate}%
                </span>
              ) : null}
              <span className="text-[10px] font-medium text-purple-700">
                ({vat.taxType === 'inclusive' ? 'Included' : 'Added'})
              </span>
            </div>
            <span className="font-extrabold text-purple-950">{formatPrice(vat.totalAmount)}</span>
          </div>
        )}

        {/* 4. Collapsible Tax Breakdown (Bases, CGST/SGST Split & Applicable Items) */}
        {hasTax && (
          <div className="rounded-xl border border-border/80 bg-surface-cool/40 overflow-hidden">
            {/* Accordion Trigger */}
            <button
              type="button"
              onClick={() => setTaxesExpanded((prev) => !prev)}
              className="flex w-full items-center justify-between p-2.5 text-left transition hover:bg-surface-cool/70 focus:outline-none"
              aria-expanded={taxesExpanded}
            >
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-text-secondary">
                <span>Tax Breakdown & Details</span>
                {hasVat && vat.totalAmount > 0 && (
                  <span className="rounded bg-purple-100 text-purple-800 px-1.5 py-0.2 text-[9.5px] font-bold uppercase">
                    VAT Applied
                  </span>
                )}
                {hasGst && gst.totalAmount > 0 && (
                  <span className="rounded bg-primary-100 text-primary px-1.5 py-0.2 text-[9.5px] font-bold uppercase">
                    GST Applied
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 font-semibold text-xs text-text-secondary shrink-0 ml-2">
                <span>Total Tax: {formatPrice(totalTaxAmount)}</span>
                <motion.span
                  animate={{ rotate: taxesExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-text-light"
                >
                  <HiChevronDown size={15} />
                </motion.span>
              </div>
            </button>

            {/* Collapsible Content */}
            <AnimatePresence>
              {taxesExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  className="overflow-hidden border-t border-border/80 bg-surface/95 px-3.5 py-3 text-xs space-y-3"
                >
                  {/* Taxable Subtotal Base */}
                  <div className="flex items-center justify-between text-text-light font-medium pb-1 border-b border-border/50">
                    <span>Taxable Subtotal Base</span>
                    <span className="font-semibold text-text">{formatPrice(taxableSubtotal)}</span>
                  </div>

                  {/* VAT Details Section */}
                  {hasVat && (
                    <div className="space-y-1.5 pt-0.5">
                      <div className="flex items-center justify-between font-bold text-purple-900">
                        <span className="flex items-center gap-1">
                          <span>Value Added Tax (VAT)</span>
                          <span className="rounded bg-purple-100 px-1 py-0.2 text-[9.5px] text-purple-800 font-semibold">
                            {vat.taxType === 'inclusive' ? 'Inclusive' : 'Exclusive'}
                          </span>
                        </span>
                        <span>{formatPrice(vat.totalAmount)}</span>
                      </div>

                      <div className="pl-2 space-y-1.5 text-text-secondary">
                        <div className="flex justify-between text-[11px] text-text-light">
                          <span>VAT Taxable Base:</span>
                          <span className="font-medium text-text">{formatPrice(vat.taxableBase)}</span>
                        </div>

                        {vat.groups?.length > 0 ? (
                          vat.groups.map((group) => (
                            <div
                              key={`vat-${group.rate}`}
                              className="rounded-lg bg-purple-50/60 p-2 space-y-1 text-[11.5px] border border-purple-100"
                            >
                              <div className="flex justify-between font-medium text-purple-900">
                                <span>VAT Rate @ {group.rate}%</span>
                                <span className="font-bold">{formatPrice(group.taxAmount)}</span>
                              </div>
                              <div className="flex justify-between text-[11px] text-purple-700/80">
                                <span>↳ Base Amount:</span>
                                <span>{formatPrice(group.base)}</span>
                              </div>

                              {group.items && group.items.length > 0 && (
                                <div className="text-[10.5px] text-purple-800 pt-0.5 border-t border-purple-100/60">
                                  <span className="font-semibold">Items: </span>
                                  <span>{group.items.join(', ')}</span>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="flex justify-between text-[11px] text-text-light">
                            <span>Rate: {vat.defaultRate}%</span>
                            <span>{formatPrice(vat.totalAmount)}</span>
                          </div>
                        )}

                        {vatNo && (
                          <div className="text-[10.5px] text-purple-800 font-medium">
                            VAT Reg. No: <span className="font-bold">{vatNo}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* GST Details Section */}
                  {hasGst && (
                    <div className="space-y-1.5 pt-2 border-t border-border/50">
                      <div className="flex items-center justify-between font-bold text-primary">
                        <span className="flex items-center gap-1">
                          <span>Goods & Services Tax (GST)</span>
                          <span className="rounded bg-primary-50 px-1 py-0.2 text-[9.5px] text-primary font-semibold">
                            {gst.taxType === 'inclusive' ? 'Inclusive' : 'Exclusive'}
                          </span>
                        </span>
                        <span>{formatPrice(gst.totalAmount)}</span>
                      </div>

                      <div className="pl-2 space-y-1.5 text-text-secondary">
                        <div className="flex justify-between text-[11px] text-text-light">
                          <span>GST Taxable Base:</span>
                          <span className="font-medium text-text">{formatPrice(gst.taxableBase)}</span>
                        </div>

                        {gst.groups?.map((group) => {
                          const isInterstate = gst.splitMode === 'igst';
                          return (
                            <div
                              key={`gst-${group.rate}`}
                              className="rounded-lg bg-surface-cool/60 p-2 space-y-1 text-[11.5px] border border-border/40"
                            >
                              <div className="flex justify-between font-medium text-text">
                                <span>GST Rate @ {group.rate}%</span>
                                <span className="font-bold">{formatPrice(group.taxAmount)}</span>
                              </div>

                              {isInterstate ? (
                                <div className="flex justify-between text-[11px] text-text-light pl-2">
                                  <span>↳ IGST ({group.rate}%):</span>
                                  <span>{formatPrice(group.taxAmount)}</span>
                                </div>
                              ) : (
                                <div className="space-y-0.5 text-[11px] text-text-light pl-2">
                                  <div className="flex justify-between">
                                    <span>↳ Central GST (CGST {group.cgstRate}%):</span>
                                    <span>{formatPrice(group.cgstAmount)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>↳ State GST (SGST {group.sgstRate}%):</span>
                                    <span>{formatPrice(group.sgstAmount)}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {gstNo && (
                          <div className="text-[10.5px] text-primary font-medium">
                            GSTIN: <span className="font-bold">{gstNo}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Microcopy */}
                  <div className="flex items-center gap-1 text-[10.5px] text-text-light pt-1 border-t border-border/50">
                    <HiInformationCircle size={13} className="shrink-0 text-text-secondary" />
                    <span>
                      {taxMode === 'inclusive'
                        ? 'Item prices include all applicable taxes (itemized above).'
                        : 'Applicable taxes are added on top of item base prices.'}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* 5. Delivery & Platform Fees */}
        {hasFees && (
          <div className="space-y-1.5 pt-1">
            {/* Delivery Fee */}
            {(isDelivery || deliveryFee > 0) && (
              <div className="flex items-center justify-between text-text-secondary">
                <div className="flex items-center gap-1.5">
                  <HiTruck size={16} className="text-text-light shrink-0" />
                  <span>Delivery Fee</span>
                </div>
                {isDeliveryFree ? (
                  <span className="rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider">
                    FREE
                  </span>
                ) : (
                  <span className="font-semibold text-text">{formatPrice(deliveryFee)}</span>
                )}
              </div>
            )}

            {/* Platform / Convenience Fee */}
            {platformFee > 0 && (
              <div className="flex items-center justify-between text-text-secondary">
                <div className="flex items-center gap-1.5">
                  <span>Platform Fee</span>
                </div>
                <span className="font-semibold text-text">{formatPrice(platformFee)}</span>
              </div>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="pt-2">
          <div className="border-t border-dashed border-border" />
        </div>

        {/* 6. Grand Total / Final Payable Amount */}
        <div className="flex items-baseline justify-between pt-1">
          <div>
            <span className="text-base font-extrabold text-text tracking-tight">
              {isReceipt ? 'Total Paid' : 'Grand Total'}
            </span>
            <p className="text-[11px] text-text-light font-normal">
              {taxMode === 'inclusive' ? 'Inclusive of all taxes & charges' : 'Final payable amount (including taxes & fees)'}
            </p>
          </div>
          <div className="text-right">
            <span className="text-lg sm:text-xl font-extrabold text-primary">
              {formatPrice(grandTotal)}
            </span>
          </div>
        </div>

        {/* 7. Receipt Status / Payment Metadata (for Order Details) */}
        {isReceipt && (
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-surface-cool p-3 text-xs border border-border/60">
            <div>
              <span className="text-[11px] text-text-light block">Payment Method</span>
              <span className="font-semibold text-text">
                {paymentMethod?.toUpperCase() === 'CARD'
                  ? 'Credit / Debit Card'
                  : paymentMethod?.toUpperCase() === 'ONLINE'
                    ? 'Online Payment'
                    : 'Cash on Counter'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-text-light block">Payment Status</span>
              <span
                className={`mt-0.5 inline-flex items-center gap-1 font-semibold ${
                  paymentStatus === 'paid'
                    ? 'text-emerald-700'
                    : paymentStatus === 'failed'
                      ? 'text-danger'
                      : 'text-amber-700'
                }`}
              >
                {paymentStatus === 'paid' && <HiCheckCircle size={13} />}
                <span className="capitalize">{paymentStatus || 'Pending'}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
