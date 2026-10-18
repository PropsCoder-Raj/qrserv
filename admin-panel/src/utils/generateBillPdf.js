import { jsPDF } from 'jspdf';
import { formatCurrency, roundTo3 } from './formatCurrency';

const PAGE_WIDTH = 58; // mm (2-inch thermal receipt)
const MARGIN = 4; // mm side margins
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2; // usable width
const DASH_LINE = '-'.repeat(32);
const ITEM_NAME_CHARS_PER_LINE = 32;

export default function generateBillPdf(order, restaurant = {}) {
  const effectiveRestaurant =
    restaurant && Object.keys(restaurant).length > 0
      ? restaurant
      : order?.restaurantId && typeof order.restaurantId === 'object'
        ? order.restaurantId
        : {};

  // Estimate page height: header ~30mm + items ~6mm each + footer ~30mm + tax lines ~20mm
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
  const manualAmtEst = Number(order.manualDiscountAmount ?? order.manual_discount_amount) || 0;
  const manualReasonEst = order.manualDiscountReason || order.manual_discount_reason || '';

  const headerNoteLines = effectiveRestaurant.receipt_header_note
    ? Math.ceil(effectiveRestaurant.receipt_header_note.length / ITEM_NAME_CHARS_PER_LINE)
    : 0;
  const addressLinesCount = effectiveRestaurant.address
    ? Math.ceil(effectiveRestaurant.address.length / ITEM_NAME_CHARS_PER_LINE)
    : 0;
  const extraHeaderHeight =
    headerNoteLines * 3.5 +
    (effectiveRestaurant.cr_number ? 4 : 0) +
    addressLinesCount * 3.5 +
    (effectiveRestaurant.phone || effectiveRestaurant.gst_no || effectiveRestaurant.vat_no ? 4 : 0);

  const orderNum = String(order.orderNumber || '');
  const orderIdText = orderNum.startsWith('#')
    ? `Order ID: ${orderNum}`
    : `Order ID: #${orderNum}`;
  const orderIdExtraLines = Math.max(0, Math.ceil(orderIdText.length / ITEM_NAME_CHARS_PER_LINE) - 1);
  const custName = order.customerName || '';
  const customerExtraLines = Math.max(0, Math.ceil(`Customer: ${custName}`.length / ITEM_NAME_CHARS_PER_LINE) - 1);
  const tableNum =
    order.tableNumber ||
    (order.tableId && typeof order.tableId === 'object'
      ? order.tableId.tableNumber
      : '');
  const extraOrderMetaHeight =
    orderIdExtraLines * 3.5 +
    customerExtraLines * 3.5 +
    (order.customerPhone ? 4 : 0) +
    (tableNum ? 4 : 0);

  const pageHeight =
    75 +
    extraHeaderHeight +
    extraOrderMetaHeight +
    itemCount * (hasTax ? 16 : 12) +
    longItemNameHeight +
    (hasGst ? 16 : 0) +
    (hasVat ? 12 : 0) +
    (manualAmtEst > 0 ? 10 : 0) +
    (manualReasonEst ? 6 : 0);

  const doc = new jsPDF({
    unit: 'mm',
    format: [PAGE_WIDTH, pageHeight],
  });

  let y = 6;
  const centerX = PAGE_WIDTH / 2;

  // --- Helper functions ---
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

  const addDashLine = () => {
    addCenteredText(DASH_LINE, 7);
  };

  // --- Restaurant Header ---
  addCenteredText(effectiveRestaurant.name || 'Restaurant', 9, 'bold');
  if (effectiveRestaurant.receipt_header_note) {
    const noteLines = doc.splitTextToSize(
      String(effectiveRestaurant.receipt_header_note),
      CONTENT_WIDTH,
    );
    noteLines.forEach((line) => {
      addCenteredText(line, 6.5, 'normal');
    });
  }
  if (effectiveRestaurant.cr_number) {
    addCenteredText(`CR No: ${effectiveRestaurant.cr_number}`, 6.5, 'normal');
  }
  if (effectiveRestaurant.address) {
    const addressLines = doc.splitTextToSize(
      String(effectiveRestaurant.address),
      CONTENT_WIDTH,
    );
    addressLines.forEach((line) => {
      addCenteredText(line, 6.5, 'normal');
    });
  }
  if (
    effectiveRestaurant.phone ||
    effectiveRestaurant.gst_no ||
    effectiveRestaurant.vat_no
  ) {
    const parts = [];
    if (effectiveRestaurant.phone) parts.push(`Ph: ${effectiveRestaurant.phone}`);
    if (effectiveRestaurant.gst_no) parts.push(`GST: ${effectiveRestaurant.gst_no}`);
    if (effectiveRestaurant.vat_no) parts.push(`VAT: ${effectiveRestaurant.vat_no}`);
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

  if (tableNum) {
    addWrappedLeftText(`Table: ${tableNum}`, 7, 'normal');
  }

  // --- Items ---
  addDashLine();
  addLeftRight('ITEM', 'AMT', 7);
  addDashLine();

  const gstType = order.taxType || 'exclusive';
  const vatType = order.vatType || 'exclusive';
  const gstIncl = hasGst && gstType === 'inclusive';
  const vatIncl = hasVat && vatType === 'inclusive';
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
      let base, itemVat;
      if (vatIncl) {
        base = roundTo3(amount / (1 + vatR / 100));
        itemVat = roundTo3(amount - base);
      } else {
        base = amount;
        itemVat = roundTo3((base * vatR) / 100);
      }
      addLeftText(`  Base:${formatCurrency(base)} VAT:${formatCurrency(itemVat)}`, 6);
    } else if (!isLiquor && hasGst) {
      let base, itemCgst, itemSgst;
      if (gstIncl) {
        base = roundTo3(amount / (1 + rate / 100));
        const tax = roundTo3(amount - base);
        itemCgst = roundTo3(tax / 2);
        itemSgst = roundTo3(tax - itemCgst);
      } else {
        base = amount;
        itemCgst = roundTo3((base * cgstR) / 100);
        itemSgst = roundTo3((base * sgstR) / 100);
      }
      addLeftText(`  Base:${formatCurrency(base)} C:${formatCurrency(itemCgst)} S:${formatCurrency(itemSgst)}`, 6);
    }
  });

  // --- Subtotal / Tax / Total ---
  addDashLine();
  if (hasGst) {
    addLeftRight('FOOD SUBTOTAL', `Rs.${formatCurrency(order.foodSubtotal || 0)}`, 8);
    if (gstIncl) {
      addLeftText('INCL. GST BREAKUP:', 7);
    }
    addLeftRight(`CGST (${cgstR}%)`, `Rs.${formatCurrency(order.cgstAmount || 0)}`, 8);
    addLeftRight(`SGST (${sgstR}%)`, `Rs.${formatCurrency(order.sgstAmount || 0)}`, 8);
  }
  if (hasVat) {
    addLeftRight('LIQUOR SUBTOTAL', `Rs.${formatCurrency(order.liquorSubtotal || 0)}`, 8);
    if (vatIncl) {
      addLeftText('INCL. VAT BREAKUP:', 7);
    }
    addLeftRight(`VAT (${vatR}%)`, `Rs.${formatCurrency(order.vatAmount || 0)}`, 8);
  }
  const manualAmt = Number(order.manualDiscountAmount ?? order.manual_discount_amount) || 0;
  const manualType = (order.manualDiscountType || order.manual_discount_type || '').toUpperCase();
  const manualVal = order.manualDiscountValue ?? order.manual_discount_value;
  const manualReason = order.manualDiscountReason || order.manual_discount_reason || '';
  const couponAmt = Math.max(0, roundTo3((Number(order.discountAmount) || 0) - manualAmt));

  if (couponAmt > 0) {
    addLeftRight(
      order.couponCode ? `COUPON (${order.couponCode})` : 'COUPON DISCOUNT',
      `-Rs.${formatCurrency(couponAmt)}`,
      8,
    );
  }
  if (manualAmt > 0) {
    const label = manualType === 'PERCENTAGE' ? `MANUAL DISC (${manualVal}%)` : 'MANUAL DISCOUNT';
    addLeftRight(label, `-Rs.${formatCurrency(manualAmt)}`, 8);
    if (manualReason) {
      addLeftText(`  Reason: ${String(manualReason).slice(0, 26)}`, 6);
    }
  }
  if (couponAmt === 0 && manualAmt === 0 && Number(order.discountAmount) > 0) {
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

  // --- Footer ---
  addDashLine();
  y += 1;
  addCenteredText('Thank you! Visit again', 7, 'bold');
  y += 1;

  // Save the PDF
  doc.save(`bill-${order.orderNumber}.pdf`);
}
