// Simple event emitter for printer connection state
// Used to bridge PrinterScreen (inside Modal) → PrinterContext (global)
const listeners = [];

export const printerEvents = {
  emit: (event, data) => {
    listeners.forEach(l => l(event, data));
  },
  on: (callback) => {
    listeners.push(callback);
    return () => {
      const idx = listeners.indexOf(callback);
      if (idx > -1) listeners.splice(idx, 1);
    };
  },
};