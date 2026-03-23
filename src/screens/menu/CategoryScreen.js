import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getCategories, addCategory, updateCategory, deleteCategory, getCategoryItemCount, reorderCategory } from '../../database';
import { useApp } from '../../context/AppContext';

// ─── EMOJI PICKER ─────────────────────────────────────────────────────────────
const CATEGORY_EMOJIS = [
  '🍽️','🍚','🍗','🥩','🐟','🍜','🥗','🍱','🥘','🫕',
  '🍳','🧆','🌯','🥪','🍞','🥐','🍔','🌮','🌭','🍟',
  '🧁','🍰','🍩','🍪','🍫','🍬','🍦','☕','🧋','🥤',
  '🍵','🧃','💧','🥥','🍋','🍓','🍎','🫙','🧂','🥫',
];

// ─── CATEGORY FORM MODAL ──────────────────────────────────────────────────────
const CategoryFormModal = ({ visible, category, onSave, onClose, isDark }) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🍽️');

  useEffect(() => {
    if (category) { setName(category.name); setIcon(category.icon || '🍽️'); }
    else { setName(''); setIcon('🍽️'); }
  }, [category, visible]);

  const bg      = isDark ? '#18181B' : '#FFFFFF';
  const borderC = isDark ? '#27272A' : '#F3F4F6';
  const textPri = isDark ? '#FFFFFF' : '#111827';
  const textMut = isDark ? '#71717A' : '#9CA3AF';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: borderC }}>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#EF4444' }}>Cancel</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 16, fontWeight: '700', color: textPri }}>
            {category ? 'Edit Category' : 'Add Category'}
          </Text>
          <TouchableOpacity onPress={() => {
            if (!name.trim()) return Alert.alert('Error', 'Category name is required.');
            onSave({ name: name.trim(), icon });
          }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#F97316' }}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          {/* Preview */}
          <View style={{ alignItems: 'center', paddingVertical: 20, backgroundColor: isDark ? '#27272A' : '#F9FAFB', borderRadius: 16 }}>
            <Text style={{ fontSize: 56, marginBottom: 8 }}>{icon}</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: textPri }}>{name || 'Category Name'}</Text>
          </View>

          {/* Name input */}
          <View style={{ backgroundColor: isDark ? '#27272A' : '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: borderC }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: textMut, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Category Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Rice Meals, Drinks, Snacks"
              placeholderTextColor={textMut}
              style={{ fontSize: 16, color: textPri, padding: 0 }}
              autoFocus
            />
          </View>

          {/* Icon picker */}
          <View style={{ backgroundColor: isDark ? '#27272A' : '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: borderC }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: textMut, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Icon</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORY_EMOJIS.map((em) => (
                <TouchableOpacity
                  key={em}
                  onPress={() => setIcon(em)}
                  style={{ width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: icon === em ? '#F97316' : 'transparent', backgroundColor: icon === em ? '#FFF7ED' : isDark ? '#3F3F46' : '#F3F4F6' }}
                >
                  <Text style={{ fontSize: 22 }}>{em}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// ─── CATEGORY ROW ─────────────────────────────────────────────────────────────
const CategoryRow = ({ category, itemCount, onEdit, onDelete, onMoveUp, onMoveDown, isFirst, isLast, isDark }) => {
  const borderC = isDark ? '#27272A' : '#F3F4F6';
  const textPri = isDark ? '#FFFFFF' : '#111827';
  const textMut = isDark ? '#71717A' : '#9CA3AF';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: borderC, backgroundColor: isDark ? '#18181B' : '#FFFFFF' }}>
      {/* Reorder arrows */}
      <View style={{ gap: 2, marginRight: 10 }}>
        <TouchableOpacity onPress={onMoveUp} disabled={isFirst} style={{ opacity: isFirst ? 0.2 : 1 }}>
          <Ionicons name="chevron-up" size={16} color={textMut} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onMoveDown} disabled={isLast} style={{ opacity: isLast ? 0.2 : 1 }}>
          <Ionicons name="chevron-down" size={16} color={textMut} />
        </TouchableOpacity>
      </View>

      {/* Icon */}
      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: isDark ? '#27272A' : '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
        <Text style={{ fontSize: 22 }}>{category.icon || '🍽️'}</Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: textPri }}>{category.name}</Text>
        <Text style={{ fontSize: 12, color: textMut, marginTop: 1 }}>{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
      </View>

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity
          onPress={() => onEdit(category)}
          style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isDark ? '#27272A' : '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="pencil-outline" size={16} color={textMut} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onDelete(category)}
          style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isDark ? '#2D1B1B' : '#FEE2E2', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="trash-outline" size={16} color="#DC2626" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function CategoryScreen({ onClose }) {
  const [categories, setCategories] = useState([]);
  const [itemCounts, setItemCounts] = useState({});
  const [editCategory, setEditCategory] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { isDark } = useApp();

  const bg      = isDark ? '#000000' : '#F2F2F7';
  const surfBg  = isDark ? '#18181B' : '#FFFFFF';
  const borderC = isDark ? '#27272A' : '#F3F4F6';
  const textPri = isDark ? '#FFFFFF' : '#111827';
  const textMut = isDark ? '#71717A' : '#9CA3AF';

  useEffect(() => { load(); }, []);

  const load = useCallback(() => {
    try {
      const cats = getCategories();
      setCategories(cats);
      const counts = {};
      cats.forEach(c => { counts[c.id] = getCategoryItemCount(c.id); });
      setItemCounts(counts);
    } catch (e) { console.warn(e); }
  }, []);

  const handleSave = ({ name, icon }) => {
    if (editCategory) updateCategory(editCategory.id, name, icon);
    else addCategory(name, icon);
    setShowForm(false);
    setEditCategory(null);
    load();
  };

  const handleDelete = (category) => {
    const count = itemCounts[category.id] || 0;
    const msg = count > 0
      ? `"${category.name}" has ${count} item${count !== 1 ? 's' : ''}. They will become uncategorized.`
      : `Remove "${category.name}"?`;
    Alert.alert('Remove Category', msg, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => { deleteCategory(category.id); load(); } },
    ]);
  };

  const handleMove = (id, direction) => {
    reorderCategory(id, direction, categories);
    load();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: surfBg, borderBottomWidth: 1, borderBottomColor: borderC }}>
        <TouchableOpacity onPress={onClose} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isDark ? '#27272A' : '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="arrow-back" size={20} color={textPri} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: textPri }}>Categories</Text>
        <TouchableOpacity
          onPress={() => { setEditCategory(null); setShowForm(true); }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, backgroundColor: '#F97316' }}
        >
          <Ionicons name="add" size={16} color="white" />
          <Text style={{ fontSize: 13, fontWeight: '700', color: 'white' }}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Info banner */}
      <View style={{ margin: 16, padding: 14, borderRadius: 14, backgroundColor: isDark ? '#1E3A5F' : '#EFF6FF', flexDirection: 'row', gap: 10 }}>
        <Ionicons name="information-circle-outline" size={18} color="#3B82F6" />
        <Text style={{ flex: 1, fontSize: 13, color: isDark ? '#93C5FD' : '#2563EB', lineHeight: 18 }}>
          Use ↑↓ arrows to reorder. Deleting a category moves its items to Uncategorized.
        </Text>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(i) => String(i.id)}
        renderItem={({ item, index }) => (
          <CategoryRow
            category={item}
            itemCount={itemCounts[item.id] || 0}
            onEdit={(c) => { setEditCategory(c); setShowForm(true); }}
            onDelete={handleDelete}
            onMoveUp={() => handleMove(item.id, 'up')}
            onMoveDown={() => handleMove(item.id, 'down')}
            isFirst={index === 0}
            isLast={index === categories.length - 1}
            isDark={isDark}
          />
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 48 }}>
            <Ionicons name="grid-outline" size={48} color={isDark ? '#3F3F46' : '#E5E7EB'} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: textMut, marginTop: 12 }}>No categories yet</Text>
            <Text style={{ fontSize: 13, color: isDark ? '#52525B' : '#D1D5DB', marginTop: 4 }}>Tap Add to create your first category</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <CategoryFormModal
        visible={showForm}
        category={editCategory}
        onSave={handleSave}
        onClose={() => { setShowForm(false); setEditCategory(null); }}
        isDark={isDark}
      />
    </SafeAreaView>
  );
}