import { Platform } from 'react-native';

// 58mm paper = 32 characters per line
const COLS = 32;

let COMMANDS = null;
if (Platform.OS === 'android') {
  try {
    COMMANDS = require('react-native-thermal-receipt-printer-image-qr').COMMANDS;
  } catch (e) {}
}

// ─── TEXT HELPERS ─────────────────────────────────────────────────────────────
const pad = (str, len) => {
  const s = String(str);
  return s.length >= len ? s.slice(0, len) : s + ' '.repeat(len - s.length);
};

const divider = () => '-'.repeat(COLS) + '\n';

const twoCol = (left, right) => {
  const r = String(right);
  const maxLeft = COLS - r.length - 1;
  const l = String(left).slice(0, maxLeft);
  return pad(l, maxLeft) + ' ' + r + '\n';
};

const center = (str) => {
  const s = String(str).slice(0, COLS);
  const spaces = Math.max(0, Math.floor((COLS - s.length) / 2));
  return ' '.repeat(spaces) + s + '\n';
};

// ─── RECEIPT BUILDER ──────────────────────────────────────────────────────────
// Returns a single raw ESC/POS text string — sent in one printText() call
export const buildReceiptText = ({ order, cartItems, settings, formatCurrency }) => {
  if (!COMMANDS) return '';

  const C = COMMANDS;
  const TF = C.TEXT_FORMAT;
  let text = '';

  // ── INIT ──────────────────────────────────────────────────────────────────
  text += C.HARDWARE.HW_INIT;

  // ── HEADER ────────────────────────────────────────────────────────────────
  text += TF.TXT_ALIGN_CT;
  text += TF.TXT_BOLD_ON;
  text += (settings.shop_name || 'FoodPOS') + '\n';
  text += TF.TXT_BOLD_OFF;

  if (settings.shop_address) text += settings.shop_address + '\n';
  if (settings.shop_phone)   text += settings.shop_phone + '\n';

  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  text += `${dateStr}  ${timeStr}\n`;
  text += order.orderNumber + '\n';
  text += '\n';

  // ── ITEMS ─────────────────────────────────────────────────────────────────
  text += TF.TXT_ALIGN_LT;
  text += divider();
  text += twoCol('ITEM', 'AMOUNT');
  text += divider();

  for (const item of cartItems) {
    text += item.name.slice(0, COLS) + '\n';
    text += twoCol(
      `  ${item.quantity} x ${formatCurrency(item.price)}`,
      formatCurrency(item.price * item.quantity)
    );
  }

  text += divider();

  // ── TOTALS ────────────────────────────────────────────────────────────────
  text += twoCol('Subtotal', formatCurrency(order.subtotal));

  if (order.discountAmount > 0) {
    text += twoCol('Discount', '-' + formatCurrency(order.discountAmount));
  }

  text += divider();
  text += TF.TXT_BOLD_ON;
  text += twoCol('TOTAL', formatCurrency(order.total));
  text += TF.TXT_BOLD_OFF;

  if (order.taxAmount > 0) {
    text += twoCol('  VAT Inclusive', formatCurrency(order.taxAmount));
    text += twoCol('  Net of VAT', formatCurrency(order.total - order.taxAmount));
  }

  text += divider();

  // ── PAYMENT ───────────────────────────────────────────────────────────────
  const payLabel = order.paymentMethod === 'cash' ? 'Cash Tendered' : 'GCash';
  text += twoCol(payLabel, formatCurrency(order.amountTendered));
  if (order.changeAmount > 0) {
    text += twoCol('Change', formatCurrency(order.changeAmount));
  }
  text += divider();

  // ── FOOTER ────────────────────────────────────────────────────────────────
  // Center footer manually using padding (guaranteed regardless of ESC/POS encoding)
  const footer = settings.receipt_footer || 'Salamat! Come back soon!';
  const footerPad = Math.max(0, Math.floor((COLS - footer.length) / 2));
  text += ' '.repeat(footerPad) + footer + '\n';
  const brand = '--- FoodPOS ---';
  const brandPad = Math.max(0, Math.floor((COLS - brand.length) / 2));
  text += ' '.repeat(brandPad) + brand + '\n';
  text += TF.TXT_ALIGN_LT;

  // Feed paper
  text += '\n\n\n';

  return text;
};