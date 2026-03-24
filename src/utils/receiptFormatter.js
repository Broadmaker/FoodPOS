import { Platform } from 'react-native';

// 58mm = 32 chars, 80mm = 48 chars per line
const COLS_MAP = { '58': 32, '80': 48 };

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

const makeDivider = (COLS) => () => '-'.repeat(COLS) + '\n';

const makeTwoCol = (COLS) => (left, right) => {
  const r = String(right);
  const maxLeft = COLS - r.length - 1;
  const l = String(left);
  const visLen = visibleLen(l);
  const padNeeded = Math.max(0, maxLeft - visLen);
  return l + ' '.repeat(padNeeded) + ' ' + r + '\n';
};

// Strip ESC/POS control bytes to get visible length
const visibleLen = (str) => str.replace(/[\x00-\x1F\x7F]/g, '').length;

// Center using visible length
const makeCenter = (COLS) => (str) => {
  const visible = visibleLen(str);
  const spaces = Math.max(0, Math.floor((COLS - visible) / 2));
  return ' '.repeat(spaces) + str + '\n';
};

// ─── RECEIPT BUILDER ──────────────────────────────────────────────────────────
export const buildReceiptText = ({ order, cartItems, settings, formatCurrency }) => {
  if (!COMMANDS) return '';

  const C    = COMMANDS;
  const TF   = C.TEXT_FORMAT;
  const COLS = COLS_MAP[settings?.paper_size] || 32;

  const divider = makeDivider(COLS);
  const twoCol  = makeTwoCol(COLS);
  const center  = makeCenter(COLS);

  let text = '';

  // Init — left align so manual padding is respected
  text += C.HARDWARE.HW_INIT;
  text += TF.TXT_ALIGN_LT;

  // ── HEADER ────────────────────────────────────────────────────────────────
  const shopName = settings.shop_name || 'FoodPOS';
  text += TF.TXT_BOLD_ON;
  text += center(shopName);
  text += TF.TXT_BOLD_OFF;

  if (settings.shop_address) text += center(settings.shop_address);
  if (settings.shop_phone)   text += center(settings.shop_phone);

  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  text += center(`${dateStr}  ${timeStr}`);
  text += center(order.orderNumber);
  text += '\n';

  // ── ITEMS ─────────────────────────────────────────────────────────────────
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

  // ── NOTES ─────────────────────────────────────────────────────────────────
  if (order.notes) {
    text += divider();
    text += 'Notes: ' + order.notes + '\n';
  }

  // ── FOOTER ────────────────────────────────────────────────────────────────
  text += center(settings.receipt_footer || 'Salamat! Come back soon!');
  text += center('--- FoodPOS ---');

  return text;
};