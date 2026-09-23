import { jsPDF } from 'jspdf';

const PAGE_WIDTH = 58; // mm (2-inch thermal receipt)
const MARGIN = 4; // mm side margins
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2; // usable width
const DASH_LINE = '-'.repeat(32);
const ITEM_NAME_CHARS_PER_LINE = 32;

export default function generateBillPdf(order, restaurant = {}) {
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
  const pageHeight =
    70 + itemCount * (hasTax ? 16 : 12) + longItemNameHeight + (hasGst ? 16 : 0) + (hasVat ? 12 : 0);

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
    doc.text(text, centerX, y, { align: 'center' });
    y += size * 0.4 + 0.5;
  };

  const addLeftRight = (left, right, size = 7) => {
    doc.setFontSize(size);
    doc.setFont('courier', 'normal');
    doc.text(left, MARGIN, y);
    doc.text(right, PAGE_WIDTH - MARGIN, y, { align: 'right' });
    y += size * 0.4 + 0.5;
  };

  const addLeftText = (text, size = 7, style = 'normal') => {
    doc.setFontSize(size);
    doc.setFont('courier', style);
    doc.text(text, MARGIN, y);
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
  addCenteredText(restaurant.name || 'Restaurant', 9, 'bold');
  if (restaurant.address) {
    addCenteredText(restaurant.address, 7);
  }
  if (restaurant.phone || restaurant.gst_no || restaurant.vat_no) {
    const parts = [];
    if (restaurant.phone) parts.push(`Ph: ${restaurant.phone}`);
    if (restaurant.gst_no) parts.push(`GST: ${restaurant.gst_no}`);
    if (restaurant.vat_no) parts.push(`VAT: ${restaurant.vat_no}`);
    addCenteredText(parts.join(' | '), 6);
  }

  // --- Order Info ---
  addDashLine();
  const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: '2-digit', year: '2-digit',
  });
  addLeftText(`Order: ${order.orderNumber}`);
  addLeftText(`Date: ${dateStr}`);

  if (order.tableNumber) {
    addLeftText(`Table: ${order.tableNumber}`);
  }
  if (order.customerName) {
    addLeftText(`Customer: ${order.customerName}`);
  }
  if (order.customerPhone) {
    addLeftText(`Customer Phone: ${order.customerPhone}`);
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
    const amount = item.price * remainingQty;
    const isLiquor = (item.itemType || 'food') === 'liquor';

    addWrappedLeftText(getItemLabel(item), 7, 'bold');
    addLeftRight(`  ${remainingQty} x ${item.price}`, `${amount}`);

    if (cancelledQty > 0) {
      addLeftText(`  Cancelled: ${cancelledQty}/${totalQty}`, 6);
      if (item.cancelReason) {
        addLeftText(`  Reason: ${String(item.cancelReason).slice(0, 28)}`, 6);
      }
    }
    if (isLiquor && hasVat) {
      let base, itemVat;
      if (vatIncl) {
        base = Math.round(amount / (1 + vatR / 100) * 100) / 100;
        itemVat = Math.round((amount - base) * 100) / 100;
      } else {
        base = amount;
        itemVat = Math.round(base * vatR / 100 * 100) / 100;
      }
      addLeftText(`  Base:${base} VAT:${itemVat}`, 6);
    } else if (!isLiquor && hasGst) {
      let base, itemCgst, itemSgst;
      if (gstIncl) {
        base = Math.round(amount / (1 + rate / 100) * 100) / 100;
        const tax = Math.round((amount - base) * 100) / 100;
        itemCgst = Math.round(tax / 2 * 100) / 100;
        itemSgst = Math.round((tax - itemCgst) * 100) / 100;
      } else {
        base = amount;
        itemCgst = Math.round(base * cgstR / 100 * 100) / 100;
        itemSgst = Math.round(base * sgstR / 100 * 100) / 100;
      }
      addLeftText(`  Base:${base} C:${itemCgst} S:${itemSgst}`, 6);
    }
  });

  // --- Subtotal / Tax / Total ---
  addDashLine();
  if (hasGst) {
    addLeftRight('FOOD SUBTOTAL', `Rs.${(order.foodSubtotal || 0).toFixed(2)}`, 8);
    if (gstIncl) {
      addLeftText('INCL. GST BREAKUP:', 7);
    }
    addLeftRight(`CGST (${cgstR}%)`, `Rs.${order.cgstAmount}`, 8);
    addLeftRight(`SGST (${sgstR}%)`, `Rs.${order.sgstAmount}`, 8);
  }
  if (hasVat) {
    addLeftRight('LIQUOR SUBTOTAL', `Rs.${(order.liquorSubtotal || 0).toFixed(2)}`, 8);
    if (vatIncl) {
      addLeftText('INCL. VAT BREAKUP:', 7);
    }
    addLeftRight(`VAT (${vatR}%)`, `Rs.${order.vatAmount}`, 8);
  }
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.text('TOTAL', MARGIN, y);
  doc.text(`Rs.${order.totalAmount}`, PAGE_WIDTH - MARGIN, y, { align: 'right' });
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
