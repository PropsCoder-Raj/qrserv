import { jsPDF } from 'jspdf';

const PAGE_WIDTH = 58; // mm (2-inch thermal KOT)
const MARGIN = 4; // mm side margins
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const DASH_LINE = '-'.repeat(32);
const STAR_LINE = '*'.repeat(32);
const ITEM_NAME_CHARS_PER_LINE = 28;

export default function generateKotPdf(order, restaurant = {}) {
  const effectiveRestaurant =
    restaurant && Object.keys(restaurant).length > 0
      ? restaurant
      : order?.restaurantId && typeof order.restaurantId === 'object'
        ? order.restaurantId
        : {};

  const items = order.items || [];
  const activeItems = items.filter((item) => {
    const totalQty = Number(item.quantity || 0);
    const cancelledQty = Number(item.cancelledQuantity || 0);
    return totalQty - cancelledQty > 0;
  });

  const orderNum = String(order.orderNumber || '');
  const tableNum =
    order.tableNumber ||
    (order.tableId && typeof order.tableId === 'object'
      ? order.tableId.tableNumber
      : order.tableId || '');

  const orderNote = (
    order.order_instructions ||
    order.orderInstructions ||
    order.notes ||
    ''
  ).trim();

  // Estimate page height
  let estimatedHeight = 65; // Base header & footer
  activeItems.forEach((item) => {
    estimatedHeight += 9; // item name + qty
    if (item.spiceLevel?.name) estimatedHeight += 4;
    if (item.addOns?.length) estimatedHeight += 4;
    const note = (item.cookingNote || item.specialInstructions || item.notes || '').trim();
    if (note) {
      const lines = Math.ceil(note.length / 24);
      estimatedHeight += lines * 4 + 4;
    }
  });

  if (orderNote) {
    const lines = Math.ceil(orderNote.length / 24);
    estimatedHeight += lines * 4 + 14;
  }

  const doc = new jsPDF({
    unit: 'mm',
    format: [PAGE_WIDTH, Math.max(80, estimatedHeight)],
  });

  let y = 6;
  const centerX = PAGE_WIDTH / 2;

  const addCenteredText = (text, size = 8, style = 'normal') => {
    doc.setFontSize(size);
    doc.setFont('courier', style);
    doc.text(String(text || ''), centerX, y, { align: 'center' });
    y += size * 0.4 + 1;
  };

  const addLeftText = (text, size = 8, style = 'normal') => {
    doc.setFontSize(size);
    doc.setFont('courier', style);
    doc.text(String(text || ''), MARGIN, y);
    y += size * 0.4 + 1;
  };

  const addWrappedLeftText = (text, size = 8, style = 'normal') => {
    doc.setFontSize(size);
    doc.setFont('courier', style);
    const lines = doc.splitTextToSize(String(text || ''), CONTENT_WIDTH);
    doc.text(lines, MARGIN, y);
    y += lines.length * (size * 0.4 + 1);
  };

  const addDashLine = () => {
    addCenteredText(DASH_LINE, 7, 'normal');
  };

  const addStarLine = () => {
    addCenteredText(STAR_LINE, 7, 'normal');
  };

  // --- Header ---
  if (effectiveRestaurant.name) {
    addCenteredText(effectiveRestaurant.name.toUpperCase(), 8, 'bold');
  }
  addCenteredText('KITCHEN ORDER TICKET (KOT)', 9, 'bold');
  addDashLine();

  addCenteredText(
    orderNum.startsWith('#') ? orderNum : `#${orderNum}`,
    13,
    'bold',
  );

  const dateObj = order.createdAt ? new Date(order.createdAt) : new Date();
  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dateStr = `${day}/${month} ${timeStr}`;

  addLeftText(`Time: ${dateStr}`, 7.5, 'normal');
  if (tableNum) {
    addLeftText(`Table: Table ${tableNum}`, 9, 'bold');
  } else {
    addLeftText(`Type: ${(order.orderType || 'DINE_IN').toUpperCase()}`, 8.5, 'bold');
  }

  if (order.customerName) {
    addLeftText(`Customer: ${order.customerName}`, 7.5, 'normal');
  }

  // --- Items Section ---
  addDashLine();
  addLeftText('QTY  ITEM', 8, 'bold');
  addDashLine();

  let totalItemsCount = 0;
  activeItems.forEach((item) => {
    const totalQty = Number(item.quantity || 0);
    const cancelledQty = Number(item.cancelledQuantity || 0);
    const remainingQty = Math.max(0, totalQty - cancelledQty);
    totalItemsCount += remainingQty;

    // Item line
    addWrappedLeftText(`${remainingQty} x ${item.name}`, 8.5, 'bold');

    // Spice & Addons
    if (item.spiceLevel?.name) {
      addLeftText(`   Spice: ${item.spiceLevel.name}`, 7, 'normal');
    }
    if (item.addOns?.length) {
      addLeftText(
        `   Add-ons: ${item.addOns.map((a) => a.name).join(', ')}`,
        7,
        'normal',
      );
    }

    // Prominent item note
    const itemNote = (
      item.cookingNote ||
      item.specialInstructions ||
      item.notes ||
      ''
    ).trim();

    if (itemNote) {
      y += 0.5;
      addWrappedLeftText(`   >> NOTE: ${itemNote.toUpperCase()} <<`, 7.5, 'bold');
      y += 0.5;
    }

    y += 1;
  });

  addDashLine();
  addLeftText(`TOTAL ITEMS: ${totalItemsCount}`, 8, 'bold');

  // --- Highlighted Overall Order Note Section ---
  if (orderNote) {
    y += 1;
    addStarLine();
    addCenteredText('*** SPECIAL ORDER NOTE ***', 8.5, 'bold');
    addWrappedLeftText(orderNote.toUpperCase(), 8, 'bold');
    addStarLine();
  }

  // --- Footer ---
  y += 2;
  addCenteredText('*** END OF KOT ***', 7, 'normal');

  doc.save(`kot-${order.orderNumber}.pdf`);
}
