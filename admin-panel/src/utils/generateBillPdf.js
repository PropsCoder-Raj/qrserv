import { jsPDF } from 'jspdf';
import { formatCurrency, roundTo3 } from './formatCurrency.js';
import { computeTaxBreakdown } from './tax.js';

const getRestaurant = (order, customRestaurant = {}) => {
  if (customRestaurant && Object.keys(customRestaurant).length > 0) {
    return customRestaurant;
  }
  const restaurant = order?.restaurantId;
  return restaurant && typeof restaurant === 'object' ? restaurant : {};
};

const getTableNumber = (order) => {
  const table = order?.tableId;
  if (!table) return '';
  if (typeof table === 'object') return table.tableNumber || '';
  return String(table || '');
};

/**
 * Generate Invoice / Bill PDF using jsPDF (identical to customer-app with 58mm, 80mm, and A4 support)
 * @param {Object} order - Full order object
 * @param {Object} customRestaurant - Optional restaurant metadata override
 * @param {Object} options - { paperWidth: '58mm' | '80mm' | 'a4', currency: string, autoPrint: boolean }
 */
export default function generateBillPdf(order, customRestaurant = {}, options = {}) {
  const restaurant = getRestaurant(order, customRestaurant);
  const paperFormat = options.paperWidth || '58mm';
  const isA4 = paperFormat === 'a4';
  const is80mm = paperFormat === '80mm';

  if (isA4) {
    return generateA4BillPdf(order, restaurant, options);
  }

  const PAGE_WIDTH = is80mm ? 80 : 58;
  const MARGIN = is80mm ? 5 : 4;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
  const CHARS_PER_LINE = is80mm ? 42 : 32;
  const DASH_LINE = '-'.repeat(CHARS_PER_LINE);

  const items = order.items || [];
  const itemCount = items.length;
  const hasGst = (order.cgstAmount || 0) > 0 || (order.sgstAmount || 0) > 0;
  const hasVat = (order.vatAmount || 0) > 0;
  const hasTax = hasGst || hasVat;

  const getItemLabel = (item) => {
    const totalQty = Number(item.quantity || 0);
    const cancelledQty = Number(item.cancelledQuantity || 0);
    const remainingQty = Math.max(0, totalQty - cancelledQty);
    const isLiquor = (item.itemType || 'food') === 'liquor';
    const isFullyCancelled = remainingQty <= 0 && cancelledQty > 0;

    return (
      item.name +
      (isLiquor ? ' [L]' : '') +
      (isFullyCancelled ? ' [CANCELLED]' : '')
    );
  };

  const longItemNameHeight = items.reduce((extraHeight, item) => {
    const labelLength = getItemLabel(item).length;
    const extraLines = Math.max(
      0,
      Math.ceil(labelLength / CHARS_PER_LINE) - 1,
    );
    return extraHeight + extraLines * 3.5;
  }, 0);

  const headerNoteLines = restaurant.receipt_header_note
    ? Math.ceil(restaurant.receipt_header_note.length / CHARS_PER_LINE)
    : 0;
  const addressLinesCount = restaurant.address
    ? Math.ceil(restaurant.address.length / CHARS_PER_LINE)
    : 0;
  const extraHeaderHeight =
    headerNoteLines * 3.5 +
    (restaurant.cr_number ? 4 : 0) +
    addressLinesCount * 3.5 +
    (restaurant.phone || restaurant.gst_no || restaurant.vat_no ? 4 : 0);

  const orderNum = String(order.orderNumber || order._id || '');
  const orderIdText = orderNum.startsWith('#')
    ? `Order ID: ${orderNum}`
    : `Order ID: #${orderNum}`;
  const orderIdExtraLines = Math.max(
    0,
    Math.ceil(orderIdText.length / CHARS_PER_LINE) - 1,
  );
  const custName = order.customerName || '';
  const customerExtraLines = Math.max(
    0,
    Math.ceil(`Customer: ${custName}`.length / CHARS_PER_LINE) - 1,
  );
  const tableNumber = getTableNumber(order);
  const extraOrderMetaHeight =
    orderIdExtraLines * 3.5 +
    customerExtraLines * 3.5 +
    (order.customerPhone ? 4 : 0) +
    (tableNumber ? 4 : 0);

  const orderNote = (
    order.order_instructions ||
    order.orderInstructions ||
    order.notes ||
    ''
  ).trim();
  const orderNoteLines = orderNote
    ? Math.ceil(orderNote.length / CHARS_PER_LINE)
    : 0;
  const extraOrderNoteHeight = orderNote ? orderNoteLines * 3.5 + 8 : 0;
  const itemNotesHeight = items.reduce((acc, it) => {
    const n = (it.cookingNote || it.specialInstructions || it.notes || '').trim();
    return acc + (n ? Math.ceil(n.length / CHARS_PER_LINE) * 3 + 3 : 0);
  }, 0);

  const manualAmtEst =
    Number(order.manualDiscountAmount ?? order.manual_discount_amount) || 0;
  const manualReasonEst =
    order.manualDiscountReason || order.manual_discount_reason || '';

  const pageHeight = Math.max(
    100,
    75 +
      extraHeaderHeight +
      extraOrderMetaHeight +
      itemCount * (hasTax ? 16 : 12) +
      longItemNameHeight +
      extraOrderNoteHeight +
      itemNotesHeight +
      (hasGst ? 16 : 0) +
      (hasVat ? 12 : 0) +
      (manualAmtEst > 0 ? 10 : 0) +
      (manualReasonEst ? 6 : 0),
  );

  const doc = new jsPDF({
    unit: 'mm',
    format: [PAGE_WIDTH, pageHeight],
  });

  // Solid pure white background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, PAGE_WIDTH, pageHeight, 'F');
  doc.setTextColor(0, 0, 0);

  let y = 6;
  const centerX = PAGE_WIDTH / 2;
  const currSym = options.currency || 'Rs.';

  const addCenteredText = (text, size, style = 'normal') => {
    doc.setFontSize(size);
    doc.setFont('courier', style);
    doc.text(String(text || ''), centerX, y, { align: 'center' });
    y += size * 0.4 + 0.5;
  };

  const addLeftRight = (left, right, size = 7) => {
    doc.setFontSize(size);
    doc.setFont('courier', 'normal');
    const rightStr = String(right || '');
    const maxLeftWidth = CONTENT_WIDTH - (doc.getTextWidth(rightStr) + 2);
    let leftStr = String(left || '');
    if (doc.getTextWidth(leftStr) > maxLeftWidth) {
      while (
        leftStr.length > 0 &&
        doc.getTextWidth(leftStr + '...') > maxLeftWidth
      ) {
        leftStr = leftStr.slice(0, -1);
      }
      leftStr += '...';
    }
    doc.text(leftStr, MARGIN, y);
    doc.text(rightStr, PAGE_WIDTH - MARGIN, y, { align: 'right' });
    y += size * 0.4 + 0.5;
  };

  const addLeftText = (text, size = 7, style = 'normal') => {
    doc.setFontSize(size);
    doc.setFont('courier', style);
    doc.text(String(text || ''), MARGIN, y);
    y += size * 0.4 + 0.5;
  };

  const addWrappedLeftText = (text, size = 7, style = 'normal') => {
    doc.setFontSize(size);
    doc.setFont('courier', style);
    const lines = doc.splitTextToSize(String(text || ''), CONTENT_WIDTH);
    doc.text(lines, MARGIN, y);
    y += lines.length * (size * 0.4 + 0.5);
  };

  const addDashLine = () => addCenteredText(DASH_LINE, 7);

  // --- Restaurant Header ---
  addCenteredText(restaurant.name || 'Restaurant', is80mm ? 10 : 9, 'bold');
  if (restaurant.receipt_header_note) {
    const noteLines = doc.splitTextToSize(
      String(restaurant.receipt_header_note),
      CONTENT_WIDTH,
    );
    noteLines.forEach((line) => {
      addCenteredText(line, 6.5, 'normal');
    });
  }
  if (restaurant.cr_number) {
    addCenteredText(`CR No: ${restaurant.cr_number}`, 6.5, 'normal');
  }
  if (restaurant.address) {
    const addressLines = doc.splitTextToSize(
      String(restaurant.address),
      CONTENT_WIDTH,
    );
    addressLines.forEach((line) => {
      addCenteredText(line, 6.5, 'normal');
    });
  }
  if (restaurant.phone || restaurant.gst_no || restaurant.vat_no) {
    const parts = [];
    if (restaurant.phone) parts.push(`Ph: ${restaurant.phone}`);
    if (restaurant.gst_no) parts.push(`GST: ${restaurant.gst_no}`);
    if (restaurant.vat_no) parts.push(`VAT: ${restaurant.vat_no}`);
    const taxContactLines = doc.splitTextToSize(
      parts.join(' | '),
      CONTENT_WIDTH,
    );
    taxContactLines.forEach((line) => {
      addCenteredText(line, 6, 'normal');
    });
  }

  // --- Order Info ---
  addDashLine();
  const dateObj = order.createdAt ? new Date(order.createdAt) : new Date();
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  const dateStr = `${day}/${month}/${year}`;

  addWrappedLeftText(orderIdText, 7, 'normal');

  const rawStatus = order.status || 'completed';
  const statusFormatted =
    rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
  const statusText = `Status: ${statusFormatted}`;
  addLeftRight(`Date: ${dateStr}`, statusText, 7);

  const customerName = order.customerName || '';
  if (customerName) {
    addWrappedLeftText(`Customer: ${customerName}`, 7, 'normal');
  } else {
    addWrappedLeftText('Customer: -', 7, 'normal');
  }

  if (order.customerPhone) {
    addWrappedLeftText(`Customer Phone: ${order.customerPhone}`, 7, 'normal');
  }

  if (tableNumber) {
    addWrappedLeftText(`Table: ${tableNumber}`, 7, 'normal');
  }

  addDashLine();
  addLeftRight('ITEM', 'AMT', 7);
  addDashLine();

  const taxSettings = {
    taxEnabled: (order.taxRate || 0) > 0,
    taxRate: order.taxRate,
    taxType: order.taxType,
    vatEnabled: (order.vatRate || 0) > 0,
    vatRate: order.vatRate,
    vatType: order.vatType,
  };

  const itemTaxLine = (item, remainingQty) =>
    computeTaxBreakdown(taxSettings, [
      {
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: remainingQty,
        gstRate: item.gstRate,
        vatRate: item.vatRate,
      },
    ]).lines[0];

  items.forEach((item) => {
    const totalQty = Number(item.quantity || 0);
    const cancelledQty = Number(item.cancelledQuantity || 0);
    const remainingQty = Math.max(0, totalQty - cancelledQty);
    const amount = roundTo3(item.price * remainingQty);

    addWrappedLeftText(getItemLabel(item), 7, 'bold');
    addLeftRight(
      `  ${remainingQty} x ${formatCurrency(item.price)}`,
      formatCurrency(amount),
    );

    const itemNote = (
      item.cookingNote ||
      item.specialInstructions ||
      item.notes ||
      ''
    ).trim();
    if (itemNote) {
      addWrappedLeftText(`  Note: ${itemNote}`, 6, 'italic');
    }

    if (cancelledQty > 0) {
      addLeftText(`  Cancelled: ${cancelledQty}/${totalQty}`, 6);
      if (item.cancelReason) {
        addLeftText(`  Reason: ${String(item.cancelReason).slice(0, 28)}`, 6);
      }
    }

    const itemTax = itemTaxLine(item, remainingQty);
    if (itemTax) {
      addLeftText(`  Base:${formatCurrency(itemTax.taxableBase)}`, 6);
      if (itemTax.gstAmount > 0) {
        addLeftText(
          `  GST ${item.gstRate}%: ${formatCurrency(itemTax.gstAmount)}`,
          6,
        );
      }
      if (itemTax.vatAmount > 0) {
        addLeftText(
          `  VAT ${item.vatRate}%: ${formatCurrency(itemTax.vatAmount)}`,
          6,
        );
      }
    }
  });

  addDashLine();
  const gstGroups = order.gstBreakdown || [];
  const vatGroups = order.vatBreakdown || [];
  addLeftRight(
    'TAXABLE SUBTOTAL',
    `${currSym}${formatCurrency(order.subtotalAmount || 0)}`,
    8,
  );

  if (gstGroups.length > 0) {
    gstGroups.forEach((g) => {
      addLeftRight(
        `GST (${g.rate}%)`,
        `${currSym}${formatCurrency(g.taxAmount || 0)}`,
        8,
      );
    });
  } else if (hasGst) {
    addLeftRight('CGST', `${currSym}${formatCurrency(order.cgstAmount || 0)}`, 8);
    addLeftRight('SGST', `${currSym}${formatCurrency(order.sgstAmount || 0)}`, 8);
  }

  vatGroups.forEach((g) => {
    addLeftRight(
      `VAT (${g.rate}%)`,
      `${currSym}${formatCurrency(g.taxAmount || 0)}`,
      8,
    );
  });

  if (order.taxAmount > 0) {
    addLeftRight('TOTAL TAX', `${currSym}${formatCurrency(order.taxAmount)}`, 8);
  }

  // Discounts
  const manualAmt =
    Number(order.manualDiscountAmount ?? order.manual_discount_amount) || 0;
  const manualType = (
    order.manualDiscountType ||
    order.manual_discount_type ||
    ''
  ).toUpperCase();
  const manualVal =
    order.manualDiscountValue ?? order.manual_discount_value;
  const manualReason =
    order.manualDiscountReason || order.manual_discount_reason || '';
  const couponAmt = Math.max(
    0,
    roundTo3((Number(order.discountAmount) || 0) - manualAmt),
  );

  if (couponAmt > 0) {
    addLeftRight(
      order.couponCode ? `COUPON (${order.couponCode})` : 'COUPON DISCOUNT',
      `-${currSym}${formatCurrency(couponAmt)}`,
      8,
    );
  }

  if (manualAmt > 0) {
    const label =
      manualType === 'PERCENTAGE'
        ? `MANUAL DISC (${manualVal}%)`
        : 'MANUAL DISCOUNT';
    addLeftRight(label, `-${currSym}${formatCurrency(manualAmt)}`, 8);
    if (manualReason) {
      addLeftText(`  Reason: ${String(manualReason).slice(0, 26)}`, 6);
    }
  }

  if (couponAmt === 0 && manualAmt === 0 && Number(order.discountAmount) > 0) {
    addLeftRight(
      order.couponCode ? `DISCOUNT (${order.couponCode})` : 'DISCOUNT',
      `-${currSym}${formatCurrency(order.discountAmount)}`,
      8,
    );
  }

  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.text('TOTAL', MARGIN, y);
  doc.text(
    `${currSym}${formatCurrency(order.totalAmount)}`,
    PAGE_WIDTH - MARGIN,
    y,
    { align: 'right' },
  );
  y += 4.5;

  addLeftRight(
    'Payment:',
    `${(order.paymentStatus || 'pending').toUpperCase()} • ${order.paymentMethod || 'CASH'}`,
  );

  if (orderNote) {
    addDashLine();
    addCenteredText('*** SPECIAL INSTRUCTIONS ***', 7, 'bold');
    addWrappedLeftText(orderNote, 6.5, 'normal');
  }

  addDashLine();
  y += 1;
  addCenteredText('Thank you! Visit again', 7, 'bold');

  if (options.autoPrint) {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  } else {
    doc.save(`bill-${order.orderNumber || order._id}.pdf`);
  }

  return doc;
}

/**
 * A4 Standard Full-Page Invoice PDF generator
 */
function generateA4BillPdf(order, restaurant, options = {}) {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4', // 210 x 297 mm
  });

  // Solid pure white background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 297, 'F');
  doc.setTextColor(30, 41, 59);

  const currSym = options.currency || 'Rs.';
  let y = 15;

  // Header banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(restaurant.name || 'INVOICE', 15, y);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  if (restaurant.receipt_header_note) {
    y += 5;
    doc.text(restaurant.receipt_header_note, 15, y);
  }
  if (restaurant.address) {
    y += 5;
    doc.text(restaurant.address, 15, y);
  }

  const taxDetails = [];
  if (restaurant.phone) taxDetails.push(`Phone: ${restaurant.phone}`);
  if (restaurant.cr_number) taxDetails.push(`CR No: ${restaurant.cr_number}`);
  if (restaurant.gst_no) taxDetails.push(`GST: ${restaurant.gst_no}`);
  if (restaurant.vat_no) taxDetails.push(`VAT: ${restaurant.vat_no}`);
  if (taxDetails.length > 0) {
    y += 5;
    doc.text(taxDetails.join('  |  '), 15, y);
  }

  // Invoice Meta (Right side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('TAX INVOICE', 195, 15, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const dateObj = order.createdAt ? new Date(order.createdAt) : new Date();
  doc.text(`Invoice #: ${order.orderNumber || order._id}`, 195, 22, { align: 'right' });
  doc.text(`Date: ${dateObj.toLocaleDateString('en-GB')}`, 195, 27, { align: 'right' });
  doc.text(`Payment: ${(order.paymentStatus || 'pending').toUpperCase()} (${order.paymentMethod || 'CASH'})`, 195, 32, { align: 'right' });

  // Divider
  y = Math.max(y + 8, 40);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(15, y, 195, y);

  // Customer / Order details box
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Bill To:', 15, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Customer: ${order.customerName || 'Guest'}`, 15, y + 5);
  if (order.customerPhone) {
    doc.text(`Phone: ${order.customerPhone}`, 15, y + 10);
  }

  const tableNumber = getTableNumber(order);
  const metaRight = [];
  metaRight.push(`Order Type: ${(order.orderType || 'Dine In').toUpperCase().replace('_', ' ')}`);
  if (tableNumber) metaRight.push(`Table: ${tableNumber}`);
  metaRight.push(`Status: ${(order.status || 'completed').toUpperCase()}`);

  metaRight.forEach((line, idx) => {
    doc.text(line, 195, y + 5 + idx * 5, { align: 'right' });
  });

  // Table header
  y += 22;
  doc.setFillColor(248, 250, 252);
  doc.rect(15, y - 4, 180, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('#', 18, y + 1);
  doc.text('Item Description', 28, y + 1);
  doc.text('Qty', 115, y + 1, { align: 'center' });
  doc.text('Rate', 145, y + 1, { align: 'right' });
  doc.text('Amount', 190, y + 1, { align: 'right' });

  // Table rows
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  const items = order.items || [];
  items.forEach((item, index) => {
    const totalQty = Number(item.quantity || 0);
    const cancelledQty = Number(item.cancelledQuantity || 0);
    const remainingQty = Math.max(0, totalQty - cancelledQty);
    const amount = roundTo3(item.price * remainingQty);

    doc.text(String(index + 1), 18, y);
    doc.text(String(item.name || ''), 28, y);
    doc.text(String(remainingQty), 115, y, { align: 'center' });
    doc.text(`${currSym}${formatCurrency(item.price)}`, 145, y, { align: 'right' });
    doc.text(`${currSym}${formatCurrency(amount)}`, 190, y, { align: 'right' });

    y += 6;
  });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(15, y, 195, y);
  y += 6;

  // Financial Summary (Right aligned)
  const addSummaryRow = (label, val, isBold = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(isBold ? 11 : 9);
    doc.setTextColor(isBold ? 15 : 71, isBold ? 23 : 85, isBold ? 42 : 105);
    doc.text(label, 145, y, { align: 'right' });
    doc.text(val, 190, y, { align: 'right' });
    y += isBold ? 7 : 5;
  };

  addSummaryRow('Subtotal:', `${currSym}${formatCurrency(order.subtotalAmount || 0)}`);

  if (order.cgstAmount > 0 || order.sgstAmount > 0) {
    addSummaryRow('CGST:', `${currSym}${formatCurrency(order.cgstAmount || 0)}`);
    addSummaryRow('SGST:', `${currSym}${formatCurrency(order.sgstAmount || 0)}`);
  }
  if (order.vatAmount > 0) {
    addSummaryRow('VAT:', `${currSym}${formatCurrency(order.vatAmount || 0)}`);
  }
  if (order.discountAmount > 0) {
    addSummaryRow('Discount:', `-${currSym}${formatCurrency(order.discountAmount)}`);
  }

  y += 2;
  doc.setDrawColor(15, 23, 42);
  doc.line(135, y - 2, 195, y - 2);
  addSummaryRow('Grand Total:', `${currSym}${formatCurrency(order.totalAmount)}`, true);

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Thank you for your business! Generated by QRServe System.', 105, 285, { align: 'center' });

  if (options.autoPrint) {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  } else {
    doc.save(`invoice-${order.orderNumber || order._id}.pdf`);
  }

  return doc;
}
