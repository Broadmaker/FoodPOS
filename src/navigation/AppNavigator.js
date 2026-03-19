import React from 'react';
import { View, Text, TouchableOpacity, Platform, Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import POSScreen from '../screens/pos/POSScreen';
import CheckoutScreen from '../screens/pos/CheckoutScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';
import MenuScreen from '../screens/menu/MenuScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import { useCart } from '../context/CartContext';
import { useApp } from '../context/AppContext';
import { useStaff, ROLE_PERMISSIONS } from '../context/StaffContext';

const Tab = createBottomTabNavigator();
const POSStack = createStackNavigator();

function POSStackNavigator() {
  return (
    <POSStack.Navigator screenOptions={{ headerShown: false }}>
      <POSStack.Screen name="POS" component={POSScreen} />
      <POSStack.Screen name="Checkout" component={CheckoutScreen} />
      <POSStack.Screen name="Orders" component={OrdersScreen} />
    </POSStack.Navigator>
  );
}

// All tabs — visibility controlled by role
const ALL_TABS = [
  { key: 'POSTab',       label: 'POS',      icon: 'storefront-outline',  iconActive: 'storefront',   permission: 'canAccessPOS'       },
  { key: 'MenuTab',      label: 'Menu',     icon: 'restaurant-outline',  iconActive: 'restaurant',   permission: 'canAccessMenu'      },
  { key: 'OrdersTab',    label: 'Orders',   icon: 'receipt-outline',     iconActive: 'receipt',      permission: 'canAccessOrders'    },
  { key: 'DashboardTab', label: 'Reports',  icon: 'bar-chart-outline',   iconActive: 'bar-chart',    permission: 'canAccessDashboard' },
  { key: 'SettingsTab',  label: 'Settings', icon: 'settings-outline',    iconActive: 'settings',     permission: 'canAccessSettings'  },
];

// ─── CUSTOM TAB BAR ───────────────────────────────────────────────────────────
function CustomTabBar({ state, navigation }) {
  const { itemCount } = useCart();
  const { isDark } = useApp();
  const { permissions, currentStaff, logout } = useStaff();

  const pb = Platform.OS === 'ios' ? 24 : 12;
  const visibleTabs = ALL_TABS.filter((t) => permissions?.[t.permission]);

  return (
    <View style={{ backgroundColor: isDark ? '#18181B' : '#FFFFFF', borderTopWidth: 1, borderTopColor: isDark ? '#27272A' : '#F3F4F6', paddingBottom: pb, paddingTop: 8, paddingHorizontal: 4 }}>
      {/* Staff bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: isDark ? '#27272A' : '#F3F4F6', marginBottom: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: `${ROLE_PERMISSIONS[currentStaff?.role]?.color || '#F97316'}20`, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={ROLE_PERMISSIONS[currentStaff?.role]?.icon || 'person-circle'} size={14} color={ROLE_PERMISSIONS[currentStaff?.role]?.color || '#F97316'} />
          </View>
          <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#D4D4D8' : '#374151' }}>{currentStaff?.name}</Text>
          <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999, backgroundColor: `${ROLE_PERMISSIONS[currentStaff?.role]?.color || '#F97316'}20` }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: ROLE_PERMISSIONS[currentStaff?.role]?.color || '#F97316' }}>
              {ROLE_PERMISSIONS[currentStaff?.role]?.label || 'Staff'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => Alert.alert('Log Out', `Log out ${currentStaff?.name}?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log Out', style: 'destructive', onPress: logout },
          ])}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: isDark ? '#27272A' : '#F3F4F6' }}
        >
          <Ionicons name="log-out-outline" size={13} color={isDark ? '#71717A' : '#9CA3AF'} />
          <Text style={{ fontSize: 11, fontWeight: '600', color: isDark ? '#71717A' : '#9CA3AF' }}>Log out</Text>
        </TouchableOpacity>
      </View>

      {/* Tab buttons */}
      <View style={{ flexDirection: 'row' }}>
        {state.routes.map((route, index) => {
          const tab = ALL_TABS.find((t) => t.key === route.name);
          if (!tab || !permissions?.[tab.permission]) return null;
          const isActive = state.index === index;
          const showBadge = tab.key === 'POSTab' && itemCount > 0;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => { if (!isActive) navigation.navigate(route.name); }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 4 }}
              activeOpacity={0.7}
            >
              <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center', width: 28, height: 28 }}>
                <Ionicons
                  name={isActive ? tab.iconActive : tab.icon}
                  size={24}
                  color={isActive ? '#F97316' : isDark ? '#52525B' : '#D1D5DB'}
                />
                {showBadge && (
                  <View style={{ position: 'absolute', top: -2, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: 'white' }}>{itemCount}</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 10, fontWeight: isActive ? '700' : '500', color: isActive ? '#F97316' : isDark ? '#52525B' : '#D1D5DB' }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── MAIN NAVIGATOR ───────────────────────────────────────────────────────────
export default function AppNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="POSTab"       component={POSStackNavigator} />
      <Tab.Screen name="MenuTab"      component={MenuScreen} />
      <Tab.Screen name="OrdersTab"    component={OrdersScreen} />
      <Tab.Screen name="DashboardTab" component={DashboardScreen} />
      <Tab.Screen name="SettingsTab"  component={SettingsScreen} />
    </Tab.Navigator>
  );
}