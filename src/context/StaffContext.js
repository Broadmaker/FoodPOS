import React, { createContext, useContext, useState, useCallback } from 'react';

// ─── PERMISSIONS PER ROLE ─────────────────────────────────────────────────────
export const ROLE_PERMISSIONS = {
  admin: {
    canAccessPOS:       true,
    canAccessOrders:    true,
    canAccessMenu:      true,
    canAccessDashboard: true,
    canAccessSettings:  true,
    canVoidOrder:       true,
    canApplyDiscount:   true,
    canAccessPrinter:   true,
    label:              'Admin',
    color:              '#F97316',
    icon:               'shield-checkmark',
  },
  cashier: {
    canAccessPOS:       true,
    canAccessOrders:    true,
    canAccessMenu:      false,
    canAccessDashboard: false,
    canAccessSettings:  false,
    canVoidOrder:       false,
    canApplyDiscount:   true,
    canAccessPrinter:   true,
    label:              'Cashier',
    color:              '#3B82F6',
    icon:               'person-circle',
  },
};

const StaffContext = createContext(null);

export const StaffProvider = ({ children }) => {
  const [currentStaff, setCurrentStaff] = useState(null); // null = not logged in

  const login = useCallback((staff) => {
    setCurrentStaff(staff);
  }, []);

  const logout = useCallback(() => {
    setCurrentStaff(null);
  }, []);

  const permissions = currentStaff
    ? ROLE_PERMISSIONS[currentStaff.role] || ROLE_PERMISSIONS.cashier
    : null;

  const hasPermission = useCallback((key) => {
    if (!permissions) return false;
    return permissions[key] === true;
  }, [permissions]);

  return (
    <StaffContext.Provider value={{ currentStaff, permissions, login, logout, hasPermission }}>
      {children}
    </StaffContext.Provider>
  );
};

export const useStaff = () => {
  const ctx = useContext(StaffContext);
  if (!ctx) throw new Error('useStaff must be inside StaffProvider');
  return ctx;
};