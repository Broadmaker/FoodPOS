// Global printer state — single JS module instance
const instanceId = Math.random().toString(36).slice(2, 6);
console.log('printerState module loaded, instance:', instanceId);

const state = {
  isConnected: false,
  device: null,
  listeners: [],
};

export const printerState = {
  instanceId,
  setConnected: (device) => {
    console.log('printerState.setConnected, instance:', instanceId, 'listeners:', state.listeners.length);
    state.isConnected = true;
    state.device = device;
    state.listeners.forEach(fn => fn(true, device));
  },
  setDisconnected: () => {
    console.log('printerState.setDisconnected, instance:', instanceId);
    state.isConnected = false;
    state.device = null;
    state.listeners.forEach(fn => fn(false, null));
  },
  getState: () => ({ isConnected: state.isConnected, device: state.device }),
  subscribe: (fn) => {
    console.log('printerState.subscribe, instance:', instanceId, 'total listeners:', state.listeners.length + 1);
    state.listeners.push(fn);
    return () => {
      state.listeners = state.listeners.filter(l => l !== fn);
    };
  },
};