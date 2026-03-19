import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal,
  Alert, RefreshControl, TextInput, ScrollView, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getOrdersFiltered, getOrderById, voidOrder } from '../../database';
import { useApp } from '../../context/AppContext';
import { Button, Card, Divider, EmptyState } from '../../components/common';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  completed: { bg: '#DCFCE7', text: '#16A34A', label: 'Completed' },
  voided:    { bg: '#FEE2E2', text: '#DC2626', label: 'Voided'    },
  pending:   { bg: '#FEF9C3', text: '#CA8A04', label: 'Pending'   },
};
const PAY_ICONS = {
  cash:  'cash-outline',
  gcash: 'phone-portrait-outline',
};
const DATE_FILTERS = [
  { id: 'today',   label: 'Today' },
  { id: 'week',    label: 'This Week' },
  { id: 'month',   label: 'This Month' },
  { id: 'all',     label: 'All' },
  { id: 'custom',  label: 'Custom' },
];
const PAY_FILTERS = [
  { id: null,    label: 'All' },
  { id: 'cash',  label: 'Cash' },
  { id: 'gcash', label: 'GCash' },
];
const STATUS_FILTERS = [
  { id: null,        label: 'All' },
  { id: 'completed', label: 'Completed' },
  { id: 'voided',    label: 'Voided' },
];

const fmt = (d) => d.toISOString().slice(0, 10);

const getDateRange = (filterId) => {
  const today = new Date();
  if (filterId === 'today') return { from: fmt(today), to: fmt(today) };
  if (filterId === 'week') {
    const from = new Date(today); from.setDate(today.getDate() - 6);
    return { from: fmt(from), to: fmt(today) };
  }
  if (filterId === 'month') {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: fmt(from), to: fmt(today) };
  }
  return { from: null, to: null }; // 'all' and 'custom' handled separately
};

// ─── MINI CALENDAR ────────────────────────────────────────────────────────────
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const MiniCalendar = ({ selectedFrom, selectedTo, onSelectDate, isDark }) => {
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  const textPri = isDark ? '#FFFFFF' : '#111827';
  const textMut = isDark ? '#71717A' : '#9CA3AF';
  const cellBg  = isDark ? '#27272A' : '#F9FAFB';
  const today   = fmt(new Date());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const getCellDate = (d) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${viewYear}-${mm}-${dd}`;
  };

  const isSelected = (d) => {
    if (!d) return false;
    const date = getCellDate(d);
    return date === selectedFrom || date === selectedTo;
  };

  const isInRange = (d) => {
    if (!d || !selectedFrom || !selectedTo) return false;
    const date = getCellDate(d);
    return date > selectedFrom && date < selectedTo;
  };

  const isToday = (d) => d && getCellDate(d) === today;
  const isFuture = (d) => d && getCellDate(d) > today;

  return (
    <View>
      {/* Month navigation */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <TouchableOpacity onPress={prevMonth} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: cellBg, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="chevron-back" size={18} color={textPri} />
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: '700', color: textPri }}>
          {MONTHS[viewMonth]} {viewYear}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: cellBg, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="chevron-forward" size={18} color={textPri} />
        </TouchableOpacity>
      </View>

      {/* Day headers */}
      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        {DAYS.map((day) => (
          <Text key={day} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: textMut }}>
            {day}
          </Text>
        ))}
      </View>

      {/* Grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((d, i) => {
          const selected = isSelected(d);
          const inRange  = isInRange(d);
          const todayCell = isToday(d);
          const future   = isFuture(d);
          return (
            <TouchableOpacity
              key={i}
              disabled={!d || future}
              onPress={() => d && !future && onSelectDate(getCellDate(d))}
              style={{
                width: `${100 / 7}%`,
                aspectRatio: 1,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected ? '#F97316' : inRange ? '#FFF7ED' : 'transparent',
                borderRadius: selected ? 10 : 0,
              }}
            >
              {d ? (
                <Text style={{
                  fontSize: 13,
                  fontWeight: selected ? '800' : todayCell ? '700' : '400',
                  color: selected ? '#FFFFFF' : future ? (isDark ? '#3F3F46' : '#D1D5DB') : todayCell ? '#F97316' : inRange ? '#F97316' : textPri,
                }}>
                  {d}
                </Text>
              ) : null}
              {todayCell && !selected && (
                <View style={{ position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: '#F97316' }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ─── DATE RANGE PICKER MODAL ──────────────────────────────────────────────────
const DateRangeModal = ({ visible, fromDate, toDate, onApply, onClose, isDark }) => {
  const [tempFrom, setTempFrom] = useState(fromDate || '');
  const [tempTo, setTempTo]     = useState(toDate || '');
  const [selecting, setSelecting] = useState('from'); // 'from' | 'to'

  useEffect(() => {
    if (visible) {
      setTempFrom(fromDate || '');
      setTempTo(toDate || '');
      setSelecting('from');
    }
  }, [visible]);

  const bg      = isDark ? '#18181B' : '#FFFFFF';
  const borderC = isDark ? '#27272A' : '#F3F4F6';
  const textPri = isDark ? '#FFFFFF' : '#111827';
  const textMut = isDark ? '#71717A' : '#9CA3AF';

  const handleSelectDate = (date) => {
    if (selecting === 'from') {
      setTempFrom(date);
      setTempTo('');
      setSelecting('to');
    } else {
      if (date < tempFrom) {
        // Swap if user picks earlier date as "to"
        setTempTo(tempFrom);
        setTempFrom(date);
      } else {
        setTempTo(date);
      }
      setSelecting('from');
    }
  };

  const formatDisplay = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const canApply = tempFrom && tempTo && tempFrom <= tempTo;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: borderC }}>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#EF4444' }}>Cancel</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 16, fontWeight: '700', color: textPri }}>Custom Range</Text>
          <TouchableOpacity
            onPress={() => canApply && onApply(tempFrom, tempTo)}
            disabled={!canApply}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: canApply ? '#F97316' : (isDark ? '#3F3F46' : '#D1D5DB') }}>Apply</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {/* From / To selector */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
            {[{ key: 'from', label: 'From', val: tempFrom }, { key: 'to', label: 'To', val: tempTo }].map((item) => (
              <TouchableOpacity
                key={item.key}
                onPress={() => setSelecting(item.key)}
                style={{
                  flex: 1, padding: 14, borderRadius: 14, borderWidth: 2,
                  borderColor: selecting === item.key ? '#F97316' : isDark ? '#3F3F46' : '#E5E7EB',
                  backgroundColor: selecting === item.key ? '#FFF7ED' : isDark ? '#27272A' : '#F9FAFB',
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: selecting === item.key ? '#F97316' : textMut, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
                  {item.label}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: item.val ? textPri : textMut }}>
                  {formatDisplay(item.val)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Instruction */}
          <Text style={{ fontSize: 12, color: textMut, textAlign: 'center', marginBottom: 20 }}>
            {selecting === 'from' ? 'Tap a date to set start' : 'Now tap a date to set end'}
          </Text>

          {/* Calendar */}
          <MiniCalendar
            selectedFrom={tempFrom}
            selectedTo={tempTo}
            onSelectDate={handleSelectDate}
            isDark={isDark}
          />

          {/* Quick presets inside modal */}
          <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: borderC, paddingTop: 20 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: textMut, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Quick Select</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {[
                { label: 'Last 7 days',  days: 7  },
                { label: 'Last 14 days', days: 14 },
                { label: 'Last 30 days', days: 30 },
                { label: 'Last 90 days', days: 90 },
              ].map((p) => {
                const to   = new Date();
                const from = new Date(); from.setDate(to.getDate() - (p.days - 1));
                const fStr = fmt(from);
                const tStr = fmt(to);
                const active = tempFrom === fStr && tempTo === tStr;
                return (
                  <TouchableOpacity
                    key={p.label}
                    onPress={() => { setTempFrom(fStr); setTempTo(tStr); setSelecting('from'); }}
                    style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, minHeight: 34, justifyContent: 'center', borderColor: active ? '#F97316' : isDark ? '#3F3F46' : '#E5E7EB', backgroundColor: active ? '#F97316' : isDark ? '#27272A' : '#FFFFFF' }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: active ? '#FFFFFF' : textMut, includeFontPadding: false, lineHeight: 16 }}>{p.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// ─── FILTER CHIP ─────────────────────────────────────────────────────────────
const FilterChip = ({ label, active, onPress, isDark }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={{
      marginRight: 20,
      paddingVertical: 10,
      minHeight: 40,
      justifyContent: 'center',
      alignItems: 'center',
      borderBottomWidth: 2.5,
      borderBottomColor: active ? '#F97316' : 'transparent',
    }}
  >
    <Text style={{
      fontSize: 13,
      fontWeight: active ? '700' : '500',
      color: active ? '#F97316' : isDark ? '#71717A' : '#9CA3AF',
      includeFontPadding: false,
      lineHeight: 18,
    }}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ─── ORDER ROW ────────────────────────────────────────────────────────────────
const OrderRow = ({ order, onPress, formatCurrency, isDark }) => {
  const s = STATUS_STYLES[order.status] || STATUS_STYLES.pending;
  const date = new Date(order.created_at);
  const borderC = isDark ? '#27272A' : '#F3F4F6';
  return (
    <TouchableOpacity
      onPress={() => onPress(order)}
      activeOpacity={0.75}
      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: borderC, backgroundColor: isDark ? '#18181B' : '#FFFFFF' }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: isDark ? '#27272A' : '#F3F4F6' }}>
        <Ionicons name={PAY_ICONS[order.payment_method] || 'card-outline'} size={18} color={isDark ? '#71717A' : '#9CA3AF'} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#FFFFFF' : '#111827' }}>{order.order_number}</Text>
        <Text style={{ fontSize: 12, color: isDark ? '#71717A' : '#9CA3AF', marginTop: 2 }}>
          {date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
          {'  ·  '}
          {date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: '#F97316' }}>{formatCurrency(order.total)}</Text>
        <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: s.bg }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: s.text }}>{s.label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── ORDER DETAIL MODAL ───────────────────────────────────────────────────────
const OrderDetailModal = ({ order, onClose, onVoid, formatCurrency, isDark }) => {
  if (!order) return null;
  const s = STATUS_STYLES[order.status] || STATUS_STYLES.pending;
  const bg = isDark ? '#18181B' : '#FFFFFF';
  const borderC = isDark ? '#27272A' : '#F3F4F6';
  const textPri = isDark ? '#FFFFFF' : '#111827';
  const textMut = isDark ? '#71717A' : '#9CA3AF';

  return (
    <Modal visible={!!order} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: borderC }}>
          <TouchableOpacity onPress={onClose} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? '#27272A' : '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#374151'} />
          </TouchableOpacity>
          <Text style={{ fontSize: 16, fontWeight: '700', color: textPri }}>Order Detail</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={{ flex: 1, padding: 16, gap: 12 }}>
          {/* Info Card */}
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={{ fontSize: 20, fontWeight: '800', color: textPri }}>{order.order_number}</Text>
                <Text style={{ fontSize: 12, color: textMut, marginTop: 4 }}>
                  {new Date(order.created_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                </Text>
                <Text style={{ fontSize: 12, color: textMut, marginTop: 2 }}>Cashier: {order.cashier || 'Staff'}</Text>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: s.bg }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: s.text }}>{s.label}</Text>
              </View>
            </View>
          </Card>

          {/* Items */}
          <Card>
            <Text style={{ fontSize: 13, fontWeight: '700', color: textPri, marginBottom: 10 }}>Items Ordered</Text>
            {order.items?.map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: i < order.items.length - 1 ? 1 : 0, borderBottomColor: borderC }}>
                <Text style={{ fontSize: 13, color: textMut, width: 28 }}>{item.quantity}×</Text>
                <Text style={{ flex: 1, fontSize: 13, color: textPri }}>{item.name}</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: textPri }}>{formatCurrency(item.subtotal)}</Text>
              </View>
            ))}
            <Divider />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: textPri }}>Total</Text>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#F97316' }}>{formatCurrency(order.total)}</Text>
            </View>
          </Card>

          {/* Payment */}
          <Card>
            <Text style={{ fontSize: 13, fontWeight: '700', color: textPri, marginBottom: 10 }}>Payment</Text>
            {[
              { label: 'Method', value: order.payment_method?.toUpperCase() },
              order.cash_amount > 0 && { label: 'Cash paid', value: formatCurrency(order.cash_amount) },
              order.gcash_amount > 0 && { label: 'GCash paid', value: formatCurrency(order.gcash_amount) },
              order.amount_tendered > 0 && order.payment_method !== 'split' && { label: 'Tendered', value: formatCurrency(order.amount_tendered) },
              order.change_amount > 0 && { label: 'Change', value: formatCurrency(order.change_amount), highlight: true },
              order.discount > 0 && { label: 'Discount', value: `-${formatCurrency(order.discount)}`, highlight: true },
            ].filter(Boolean).map((row, i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
                <Text style={{ fontSize: 13, color: textMut }}>{row.label}</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: row.highlight ? '#F97316' : textPri }}>{row.value}</Text>
              </View>
            ))}
          </Card>
        </View>

        {order.status === 'completed' && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: borderC }}>
            <Button title="Void Order" onPress={() => onVoid(order.id)} variant="danger" iconName="trash-outline" />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

// ─── SUMMARY BAR ─────────────────────────────────────────────────────────────
const SummaryBar = ({ orders, formatCurrency, isDark }) => {
  const completed = orders.filter(o => o.status === 'completed');
  const total = completed.reduce((s, o) => s + (o.total || 0), 0);
  const bg = isDark ? '#27272A' : '#F9FAFB';
  const borderC = isDark ? '#3F3F46' : '#E5E7EB';
  const textPri = isDark ? '#FFFFFF' : '#111827';
  const textMut = isDark ? '#71717A' : '#9CA3AF';

  return (
    <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: bg, borderBottomWidth: 1, borderBottomColor: borderC, gap: 16 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: textMut }}>Orders</Text>
        <Text style={{ fontSize: 16, fontWeight: '800', color: textPri }}>{completed.length}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: textMut }}>Sales</Text>
        <Text style={{ fontSize: 16, fontWeight: '800', color: '#F97316' }}>{formatCurrency(total)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: textMut }}>Avg</Text>
        <Text style={{ fontSize: 16, fontWeight: '800', color: textPri }}>
          {formatCurrency(completed.length > 0 ? total / completed.length : 0)}
        </Text>
      </View>
    </View>
  );
};

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [payFilter, setPayFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const { formatCurrency, isDark } = useApp();

  const bg = isDark ? '#000000' : '#F2F2F7';
  const surfBg = isDark ? '#18181B' : '#FFFFFF';
  const borderC = isDark ? '#27272A' : '#F3F4F6';
  const textPri = isDark ? '#FFFFFF' : '#111827';
  const textMut = isDark ? '#71717A' : '#9CA3AF';

  useEffect(() => { loadOrders(); }, [search, dateFilter, payFilter, statusFilter, customFrom, customTo]);

  const loadOrders = useCallback(() => {
    setRefreshing(true);
    try {
      let from, to;
      if (dateFilter === 'custom') {
        from = customFrom || null;
        to   = customTo   || null;
      } else {
        ({ from, to } = getDateRange(dateFilter));
      }
      const results = getOrdersFiltered({
        search,
        dateFrom: from,
        dateTo: to,
        paymentMethod: payFilter,
        status: statusFilter,
      });
      setOrders(results);
    } catch (e) { console.warn(e); }
    finally { setRefreshing(false); }
  }, [search, dateFilter, payFilter, statusFilter, customFrom, customTo]);

  const handlePress = (order) => {
    try { setSelected(getOrderById(order.id)); } catch (e) { console.warn(e); }
  };

  const handleVoid = (id) => {
    Alert.alert('Void Order', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Void', style: 'destructive', onPress: () => { voidOrder(id); setSelected(null); loadOrders(); } },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 14, backgroundColor: surfBg, borderBottomWidth: 1, borderBottomColor: borderC }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: textPri }}>Orders</Text>

        {/* Search */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: isDark ? '#27272A' : '#F3F4F6', borderRadius: 12, borderWidth: 1, borderColor: borderC }}>
          <Ionicons name="search-outline" size={15} color={textMut} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search order number..."
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

      {/* ── FILTER PANEL ── */}
      <View style={{ backgroundColor: isDark ? '#111111' : '#F8F8F8', borderBottomWidth: 1, borderBottomColor: borderC }}>

        {/* Date row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: borderC }}>
          <Text numberOfLines={1} style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#52525B' : '#C4C4C4', textTransform: 'uppercase', letterSpacing: 1, width: 70, paddingLeft: 16 }}>Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
            {DATE_FILTERS.map((f) => (
              <FilterChip
                key={f.id}
                label={f.id === 'custom' && customFrom && customTo
                  ? `${customFrom.slice(5)} → ${customTo.slice(5)}`
                  : f.label}
                active={dateFilter === f.id}
                onPress={() => {
                  if (f.id === 'custom') { setDateFilter('custom'); setShowCalendar(true); }
                  else setDateFilter(f.id);
                }}
                isDark={isDark}
              />
            ))}
          </ScrollView>
        </View>

        {/* Payment row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: borderC }}>
          <Text numberOfLines={1} style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#52525B' : '#C4C4C4', textTransform: 'uppercase', letterSpacing: 1, width: 70, paddingLeft: 16 }}>Pay</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
            {PAY_FILTERS.map((f) => (
              <FilterChip key={String(f.id)} label={f.label} active={payFilter === f.id} onPress={() => setPayFilter(f.id)} isDark={isDark} />
            ))}
          </ScrollView>
        </View>

        {/* Status row */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text numberOfLines={1} style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#52525B' : '#C4C4C4', textTransform: 'uppercase', letterSpacing: 1, width: 70, paddingLeft: 16 }}>Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
            {STATUS_FILTERS.map((f) => (
              <FilterChip key={String(f.id)} label={f.label} active={statusFilter === f.id} onPress={() => setStatusFilter(f.id)} isDark={isDark} />
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Clear filters */}
      {(dateFilter !== 'today' || payFilter !== null || statusFilter !== null || search.length > 0) && (
        <View style={{ backgroundColor: isDark ? '#111111' : '#F8F8F8', flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: borderC }}>
          <TouchableOpacity
            onPress={() => { setDateFilter('today'); setPayFilter(null); setStatusFilter(null); setSearch(''); setCustomFrom(''); setCustomTo(''); }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Ionicons name="close-circle-outline" size={13} color="#F97316" />
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#F97316' }}>Clear all filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Summary Bar */}
      <SummaryBar orders={orders} formatCurrency={formatCurrency} isDark={isDark} />

      {/* List */}
      {orders.length === 0 ? (
        <EmptyState iconName="receipt-outline" title="No orders found" subtitle="Try adjusting your filters" />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(i) => String(i.id)}
          renderItem={({ item }) => (
            <OrderRow order={item} onPress={handlePress} formatCurrency={formatCurrency} isDark={isDark} />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadOrders} tintColor="#F97316" />}
          showsVerticalScrollIndicator={false}
        />
      )}

      <OrderDetailModal
        order={selected}
        onClose={() => setSelected(null)}
        onVoid={handleVoid}
        formatCurrency={formatCurrency}
        isDark={isDark}
      />

      <DateRangeModal
        visible={showCalendar}
        fromDate={customFrom}
        toDate={customTo}
        onApply={(from, to) => { setCustomFrom(from); setCustomTo(to); setShowCalendar(false); }}
        onClose={() => { setShowCalendar(false); if (!customFrom || !customTo) setDateFilter('today'); }}
        isDark={isDark}
      />
    </SafeAreaView>
  );
}