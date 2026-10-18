import { jsPDF } from 'jspdf';
import { formatCurrency, roundTo3 } from './formatCurrency';

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
  const longItemNameHeight = items.reduce((extraHeight, item) => {
    const labelLength = getItemLabel(item).length;
    const extraLines = Math.max(0, Math.ceil(labelLength / ITEM_NAME_CHARS_PER_LINE) - 1);

    return extraHeight + extraLines * 3.5;
  }, 0);

  const headerNoteLines = restaurant.receipt_header_note
    ? Math.ceil(restaurant.receipt_header_note.length / ITEM_NAME_CHARS_PER_LINE)
    : 0;
  const addressLinesCount = restaurant.address
    ? Math.ceil(restaurant.address.length / ITEM_NAME_CHARS_PER_LINE)
    : 0;
  const extraHeaderHeight =
    headerNoteLines * 3.5 +
    (restaurant.cr_number ? 4 : 0) +
    addressLinesCount * 3.5 +
    (restaurant.phone || restaurant.gst_no || restaurant.vat_no ? 4 : 0);

  const orderNum = String(order.orderNumber || '');
  const orderIdText = orderNum.startsWith('#')
    ? `Order ID: ${orderNum}`
    : `Order ID: #${orderNum}`;
  const orderIdExtraLines = Math.max(0, Math.ceil(orderIdText.length / ITEM_NAME_CHARS_PER_LINE) - 1);
  const custName = order.customerName || '';
  const customerExtraLines = Math.max(0, Math.ceil(`Customer: ${custName}`.length / ITEM_NAME_CHARS_PER_LINE) - 1);
  const tableNumber = getTableNumber(order);
  const extraOrderMetaHeight =
    orderIdExtraLines * 3.5 +
    customerExtraLines * 3.5 +
    (order.customerPhone ? 4 : 0) +
    (tableNumber ? 4 : 0);

  const pageHeight =
    75 +
    extraHeaderHeight +
    extraOrderMetaHeight +
    itemCount * (hasTax ? 16 : 12) +
    longItemNameHeight +
    (hasGst ? 16 : 0) +
    (hasVat ? 12 : 0);

  const doc = new jsPDF({
    unit: 'mm',
    format: [PAGE_WIDTH, pageHeight],
  });

  let y = 6;
  const centerX = PAGE_WIDTH / 2;

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
      while (leftStr.length > 0 && doc.getTextWidth(leftStr + '...') > maxLeftWidth) {
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
  addCenteredText(restaurant.name || 'Restaurant', 9, 'bold');
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
    const taxContactLines = doc.splitTextToSize(parts.join(' | '), CONTENT_WIDTH);
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

  const rawStatus = order.status || 'served';
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

  const gstIncl = hasGst && (order.taxType || 'exclusive') === 'inclusive';
  const vatIncl = hasVat && (order.vatType || 'exclusive') === 'inclusive';
  const rate = order.taxRate || 0;
  const cgstR = order.cgstRate || 0;
  const sgstR = order.sgstRate || 0;
  const vatR = order.vatRate || 0;

  items.forEach((item) => {
    const totalQty = Number(item.quantity || 0);
    const cancelledQty = Number(item.cancelledQuantity || 0);
    const remainingQty = Math.max(0, totalQty - cancelledQty);
    const amount = roundTo3(item.price * remainingQty);
    const isLiquor = (item.itemType || 'food') === 'liquor';

    addWrappedLeftText(getItemLabel(item), 7, 'bold');
    addLeftRight(`  ${remainingQty} x ${formatCurrency(item.price)}`, formatCurrency(amount));

    if (cancelledQty > 0) {
      addLeftText(`  Cancelled: ${cancelledQty}/${totalQty}`, 6);
      if (item.cancelReason) {
        addLeftText(`  Reason: ${String(item.cancelReason).slice(0, 28)}`, 6);
      }
    }

    if (isLiquor && hasVat) {
      const base = vatIncl
        ? roundTo3(amount / (1 + vatR / 100))
        : amount;
      const itemVat = vatIncl
        ? roundTo3(amount - base)
        : roundTo3((base * vatR) / 100);
      addLeftText(`  Base:${formatCurrency(base)} VAT:${formatCurrency(itemVat)}`, 6);
    } else if (!isLiquor && hasGst) {
      const base = gstIncl
        ? roundTo3(amount / (1 + rate / 100))
        : amount;
      let itemCgst;
      let itemSgst;
      if (gstIncl) {
        const tax = roundTo3(amount - base);
        itemCgst = roundTo3(tax / 2);
        itemSgst = roundTo3(tax - itemCgst);
      } else {
        itemCgst = roundTo3((base * cgstR) / 100);
        itemSgst = roundTo3((base * sgstR) / 100);
      }
      addLeftText(`  Base:${formatCurrency(base)} C:${formatCurrency(itemCgst)} S:${formatCurrency(itemSgst)}`, 6);
    }
  });

  addDashLine();
  if (hasGst) {
    addLeftRight('FOOD SUBTOTAL', `Rs.${formatCurrency(order.foodSubtotal || 0)}`, 8);
    if (gstIncl) addLeftText('INCL. GST BREAKUP:', 7);
    addLeftRight(`CGST (${cgstR}%)`, `Rs.${formatCurrency(order.cgstAmount || 0)}`, 8);
    addLeftRight(`SGST (${sgstR}%)`, `Rs.${formatCurrency(order.sgstAmount || 0)}`, 8);
  }
  if (hasVat) {
    addLeftRight('LIQUOR SUBTOTAL', `Rs.${formatCurrency(order.liquorSubtotal || 0)}`, 8);
    if (vatIncl) addLeftText('INCL. VAT BREAKUP:', 7);
    addLeftRight(`VAT (${vatR}%)`, `Rs.${formatCurrency(order.vatAmount || 0)}`, 8);
  }
  if (order.discountAmount && Number(order.discountAmount) > 0) {
    addLeftRight(
      order.couponCode ? `DISCOUNT (${order.couponCode})` : 'DISCOUNT',
      `-Rs.${formatCurrency(order.discountAmount)}`,
      8,
    );
  }

  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.text('TOTAL', MARGIN, y);
  doc.text(`Rs.${formatCurrency(order.totalAmount)}`, PAGE_WIDTH - MARGIN, y, { align: 'right' });
  y += 4.5;

  addLeftRight('Payment:', order.paymentStatus || 'pending');
  addDashLine();
  y += 1;
  addCenteredText('Thank you! Visit again', 7, 'bold');

  doc.save(`bill-${order.orderNumber}.pdf`);
}
