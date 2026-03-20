import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { useApp } from './AppContext';

const CartContext = createContext(null);

const initialState = {
  items: [],        // { id, name, price, quantity, image_emoji, notes }
  discount: 0,      // flat discount in ₱
  discountType: 'flat', // 'flat' | 'percent'
  notes: '',
  paymentMethod: 'cash',
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.id === action.item.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.item, quantity: 1, notes: '' }] };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };
    case 'INCREMENT':
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      };
    case 'DECREMENT': {
      const item = state.items.find((i) => i.id === action.id);
      if (!item) return state;
      if (item.quantity <= 1) {
        return { ...state, items: state.items.filter((i) => i.id !== action.id) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, quantity: i.quantity - 1 } : i
        ),
      };
    }
    case 'SET_QUANTITY':
      if (action.quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.id !== action.id) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, quantity: action.quantity } : i
        ),
      };
    case 'UPDATE_ITEM_NOTE':
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, notes: action.notes } : i
        ),
      };
    case 'SET_DISCOUNT':
      return { ...state, discount: action.discount, discountType: action.discountType || 'flat' };
    case 'SET_NOTES':
      return { ...state, notes: action.notes };
    case 'SET_PAYMENT_METHOD':
      return { ...state, paymentMethod: action.method };
    case 'CLEAR_CART':
      return initialState;
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addItem = useCallback((item) => dispatch({ type: 'ADD_ITEM', item }), []);
  const removeItem = useCallback((id) => dispatch({ type: 'REMOVE_ITEM', id }), []);
  const increment = useCallback((id) => dispatch({ type: 'INCREMENT', id }), []);
  const decrement = useCallback((id) => dispatch({ type: 'DECREMENT', id }), []);
  const setQuantity = useCallback((id, quantity) => dispatch({ type: 'SET_QUANTITY', id, quantity }), []);
  const updateItemNote = useCallback((id, notes) => dispatch({ type: 'UPDATE_ITEM_NOTE', id, notes }), []);
  const setDiscount = useCallback((discount, type = 'flat') => dispatch({ type: 'SET_DISCOUNT', discount, discountType: type }), []);
  const setNotes = useCallback((notes) => dispatch({ type: 'SET_NOTES', notes }), []);
  const setPaymentMethod = useCallback((method) => dispatch({ type: 'SET_PAYMENT_METHOD', method }), []);
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR_CART' }), []);

  // ─── COMPUTED VALUES ──────────────────────────────────────────────────────
  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountAmount = state.discountType === 'percent'
    ? (subtotal * state.discount) / 100
    : state.discount;
  const { settings } = useApp();
  const taxRate = parseFloat(settings?.tax_rate) || 0;
  // VAT-inclusive: price already includes VAT, extract it from the total
  // Formula: VAT = total × (rate / (100 + rate))
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxRate > 0
    ? taxableAmount * (taxRate / (100 + taxRate))
    : 0;
  const total = Math.max(0, taxableAmount); // total stays same, VAT is already included

  const isInCart = useCallback((id) => state.items.some((i) => i.id === id), [state.items]);
  const getItemQuantity = useCallback((id) => {
    const item = state.items.find((i) => i.id === id);
    return item ? item.quantity : 0;
  }, [state.items]);

  return (
    <CartContext.Provider
      value={{
        ...state,
        itemCount,
        subtotal,
        discountAmount,
        taxAmount,
        total,
        addItem,
        removeItem,
        increment,
        decrement,
        setQuantity,
        updateItemNote,
        setDiscount,
        setNotes,
        setPaymentMethod,
        clearCart,
        isInCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};