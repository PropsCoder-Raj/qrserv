import { jsPDF } from 'jspdf';
import { formatCurrency, roundTo3 } from './formatCurrency';
import { computeTaxBreakdown } from './tax';

const PAGE_WIDTH = 58;
const MARGIN = 4;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const DASH_LINE = '-'.repeat(32);
const ITEM_NAME_CHARS_PER_LINE = 32;

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
  return '';
};

export default function generateBillPdf(order, customRestaurant = {}) {
  const restaurant = getRestaurant(order, customRestaurant);
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

    return item.name + (isLiquor ? ' [L]' : '') + (isFullyCancelled ? ' [CANCELLED]' : '');
  };
  const lineStep = 3.8;
  const longItemNameHeight = items.reduce((extraHeight, item) => {
    const labelLength = getItemLabel(item).length;
    const extraLines = Math.max(0, Math.ceil(labelLength / ITEM_NAME_CHARS_PER_LINE) - 1);

    return extraHeight + extraLines * lineStep;
  }, 0);

  const headerNoteLines = restaurant.receipt_header_note
    ? Math.ceil(restaurant.receipt_header_note.length / ITEM_NAME_CHARS_PER_LINE)
    : 0;
  const addressLinesCount = restaurant.address
    ? Math.ceil(restaurant.address.length / ITEM_NAME_CHARS_PER_LINE)
    : 0;
  const extraHeaderHeight =
    headerNoteLines * lineStep +
    (restaurant.cr_number ? 4.5 : 0) +
    addressLinesCount * lineStep +
    (restaurant.phone || restaurant.gst_no || restaurant.vat_no ? 4.5 : 0);

  const orderNum = String(order.orderNumber || '');
  const orderIdText = orderNum.startsWith('#')
    ? `Order ID: ${orderNum}`
    : `Order ID: #${orderNum}`;
  const orderIdExtraLines = Math.max(0, Math.ceil(orderIdText.length / ITEM_NAME_CHARS_PER_LINE) - 1);
  const custName = order.customerName || '';
  const customerExtraLines = Math.max(0, Math.ceil(`Customer: ${custName}`.length / ITEM_NAME_CHARS_PER_LINE) - 1);
  const tableNumber = getTableNumber(order);
  const extraOrderMetaHeight =
    orderIdExtraLines * lineStep +
    customerExtraLines * lineStep +
    (order.customerPhone ? 4.5 : 0) +
    (tableNumber ? 4.5 : 0);

  const orderNote = (order.order_instructions || order.orderInstructions || order.notes || '').trim();
  const orderNoteLines = orderNote ? Math.ceil(orderNote.length / ITEM_NAME_CHARS_PER_LINE) : 0;
  const extraOrderNoteHeight = orderNote ? (orderNoteLines * lineStep + 9) : 0;
  const itemNotesHeight = items.reduce((acc, it) => {
    const n = (it.cookingNote || it.specialInstructions || it.notes || '').trim();
    return acc + (n ? (Math.ceil(n.length / ITEM_NAME_CHARS_PER_LINE) * 3.5 + 3.5) : 0);
  }, 0);

  const pageHeight = Math.max(
    110,
    85 +
      extraHeaderHeight +
      extraOrderMetaHeight +
      itemCount * (hasTax ? 18 : 14) +
      longItemNameHeight +
      extraOrderNoteHeight +
      itemNotesHeight +
      (hasGst ? 18 : 0) +
      (hasVat ? 14 : 0),
  );

  const doc = new jsPDF({
    unit: 'mm',
    format: [PAGE_WIDTH, pageHeight],
  });

  // Solid pure white background and pure black bold ink for thermal/scanner clarity
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, PAGE_WIDTH, pageHeight, 'F');
  doc.setTextColor(0, 0, 0);

  let y = 6;
  const centerX = PAGE_WIDTH / 2;
  const baseFontSize = 7.5;
  const subFontSize = 7;

  const addCenteredText = (text, size = baseFontSize, style = 'bold') => {
    doc.setFontSize(size);
    doc.setFont('courier', style);
    doc.text(String(text || ''), centerX, y, { align: 'center' });
    y += size * 0.42 + 0.6;
  };

  const addLeftRight = (left, right, size = baseFontSize, style = 'bold') => {
    doc.setFontSize(size);
    doc.setFont('courier', style);
    const rightStr = String(right || '');
    const maxLeftWidth = CONTENT_WIDTH - (doc.getTextWidth(rightStr) + 2);
    let leftStr = String(left || '');
    if (doc.getTextWidth(leftStr) > maxLeftWidth) {
      while (leftStr.length > 0 && doc.getTextWidth(leftStr + '...') > maxLeftWidth) {
        leftStr = leftStr.slice(0, -1);
      }
      leftStr += '...';
    }
    doc.text(leftStr, MARGIN, y);
    doc.text(rightStr, PAGE_WIDTH - MARGIN, y, { align: 'right' });
    y += size * 0.42 + 0.6;
  };

  const addLeftText = (text, size = baseFontSize, style = 'bold') => {
    doc.setFontSize(size);
    doc.setFont('courier', style);
    doc.text(String(text || ''), MARGIN, y);
    y += size * 0.42 + 0.6;
  };

  const addWrappedLeftText = (text, size = baseFontSize, style = 'bold') => {
    doc.setFontSize(size);
    doc.setFont('courier', style);
    const lines = doc.splitTextToSize(String(text || ''), CONTENT_WIDTH);
    doc.text(lines, MARGIN, y);
    y += lines.length * (size * 0.42 + 0.6);
  };

  const addDashLine = () => addCenteredText(DASH_LINE, subFontSize, 'bold');

  // --- Restaurant Header ---
  addCenteredText(restaurant.name || 'Restaurant', 10, 'bold');
  if (restaurant.receipt_header_note) {
    const noteLines = doc.splitTextToSize(
      String(restaurant.receipt_header_note),
      CONTENT_WIDTH,
    );
    noteLines.forEach((line) => {
      addCenteredText(line, subFontSize, 'bold');
    });
  }
  if (restaurant.cr_number) {
    addCenteredText(`CR No: ${restaurant.cr_number}`, subFontSize, 'bold');
  }
  if (restaurant.address) {
    const addressLines = doc.splitTextToSize(
      String(restaurant.address),
      CONTENT_WIDTH,
    );
    addressLines.forEach((line) => {
      addCenteredText(line, subFontSize, 'bold');
    });
  }
  if (restaurant.phone || restaurant.gst_no || restaurant.vat_no) {
    const parts = [];
    if (restaurant.phone) parts.push(`Ph: ${restaurant.phone}`);
    if (restaurant.gst_no) parts.push(`GST: ${restaurant.gst_no}`);
    if (restaurant.vat_no) parts.push(`VAT: ${restaurant.vat_no}`);
    const taxContactLines = doc.splitTextToSize(parts.join(' | '), CONTENT_WIDTH);
    taxContactLines.forEach((line) => {
      addCenteredText(line, subFontSize, 'bold');
    });
  }

  // --- Order Info ---
  addDashLine();
  const dateObj = order.createdAt ? new Date(order.createdAt) : new Date();
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  const dateStr = `${day}/${month}/${year}`;

  addWrappedLeftText(orderIdText, baseFontSize, 'bold');

  const rawStatus = order.status || 'completed';
  const statusFormatted =
    rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
  const statusText = `Status: ${statusFormatted}`;
  addLeftRight(`Date: ${dateStr}`, statusText, baseFontSize, 'bold');

  const customerName = order.customerName || '';
  if (customerName) {
    addWrappedLeftText(`Customer: ${customerName}`, baseFontSize, 'bold');
  } else {
    addWrappedLeftText('Customer: -', baseFontSize, 'bold');
  }

  if (order.customerPhone) {
    addWrappedLeftText(`Customer Phone: ${order.customerPhone}`, baseFontSize, 'bold');
  }

  if (tableNumber) {
    addWrappedLeftText(`Table: ${tableNumber}`, baseFontSize, 'bold');
  }

  addDashLine();
  addLeftRight('ITEM', 'AMT', baseFontSize, 'bold');
  addDashLine();

  const taxSettings = {
    taxEnabled: (order.taxRate || 0) > 0,
    taxRate: order.taxRate,
    taxType: order.taxType,
    vatEnabled: (order.vatRate || 0) > 0,
    vatRate: order.vatRate,
    vatType: order.vatType,
  };
  const itemTaxLine = (item, remainingQty) => computeTaxBreakdown(taxSettings, [{
    menuItemId: item.menuItemId,
    name: item.name,
    price: item.price,
    quantity: remainingQty,
    gstRate: item.gstRate,
    vatRate: item.vatRate,
  }]).lines[0];

  items.forEach((item) => {
    const totalQty = Number(item.quantity || 0);
    const cancelledQty = Number(item.cancelledQuantity || 0);
    const remainingQty = Math.max(0, totalQty - cancelledQty);
    const amount = roundTo3(item.price * remainingQty);

    addWrappedLeftText(getItemLabel(item), baseFontSize, 'bold');
    addLeftRight(`  ${remainingQty} x ${formatCurrency(item.price)}`, formatCurrency(amount), baseFontSize, 'bold');

    const itemNote = (item.cookingNote || item.specialInstructions || item.notes || '').trim();
    if (itemNote) {
      addWrappedLeftText(`  Note: ${itemNote}`, subFontSize, 'bold');
    }

    if (cancelledQty > 0) {
      addLeftText(`  Cancelled: ${cancelledQty}/${totalQty}`, subFontSize, 'bold');
      if (item.cancelReason) {
        addLeftText(`  Reason: ${String(item.cancelReason).slice(0, 28)}`, subFontSize, 'bold');
      }
    }

    const itemTax = itemTaxLine(item, remainingQty);
    if (itemTax) {
      addLeftText(`  Base:${formatCurrency(itemTax.taxableBase)}`, subFontSize, 'bold');
      if (itemTax.gstAmount > 0) {
        addLeftText(`  GST ${item.gstRate}%: ${formatCurrency(itemTax.gstAmount)}`, subFontSize, 'bold');
      }
      if (itemTax.vatAmount > 0) {
        addLeftText(`  VAT ${item.vatRate}%: ${formatCurrency(itemTax.vatAmount)}`, subFontSize, 'bold');
      }
    }
  });

  addDashLine();
  const gstGroups = order.gstBreakdown || [];
  const vatGroups = order.vatBreakdown || [];
  addLeftRight('TAXABLE SUBTOTAL', `Rs.${formatCurrency(order.subtotalAmount || 0)}`, 8, 'bold');
  if (gstGroups.length > 0) {
    gstGroups.forEach((g) => {
      addLeftRight(`GST (${g.rate}%)`, `Rs.${formatCurrency(g.taxAmount || 0)}`, 8, 'bold');
    });
  } else if (hasGst) {
    addLeftRight('CGST', `Rs.${formatCurrency(order.cgstAmount || 0)}`, 8, 'bold');
    addLeftRight('SGST', `Rs.${formatCurrency(order.sgstAmount || 0)}`, 8, 'bold');
  }
  vatGroups.forEach((g) => {
    addLeftRight(`VAT (${g.rate}%)`, `Rs.${formatCurrency(g.taxAmount || 0)}`, 8, 'bold');
  });
  if (order.taxAmount > 0) {
    addLeftRight('TOTAL TAX', `Rs.${formatCurrency(order.taxAmount)}`, 8, 'bold');
  }
  if (order.discountAmount && Number(order.discountAmount) > 0) {
    addLeftRight(
      order.couponCode ? `DISCOUNT (${order.couponCode})` : 'DISCOUNT',
      `-Rs.${formatCurrency(order.discountAmount)}`,
      8,
      'bold',
    );
  }

  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.text('TOTAL', MARGIN, y);
  doc.text(`Rs.${formatCurrency(order.totalAmount)}`, PAGE_WIDTH - MARGIN, y, { align: 'right' });
  y += 5;

  addLeftRight('Payment:', order.paymentStatus || 'pending', baseFontSize, 'bold');

  if (orderNote) {
    addDashLine();
    addCenteredText('*** SPECIAL INSTRUCTIONS ***', baseFontSize, 'bold');
    addWrappedLeftText(orderNote, subFontSize, 'bold');
  }

  addDashLine();
  y += 1;
  addCenteredText('Thank you! Visit again', baseFontSize, 'bold');

  doc.save(`bill-${order.orderNumber}.pdf`);
}
