import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal,
  TextInput, Alert, Switch, ScrollView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as XLSX from 'xlsx';
import { getMenuItems, getCategories, addMenuItem, updateMenuItem, deleteMenuItem } from '../../database';
import { useApp } from '../../context/AppContext';
import { Button, Card, Divider, EmptyState } from '../../components/common';
import { CategoryPills } from '../../components/common/CategoryPills';

// ─── EMOJI LIBRARY ────────────────────────────────────────────────────────────
const FOOD_EMOJIS = [
  '🍚','🍗','🍖','🍲','🐟','🍳','🥚','🥩','🌯','🍟',
  '🥤','☕','🥥','🧋','💧','🍧','🍮','🍰','🫕','🍡',
  '🐠','🍽️','🌭','🥫','🥦','🌽','🍋','🫙','🧇','🥗',
  '🫔','🥐','🍞','🧆','🥙','🍜','🍣','🍱','🥟','🦐',
];

// ─── CSV PARSER ───────────────────────────────────────────────────────────────
const parseCSV = (text) => {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  // Normalize headers to lowercase and trim
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, '').replace(/\r/g, ''));
  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/"/g, '').replace(/\r/g, ''));
      const obj = {};
      headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
      return obj;
    })
    .filter(r => r.name && r.name.length > 0 && r.price && !isNaN(parseFloat(r.price)));
};

// ─── EXCEL PARSER ────────────────────────────────────────────────────────────
const parseExcel = async (uri) => {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    const workbook = XLSX.read(base64, { type: 'base64' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    const mapped = rows.map(row => {
      const normalized = {};
      Object.keys(row).forEach(k => {
        const key = k.toLowerCase().trim().replace(/\s+/g, '_');
        normalized[key] = String(row[k]).trim();
      });
      return normalized;
    });
    const filtered = mapped.filter(r => {
      const hasName = r.name && r.name.length > 0;
      const hasPrice = r.price && !isNaN(parseFloat(r.price));
      return hasName && hasPrice;
    });
    return filtered;
  } catch (e) {
    console.warn('Excel parse error:', e.message);
    return [];
  }
};

// ─── ITEM FORM MODAL ──────────────────────────────────────────────────────────
const ItemFormModal = ({ visible, item, categories, onSave, onClose, isDark }) => {
  const [form, setForm] = useState({
    name: '', description: '', price: '',
    category_id: null, image_emoji: '🍽️',
    image_uri: null, is_available: true, is_featured: false,
  });
  const [activeTab, setActiveTab] = useState('emoji'); // 'emoji' | 'camera'

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name, description: item.description || '',
        price: String(item.price), category_id: item.category_id,
        image_emoji: item.image_emoji || '🍽️', image_uri: item.image_uri || null,
        is_available: item.is_available === 1, is_featured: item.is_featured === 1,
      });
    } else {
      setForm({ name: '', description: '', price: '', category_id: categories[0]?.id || null, image_emoji: '🍽️', image_uri: null, is_available: true, is_featured: false });
    }
  }, [item, visible]);

  const pickImage = async (source) => {
    try {
      let result;
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) return Alert.alert('Permission needed', 'Camera permission is required.');
        result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) return Alert.alert('Permission needed', 'Gallery permission is required.');
        result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
      }
      if (!result.canceled && result.assets?.[0]) {
        setForm(f => ({ ...f, image_uri: result.assets[0].uri, image_emoji: null }));
      }
    } catch (e) { Alert.alert('Error', 'Could not pick image.'); }
  };

  const bg = isDark ? '#18181B' : '#FFFFFF';
  const borderC = isDark ? '#27272A' : '#F3F4F6';
  const textPri = isDark ? '#FFFFFF' : '#111827';
  const textMut = isDark ? '#71717A' : '#9CA3AF';
  const inputStyle = { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, borderColor: isDark ? '#3F3F46' : '#E5E7EB', backgroundColor: isDark ? '#27272A' : '#FFFFFF', color: isDark ? '#FFFFFF' : '#111827' };
  const labelStyle = { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, color: textMut };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: borderC }}>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#EF4444' }}>Cancel</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 16, fontWeight: '700', color: textPri }}>{item ? 'Edit Item' : 'Add Item'}</Text>
          <TouchableOpacity onPress={() => {
            if (!form.name.trim()) return Alert.alert('Error', 'Item name is required');
            if (!form.price || isNaN(parseFloat(form.price))) return Alert.alert('Error', 'Valid price is required');
            onSave({ ...form, price: parseFloat(form.price) });
          }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#F97316' }}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} showsVerticalScrollIndicator={false}>

          {/* Image Section */}
          <Card>
            <Text style={labelStyle}>Item Image</Text>
            {/* Tab toggle */}
            <View style={{ flexDirection: 'row', borderRadius: 12, overflow: 'hidden', borderWidth: 1.5, borderColor: isDark ? '#3F3F46' : '#E5E7EB', marginBottom: 14 }}>
              {['emoji', 'camera'].map((tab) => (
                <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={{ flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: activeTab === tab ? '#F97316' : 'transparent' }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: activeTab === tab ? '#FFFFFF' : textMut, textTransform: 'capitalize' }}>{tab === 'camera' ? 'Photo' : 'Emoji'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {activeTab === 'emoji' ? (
              <>
                {/* Current emoji preview */}
                <View style={{ alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 56 }}>{form.image_emoji || '🍽️'}</Text>
                </View>
                {/* Emoji grid */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {FOOD_EMOJIS.map((em) => (
                    <TouchableOpacity
                      key={em}
                      onPress={() => setForm(f => ({ ...f, image_emoji: em, image_uri: null }))}
                      style={{ width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: form.image_emoji === em ? '#F97316' : 'transparent', backgroundColor: form.image_emoji === em ? '#FFF7ED' : isDark ? '#27272A' : '#F9FAFB' }}
                    >
                      <Text style={{ fontSize: 22 }}>{em}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <View style={{ gap: 10 }}>
                {/* Photo preview */}
                {form.image_uri ? (
                  <View style={{ alignItems: 'center', marginBottom: 8 }}>
                    <Image source={{ uri: form.image_uri }} style={{ width: 100, height: 100, borderRadius: 16 }} />
                    <TouchableOpacity onPress={() => setForm(f => ({ ...f, image_uri: null, image_emoji: '🍽️' }))} style={{ marginTop: 8 }}>
                      <Text style={{ fontSize: 13, color: '#EF4444', fontWeight: '600' }}>Remove photo</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
                <TouchableOpacity
                  onPress={() => pickImage('camera')}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: isDark ? '#3F3F46' : '#E5E7EB', backgroundColor: isDark ? '#27272A' : '#F9FAFB' }}
                >
                  <Ionicons name="camera-outline" size={22} color={isDark ? '#9CA3AF' : '#6B7280'} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#D4D4D8' : '#374151' }}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => pickImage('gallery')}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: isDark ? '#3F3F46' : '#E5E7EB', backgroundColor: isDark ? '#27272A' : '#F9FAFB' }}
                >
                  <Ionicons name="image-outline" size={22} color={isDark ? '#9CA3AF' : '#6B7280'} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#D4D4D8' : '#374151' }}>Choose from Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>

          {/* Name */}
          <Card>
            <Text style={labelStyle}>Item Name *</Text>
            <TextInput value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Chicken Adobo" placeholderTextColor={textMut} style={inputStyle} />
          </Card>

          {/* Description */}
          <Card>
            <Text style={labelStyle}>Description</Text>
            <TextInput value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} placeholder="Short description" placeholderTextColor={textMut} multiline numberOfLines={2} style={[inputStyle, { minHeight: 64, textAlignVertical: 'top' }]} />
          </Card>

          {/* Price */}
          <Card>
            <Text style={labelStyle}>Price (₱) *</Text>
            <TextInput value={form.price} onChangeText={v => setForm(f => ({ ...f, price: v }))} placeholder="0.00" keyboardType="decimal-pad" placeholderTextColor={textMut} style={inputStyle} />
          </Card>

          {/* Category */}
          <Card>
            <Text style={labelStyle}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {categories.map((cat) => (
                <TouchableOpacity key={cat.id} onPress={() => setForm(f => ({ ...f, category_id: cat.id }))}
                  style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, minHeight: 34, justifyContent: 'center', borderColor: form.category_id === cat.id ? '#F97316' : isDark ? '#3F3F46' : '#E5E7EB', backgroundColor: form.category_id === cat.id ? '#F97316' : isDark ? '#27272A' : '#FFFFFF' }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: form.category_id === cat.id ? '#FFFFFF' : isDark ? '#D4D4D8' : '#4B5563', includeFontPadding: false, lineHeight: 16 }}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Card>

          {/* Toggles */}
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: textPri }}>Available</Text>
                <Text style={{ fontSize: 12, color: textMut, marginTop: 1 }}>Show on POS menu</Text>
              </View>
              <Switch value={form.is_available} onValueChange={v => setForm(f => ({ ...f, is_available: v }))} trackColor={{ true: '#F97316', false: isDark ? '#3A3A3C' : '#E5E5EA' }} />
            </View>
            <Divider />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: textPri }}>Featured ⭐</Text>
                <Text style={{ fontSize: 12, color: textMut, marginTop: 1 }}>Show star badge</Text>
              </View>
              <Switch value={form.is_featured} onValueChange={v => setForm(f => ({ ...f, is_featured: v }))} trackColor={{ true: '#F59E0B', false: isDark ? '#3A3A3C' : '#E5E5EA' }} />
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// ─── BULK IMPORT MODAL ────────────────────────────────────────────────────────
const BulkImportModal = ({ visible, onClose, onImport, isDark }) => {
  const [preview, setPreview] = useState([]);
  const [fileName, setFileName] = useState('');

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values',
               'application/vnd.ms-excel',
               'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;

      const name = asset.name || '';
      const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls');

      let parsed = [];
      if (isExcel) {
        parsed = await parseExcel(asset.uri);
        if (parsed.length === 0) return Alert.alert('Invalid File', 'No valid rows found. Make sure your Excel file has "name" and "price" columns.');
      } else {
        const text = await FileSystem.readAsStringAsync(asset.uri);
        parsed = parseCSV(text);
        if (parsed.length === 0) return Alert.alert('Invalid File', 'No valid rows found. Make sure your CSV has "name" and "price" columns.');
      }
      setPreview(parsed);
      setFileName(name);
    } catch (e) {
      console.warn('File pick error:', e.message);
      Alert.alert('Error', 'Could not read file. Make sure it is a valid CSV or Excel file.');
    }
  };

  const bg = isDark ? '#18181B' : '#FFFFFF';
  const borderC = isDark ? '#27272A' : '#F3F4F6';
  const textPri = isDark ? '#FFFFFF' : '#111827';
  const textMut = isDark ? '#71717A' : '#9CA3AF';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: borderC }}>
          <TouchableOpacity onPress={() => { setPreview([]); setFileName(''); onClose(); }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#EF4444' }}>Cancel</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 16, fontWeight: '700', color: textPri }}>Bulk Import</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          {/* Instructions */}
          <Card>
            <Text style={{ fontSize: 14, fontWeight: '700', color: textPri, marginBottom: 8 }}>CSV Format</Text>
            <View style={{ backgroundColor: isDark ? '#27272A' : '#F9FAFB', borderRadius: 10, padding: 12 }}>
              <Text style={{ fontFamily: 'monospace', fontSize: 11, color: isDark ? '#9CA3AF' : '#6B7280', lineHeight: 18 }}>
                {'name,price,description,category\n"Chicken Adobo",85,"Classic adobo",Rice Meals\n"Iced Coffee",65,"Creamy blend",Coffee'}
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: textMut, marginTop: 8 }}>Required: name, price. Optional: description, category</Text>
            <Text style={{ fontSize: 12, color: textMut, marginTop: 4 }}>Supports: CSV (.csv) and Excel (.xlsx)</Text>
          </Card>

          {/* Pick button */}
          <TouchableOpacity
            onPress={handlePickFile}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14, borderWidth: 2, borderColor: '#F97316', borderStyle: 'dashed', backgroundColor: isDark ? '#27272A' : '#FFF7ED' }}
          >
            <Ionicons name="document-text-outline" size={24} color="#F97316" />
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#F97316' }}>
              {fileName || 'Select CSV or Excel File'}
            </Text>
          </TouchableOpacity>

          {/* Preview */}
          {preview.length > 0 && (
            <Card>
              <Text style={{ fontSize: 14, fontWeight: '700', color: textPri, marginBottom: 10 }}>Preview ({preview.length} items)</Text>
              {preview.slice(0, 8).map((row, i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: i < Math.min(preview.length, 8) - 1 ? 1 : 0, borderBottomColor: borderC }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: textPri }}>{row.name}</Text>
                    {row.category ? <Text style={{ fontSize: 11, color: textMut, marginTop: 1 }}>{row.category}</Text> : null}
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#F97316' }}>₱{row.price}</Text>
                </View>
              ))}
              {preview.length > 8 && (
                <Text style={{ fontSize: 12, color: textMut, textAlign: 'center', marginTop: 8 }}>+{preview.length - 8} more items</Text>
              )}
              <Button
                title={`Import ${preview.length} Items`}
                onPress={() => { onImport(preview); setPreview([]); setFileName(''); onClose(); }}
                style={{ marginTop: 14 }}
                iconName="cloud-upload-outline"
              />
            </Card>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// ─── MENU ITEM ROW ────────────────────────────────────────────────────────────
const MenuItemRow = ({ item, onEdit, onDelete, isDark }) => {
  const borderC = isDark ? '#27272A' : '#F3F4F6';
  const textPri = isDark ? '#FFFFFF' : '#111827';
  const textMut = isDark ? '#71717A' : '#9CA3AF';

  return (
    <TouchableOpacity
      onPress={() => onEdit(item)}
      activeOpacity={0.75}
      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: borderC, backgroundColor: isDark ? '#18181B' : '#FFFFFF' }}
    >
      {/* Image or Emoji */}
      <View style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: isDark ? '#27272A' : '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' }}>
        {item.image_uri ? (
          <Image source={{ uri: item.image_uri }} style={{ width: 46, height: 46 }} />
        ) : (
          <Text style={{ fontSize: 24 }}>{item.image_emoji || '🍽️'}</Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: textPri }}>{item.name}</Text>
          {item.is_featured === 1 && <Ionicons name="star" size={12} color="#F59E0B" />}
          {item.is_available === 0 && (
            <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999 }}>
              <Text style={{ fontSize: 10, color: '#DC2626', fontWeight: '600' }}>Unavailable</Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 12, color: textMut, marginTop: 2 }}>{item.category_name || 'Uncategorized'}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: '#F97316' }}>₱{Number(item.price).toFixed(2)}</Text>
        <TouchableOpacity
          onPress={() => onDelete(item.id)}
          style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: isDark ? '#2D1B1B' : '#FEE2E2', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="trash-outline" size={16} color="#DC2626" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function MenuScreen() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const { isDark } = useApp();

  const bg = isDark ? '#000000' : '#F2F2F7';
  const surfBg = isDark ? '#18181B' : '#FFFFFF';
  const borderC = isDark ? '#27272A' : '#F3F4F6';
  const textPri = isDark ? '#FFFFFF' : '#111827';
  const textMut = isDark ? '#71717A' : '#9CA3AF';

  useEffect(() => { loadData(); }, []);
  useEffect(() => { loadItems(); }, [selectedCat]);

  const loadData = useCallback(() => { setCategories(getCategories()); loadItems(); }, []);
  const loadItems = useCallback(() => {
    try { setItems(getMenuItems(selectedCat)); } catch (e) { console.warn(e); }
  }, [selectedCat]);

  const handleSave = (form) => {
    if (editItem) updateMenuItem(editItem.id, form);
    else addMenuItem(form);
    setShowForm(false); setEditItem(null); loadItems();
  };

  const handleDelete = (id) => {
    Alert.alert('Remove Item', 'Remove this item from the menu?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => { deleteMenuItem(id); loadItems(); } },
    ]);
  };

  const handleBulkImport = (rows) => {
    let imported = 0;
    rows.forEach(row => {
      try {
        const catMatch = categories.find(c => c.name.toLowerCase() === (row.category || '').toLowerCase());
        addMenuItem({
          name: row.name,
          description: row.description || '',
          price: parseFloat(row.price),
          category_id: catMatch?.id || null,
          image_emoji: '🍽️',
          is_available: 1,
          is_featured: 0,
        });
        imported++;
      } catch (e) { console.warn('Import row failed:', e); }
    });
    loadItems();
    Alert.alert('Import Complete', `Successfully imported ${imported} items.`);
  };

  const filteredItems = search.trim()
    ? items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      {/* Header */}
      <View style={{ backgroundColor: surfBg, borderBottomWidth: 1, borderBottomColor: borderC }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: textPri }}>Menu</Text>
            <Text style={{ fontSize: 12, color: textMut, marginTop: 1 }}>{items.length} items</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => setShowImport(true)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5, borderColor: isDark ? '#3F3F46' : '#E5E7EB', backgroundColor: isDark ? '#27272A' : '#FFFFFF' }}
            >
              <Ionicons name="cloud-upload-outline" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#D4D4D8' : '#374151' }}>Import</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setEditItem(null); setShowForm(true); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#F97316' }}
            >
              <Ionicons name="add" size={16} color="white" />
              <Text style={{ fontSize: 12, fontWeight: '700', color: 'white' }}>Add Item</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: isDark ? '#27272A' : '#F3F4F6', borderRadius: 12, borderWidth: 1, borderColor: borderC }}>
          <Ionicons name="search-outline" size={15} color={textMut} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search items..."
            placeholderTextColor={textMut}
            style={{ flex: 1, fontSize: 13, color: textPri, padding: 0 }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={15} color={textMut} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter */}
      <CategoryPills
        categories={categories}
        selected={selectedCat}
        onSelect={(id) => setSelectedCat(id)}
        isDark={isDark}
      />

      {/* List */}
      {filteredItems.length === 0 ? (
        <EmptyState
          iconName="restaurant-outline"
          title="No items"
          subtitle={search ? 'No items match your search' : 'Add your first menu item'}
          action={!search && <Button title="Add Item" onPress={() => { setEditItem(null); setShowForm(true); }} />}
        />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <MenuItemRow
              item={item}
              onEdit={(i) => { setEditItem(i); setShowForm(true); }}
              onDelete={handleDelete}
              isDark={isDark}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      <ItemFormModal
        visible={showForm}
        item={editItem}
        categories={categories}
        onSave={handleSave}
        onClose={() => { setShowForm(false); setEditItem(null); }}
        isDark={isDark}
      />

      <BulkImportModal
        visible={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleBulkImport}
        isDark={isDark}
      />
    </SafeAreaView>
  );
}