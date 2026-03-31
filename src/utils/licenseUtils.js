// ─── LICENSE UTILS ────────────────────────────────────────────────────────────
// Offline license key generation and validation
// Format: BM-XXXXXX-XXXXXX-XX (tied to shop name)

const SECRET_SALT = 'BroadMarkee@FoodPOS2025';

// Simple hash function
const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

// Encode shop name to 6 char segment
const encodeShop = (shopName) => {
  const clean = shopName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  const hash = simpleHash(clean + SECRET_SALT);
  return hash.toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
};

// Generate checksum
const genChecksum = (shopSegment, serial) => {
  const hash = simpleHash(shopSegment + serial + SECRET_SALT);
  return hash.toString(36).toUpperCase().slice(0, 2);
};

// Generate a license key for a shop
export const generateLicenseKey = (shopName, serial = '000001') => {
  const shopSegment = encodeShop(shopName);
  const serialPadded = serial.toString().padStart(6, '0');
  const checksum = genChecksum(shopSegment, serialPadded);
  return `BM-${shopSegment}-${serialPadded}-${checksum}`;
};

// Validate a license key against a shop name
export const validateLicenseKey = (shopName, key) => {
  try {
    if (!shopName || !key) return false;
    const parts = key.trim().toUpperCase().split('-');
    if (parts.length !== 4 || parts[0] !== 'BM') return false;
    const [, shopSegment, serial, checksum] = parts;
    if (shopSegment.length !== 6 || serial.length !== 6 || checksum.length !== 2) return false;
    const expectedShop = encodeShop(shopName);
    const expectedCheck = genChecksum(shopSegment, serial);
    return shopSegment === expectedShop && checksum === expectedCheck;
  } catch (e) {
    return false;
  }
};