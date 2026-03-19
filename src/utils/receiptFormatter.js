import { Platform } from 'react-native';

// 58mm paper = 32 characters per line at default font size
const COLS = 32;

let BluetoothEscposPrinter = null;
if (Platform.OS === 'android') {
  try {
    BluetoothEscposPrinter = require('react-native-bluetooth-escpos-printer').BluetoothEscposPrinter;
  } catch (e) {}
}

// ─── TEXT HELPERS ─────────────────────────────────────────────────────────────
const pad = (str, len) => {
  const s = String(str);
  return s.length >= len ? s.slice(0, len) : s + ' '.repeat(len - s.length);
};

const divider = (char = '-') => char.repeat(COLS) + '\n';

// Left text + right-aligned value on same line
const twoCol = (left, right) => {
  const r = String(right);
  const maxLeft = COLS - r.length - 1;
  const l = String(left).slice(0, maxLeft);
  return pad(l, maxLeft) + ' ' + r + '\n';
};

// ─── RECEIPT BUILDER ──────────────────────────────────────────────────────────
// Returns an array of async functions — each prints one part of the receipt.
// Caller (PrinterContext.printReceipt) executes them in sequence.
export const buildReceiptLines = ({ order, cartItems, settings, formatCurrency }) => {
  if (!BluetoothEscposPrinter) return [];

  const P = BluetoothEscposPrinter;
  const lines = [];

  // ── HEADER ────────────────────────────────────────────────────────────────
  lines.push(() => P.printerAlign(P.ALIGN.CENTER));
  lines.push(() => P.printText('\n', {}));

  // Shop name — slightly larger
  lines.push(() => P.printText(
    (settings.shop_name || 'FoodPOS') + '\n',
    { widthtimes: 1, heigthtimes: 1, fonttype: 1 }
  ));

  if (settings.shop_address) {
    lines.push(() => P.printText(settings.shop_address + '\n', {}));
  }
  if (settings.shop_phone) {
    lines.push(() => P.printText(settings.shop_phone + '\n', {}));
  }

  // Date and time
  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  lines.push(() => P.printText(`${dateStr}  ${timeStr}\n`, {}));
  lines.push(() => P.printText(`${order.orderNumber}\n`, {}));
  lines.push(() => P.printText('\n', {}));

  // ── ITEMS ─────────────────────────────────────────────────────────────────
  lines.push(() => P.printerAlign(P.ALIGN.LEFT));
  lines.push(() => P.printText(divider(), {}));
  lines.push(() => P.printText(twoCol('ITEM', 'AMOUNT'), {}));
  lines.push(() => P.printText(divider(), {}));

  for (const item of cartItems) {
    const itemTotal = formatCurrency(item.price * item.quantity);
    lines.push(() => P.printText(item.name.slice(0, COLS) + '\n', {}));
    lines.push(() => P.printText(
      twoCol(`  ${item.quantity} x ${formatCurrency(item.price)}`, itemTotal), {}
    ));
  }

  lines.push(() => P.printText(divider(), {}));

  // ── TOTALS ────────────────────────────────────────────────────────────────
  lines.push(() => P.printText(twoCol('Subtotal', formatCurrency(order.subtotal)), {}));

  if (order.discountAmount > 0) {
    lines.push(() => P.printText(
      twoCol('Discount', '-' + formatCurrency(order.discountAmount)), {}
    ));
  }

  lines.push(() => P.printText(divider(), {}));

  // Total — bold
  lines.push(() => P.printText(
    twoCol('TOTAL', formatCurrency(order.total)),
    { widthtimes: 1, heigthtimes: 1, fonttype: 1 }
  ));

  lines.push(() => P.printText(divider(), {}));

  // ── PAYMENT ───────────────────────────────────────────────────────────────
  const payLabel = order.paymentMethod === 'cash' ? 'Cash Tendered' : 'GCash';
  lines.push(() => P.printText(twoCol(payLabel, formatCurrency(order.amountTendered)), {}));

  if (order.changeAmount > 0) {
    lines.push(() => P.printText(twoCol('Change', formatCurrency(order.changeAmount)), {}));
  }

  lines.push(() => P.printText(divider(), {}));

  // ── FOOTER ────────────────────────────────────────────────────────────────
  lines.push(() => P.printerAlign(P.ALIGN.CENTER));
  lines.push(() => P.printText(
    (settings.receipt_footer || 'Salamat! Come back soon!') + '\n', {}
  ));
  lines.push(() => P.printText('--- FoodPOS ---\n', {}));

  // Feed paper so the receipt tears off cleanly
  lines.push(() => P.printText('\n\n\n', {}));

  return lines;
};