import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  TextInput, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getMenuItems, getCategories } from '../../database';
import { useCart } from '../../context/CartContext';
import { useApp } from '../../context/AppContext';
import { IconButton, EmptyState } from '../../components/common';
import { CategoryPills } from '../../components/common/CategoryPills';

// ─── MENU ITEM CARD ───────────────────────────────────────────────────────────
const MenuItemCard = React.memo(({ item, onPress, quantity, isDark }) => {
  const isInCart = quantity > 0;
  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      activeOpacity={0.85}
      style={{
        borderRadius: 16,
        borderWidth: 1.5,
        overflow: 'hidden',
        marginBottom: 10,
        borderColor: isInCart ? '#F97316' : isDark ? '#3F3F46' : '#F3F4F6',
        backgroundColor: isInCart ? '#FFF7ED' : isDark ? '#27272A' : '#FFFFFF',
      }}
    >
      <View style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        backgroundColor: isInCart ? '#FFEDD5' : isDark ? '#3F3F46' : '#F9FAFB',
      }}>
        <Ionicons name="fast-food-outline" size={28} color={isInCart ? '#F97316' : isDark ? '#52525B' : '#D1D5DB'} />
        {item.is_featured === 1 && (
          <View style={{ position: 'absolute', top: 6, left: 6, width: 18, height: 18, borderRadius: 9, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="star" size={9} color="white" />
          </View>
        )}
        {isInCart && (
          <View style={{ position: 'absolute', top: 6, right: 6, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 9, fontWeight: '800', color: 'white' }}>{quantity}</Text>
          </View>
        )}
      </View>
      <View style={{ padding: 8 }}>
        <Text numberOfLines={2} style={{ fontSize: 11, fontWeight: '600', color: isDark ? '#FFFFFF' : '#111827', lineHeight: 15, marginBottom: 4 }}>
          {item.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: '#F97316' }}>
            ₱{Number(item.price).toFixed(0)}
          </Text>
          <View style={{ width: 22, height: 22, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: isInCart ? '#F97316' : isDark ? '#3F3F46' : '#F3F4F6' }}>
            <Ionicons name={isInCart ? 'checkmark' : 'add'} size={13} color={isInCart ? 'white' : isDark ? '#9CA3AF' : '#6B7280'} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ─── CART ITEM ROW ────────────────────────────────────────────────────────────
const CartItemRow = ({ item, onIncrement, onDecrement, isDark }) => (
  <View style={{
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#27272A' : '#F3F4F6',
  }}>
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 }}>
      <Text
        style={{ flex: 1, fontSize: 12, fontWeight: '600', color: isDark ? '#FFFFFF' : '#111827', lineHeight: 16, paddingRight: 8 }}
        numberOfLines={2}
      >
        {item.name}
      </Text>
      <Text style={{ fontSize: 12, fontWeight: '800', color: '#F97316', flexShrink: 0 }}>
        ₱{(item.price * item.quantity).toFixed(2)}
      </Text>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <TouchableOpacity
        onPress={() => onDecrement(item.id)}
        style={{ width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#3F3F46' : '#F3F4F6' }}
      >
        <Ionicons name="remove" size={13} color={isDark ? '#E4E4E7' : '#374151'} />
      </TouchableOpacity>
      <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#FFFFFF' : '#111827', minWidth: 20, textAlign: 'center' }}>
        {item.quantity}
      </Text>
      <TouchableOpacity
        onPress={() => onIncrement(item.id)}
        style={{ width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F97316' }}
      >
        <Ionicons name="add" size={13} color="white" />
      </TouchableOpacity>
    </View>
  </View>
);

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function POSScreen({ navigation }) {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { addItem, increment, decrement, items, itemCount, total, subtotal } = useCart();
  const { formatCurrency, isDark } = useApp();

  useEffect(() => { loadData(); }, []);
  useEffect(() => { loadMenuItems(); }, [selectedCategory]);

  const loadData = useCallback(() => {
    try { setCategories(getCategories()); loadMenuItems(); }
    catch (e) { console.warn(e); }
  }, []);

  const loadMenuItems = useCallback(() => {
    try { setMenuItems(getMenuItems(selectedCategory)); }
    catch (e) { console.warn(e); }
  }, [selectedCategory]);

  const handleCategorySelect = useCallback((id) => {
    setSelectedCategory(id);
  }, []);

  const filteredItems = searchQuery.trim()
    ? menuItems.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : menuItems;

  const getQty = (id) => (items.find((i) => i.id === id) || {}).quantity || 0;

  const handleAddItem = (item) => {
    addItem({ id: item.id, name: item.name, price: item.price, image_emoji: item.image_emoji });
  };

  const bg      = isDark ? '#000000' : '#F2F2F7';
  const surfBg  = isDark ? '#18181B' : '#FFFFFF';
  const borderC = isDark ? '#27272A' : '#F3F4F6';
  const textPri = isDark ? '#FFFFFF' : '#111827';
  const textMut = isDark ? '#71717A' : '#9CA3AF';
  const inputBg = isDark ? '#27272A' : '#F9FAFB';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      {/* HEADER */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: surfBg, borderBottomWidth: 1, borderBottomColor: borderC }}>
        <View>
          <Text style={{ fontSize: 20, fontWeight: '800', color: textPri }}>New Order</Text>
          <Text style={{ fontSize: 11, color: textMut, marginTop: 1 }}>
            {new Date().toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })}
          </Text>
        </View>
        <IconButton iconName="receipt-outline" onPress={() => navigation.navigate('Orders')} />
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* MENU PANEL */}
        <View style={{ flex: 3, borderRightWidth: 1, borderRightColor: borderC }}>

          {/* Search */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, margin: 10, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: inputBg, borderRadius: 12, borderWidth: 1, borderColor: borderC }}>
            <Ionicons name="search-outline" size={15} color={textMut} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search menu..."
              placeholderTextColor={textMut}
              style={{ flex: 1, fontSize: 13, color: textPri, padding: 0 }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={15} color={textMut} />
              </TouchableOpacity>
            )}
          </View>

          {/* CATEGORY PILLS */}
          <CategoryPills
            categories={categories}
            selected={selectedCategory}
            onSelect={handleCategorySelect}
            isDark={isDark}
            style={{ marginBottom: 4 }}
          />

          {/* Menu Grid */}
          {filteredItems.length === 0 ? (
            <EmptyState iconName="fast-food-outline" title="No items found" subtitle="Try a different search" />
          ) : (
            <FlatList
              data={filteredItems}
              keyExtractor={(item) => String(item.id)}
              numColumns={2}
              contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 20 }}
              columnWrapperStyle={{ gap: 8 }}
              renderItem={({ item }) => (
                <View style={{ flex: 1 }}>
                  <MenuItemCard item={item} quantity={getQty(item.id)} onPress={handleAddItem} isDark={isDark} />
                </View>
              )}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* CART PANEL */}
        <View style={{ flex: 2, backgroundColor: surfBg, flexDirection: 'column' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: borderC }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: textPri }}>Order</Text>
            {itemCount > 0 && (
              <View style={{ backgroundColor: '#FFEDD5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#F97316' }}>{itemCount} items</Text>
              </View>
            )}
          </View>

          {items.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}>
              <Ionicons name="cart-outline" size={36} color={isDark ? '#3F3F46' : '#E5E7EB'} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: textMut, marginTop: 10 }}>Cart is empty</Text>
              <Text style={{ fontSize: 11, color: isDark ? '#3F3F46' : '#D1D5DB', marginTop: 4, textAlign: 'center' }}>Tap items to add</Text>
            </View>
          ) : (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 10 }} showsVerticalScrollIndicator={false}>
              {items.map((item) => (
                <CartItemRow key={item.id} item={item} onIncrement={increment} onDecrement={decrement} isDark={isDark} />
              ))}
            </ScrollView>
          )}

          <View style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12, borderTopWidth: 1, borderTopColor: borderC }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 11, color: textMut }}>Subtotal</Text>
              <Text style={{ fontSize: 11, color: isDark ? '#D4D4D8' : '#374151' }}>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingTop: 6, borderTopWidth: 1, borderTopColor: borderC }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: textPri }}>Total</Text>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#F97316' }}>{formatCurrency(total)}</Text>
            </View>
            <TouchableOpacity
              onPress={() => items.length > 0 && navigation.navigate('Checkout')}
              disabled={items.length === 0}
              activeOpacity={0.85}
              style={{ paddingVertical: 13, borderRadius: 14, alignItems: 'center', backgroundColor: items.length === 0 ? (isDark ? '#27272A' : '#E5E7EB') : '#F97316' }}
            >
              <Text style={{ fontSize: 13, fontWeight: '800', color: items.length === 0 ? textMut : '#FFFFFF' }}>
                {items.length === 0 ? 'Add items to order' : 'Checkout →'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}