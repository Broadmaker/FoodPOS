import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useApp } from '../../context/AppContext';
import { getSalesSummaryRange, getTopItemsRange, getOrdersFiltered } from '../../database';

// ─── MINI CALENDAR (reuse same pattern as OrdersScreen) ──────────────────────
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const fmt = (d) => d.toISOString().slice(0, 10);

const MiniCalendar = ({ selectedFrom, selectedTo, onSelectDate, isDark }) => {
  const [viewYear, setViewYear]   = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  const textPri = isDark ? '#FFFFFF' : '#111827';
  const textMut = isDark ? '#71717A' : '#9CA3AF';
  const today   = fmt(new Date());

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); } else setViewMonth(m => m+1); };

  const firstDay     = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const getCellDate = (d) => `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const isSelected  = (d) => d && (getCellDate(d) === selectedFrom || getCellDate(d) === selectedTo);
  const isInRange   = (d) => d && selectedFrom && selectedTo && getCellDate(d) > selectedFrom && getCellDate(d) < selectedTo;
  const isToday     = (d) => d && getCellDate(d) === today;
  const isFuture    = (d) => d && getCellDate(d) > today;

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <TouchableOpacity onPress={prevMonth} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: isDark ? '#27272A' : '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="chevron-back" size={16} color={textPri} />
        </TouchableOpacity>
        <Text style={{ fontSize: 15, fontWeight: '700', color: textPri }}>{MONTHS[viewMonth]} {viewYear}</Text>
        <TouchableOpacity onPress={nextMonth} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: isDark ? '#27272A' : '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="chevron-forward" size={16} color={textPri} />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        {DAYS.map(d => <Text key={d} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: textMut }}>{d}</Text>)}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((d, i) => {
          const sel     = isSelected(d);
          const inRange = isInRange(d);
          const future  = isFuture(d);
          return (
            <TouchableOpacity
              key={i}
              disabled={!d || future}
              onPress={() => d && !future && onSelectDate(getCellDate(d))}
              style={{ width: `${100/7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: sel ? '#F97316' : inRange ? '#FFF7ED' : 'transparent', borderRadius: sel ? 10 : 0 }}
            >
              {d ? <Text style={{ fontSize: 13, fontWeight: sel ? '800' : '400', color: sel ? '#FFFFFF' : future ? (isDark ? '#3F3F46' : '#D1D5DB') : isToday(d) ? '#F97316' : inRange ? '#F97316' : textPri }}>{d}</Text> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ─── QUICK PRESETS ────────────────────────────────────────────────────────────
const PRESETS = [
  { label: 'Today',      getDates: () => { const t = fmt(new Date()); return { from: t, to: t }; } },
  { label: 'This Week',  getDates: () => { const t = new Date(); const f = new Date(t); f.setDate(t.getDate()-6); return { from: fmt(f), to: fmt(t) }; } },
  { label: 'This Month', getDates: () => { const t = new Date(); return { from: fmt(new Date(t.getFullYear(), t.getMonth(), 1)), to: fmt(t) }; } },
  { label: 'Last 30',    getDates: () => { const t = new Date(); const f = new Date(t); f.setDate(t.getDate()-29); return { from: fmt(f), to: fmt(t) }; } },
];

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function ExportScreen({ onClose }) {
  const { isDark, settings, formatCurrency } = useApp();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate]     = useState('');
  const [selecting, setSelecting] = useState('from');
  const [isExporting, setIsExporting] = useState(false);

  const bg      = isDark ? '#000000' : '#F2F2F7';
  const surfBg  = isDark ? '#18181B' : '#FFFFFF';
  const borderC = isDark ? '#27272A' : '#F3F4F6';
  const textPri = isDark ? '#FFFFFF' : '#111827';
  const textMut = isDark ? '#71717A' : '#9CA3AF';
  const cardStyle = { backgroundColor: surfBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: borderC, marginBottom: 12 };

  const formatDisplay = (dateStr) => {
    if (!dateStr) return 'Select date';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleSelectDate = (date) => {
    if (selecting === 'from') { setFromDate(date); setToDate(''); setSelecting('to'); }
    else {
      if (date < fromDate) { setToDate(fromDate); setFromDate(date); }
      else setToDate(date);
      setSelecting('from');
    }
  };

  const handleExport = async () => {
    if (!fromDate || !toDate) return Alert.alert('Select Dates', 'Please select both start and end dates.');
    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      // ── Sheet 1: Summary ────────────────────────────────────────────────
      const { summary, byPayment, byDay } = getSalesSummaryRange(fromDate, toDate);
      const summaryData = [
        ['FoodPOS Sales Report'],
        ['Shop', settings.shop_name || 'My Food Shop'],
        ['Period', `${formatDisplay(fromDate)} — ${formatDisplay(toDate)}`],
        ['Generated', new Date().toLocaleString('en-PH')],
        [],
        ['SUMMARY'],
        ['Total Orders', summary?.total_orders || 0],
        ['Total Sales', summary?.total_sales || 0],
        ['Total Discounts', summary?.total_discounts || 0],
        ['Average Order Value', Math.round((summary?.avg_order_value || 0) * 100) / 100],
        [],
        ['PAYMENT BREAKDOWN'],
        ['Method', 'Transactions', 'Amount'],
        ...(byPayment || []).map(p => [p.payment_method?.toUpperCase(), p.count, p.total]),
        [],
        ['DAILY SALES'],
        ['Date', 'Orders', 'Sales'],
        ...(byDay || []).map(d => [d.date, d.orders, d.sales]),
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
      ws1['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

      // ── Sheet 2: Item Breakdown ─────────────────────────────────────────
      const items = getTopItemsRange(fromDate, toDate, 100);
      const itemData = [
        ['Item Name', 'Qty Sold', 'Total Revenue'],
        ...(items || []).map((item, i) => [item.name, item.qty_sold, item.total_sales]),
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(itemData);
      ws2['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, ws2, 'Item Sales');

      // ── Sheet 3: Orders List ────────────────────────────────────────────
      const orders = getOrdersFiltered({ dateFrom: fromDate, dateTo: toDate, limit: 1000 });
      const ordersData = [
        ['Order #', 'Date', 'Time', 'Cashier', 'Payment', 'Subtotal', 'Discount', 'Tax', 'Total', 'Status'],
        ...(orders || []).map(o => {
          const d = new Date(o.created_at && !o.created_at.includes('T') ? o.created_at.replace(' ', 'T') + '+08:00' : o.created_at);
          return [
            o.order_number,
            d.toLocaleDateString('en-PH'),
            d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
            o.cashier,
            o.payment_method?.toUpperCase(),
            o.subtotal,
            o.discount || 0,
            o.tax || 0,
            o.total,
            o.status,
          ];
        }),
      ];
      const ws3 = XLSX.utils.aoa_to_sheet(ordersData);
      ws3['!cols'] = [{ wch: 20 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, ws3, 'Orders');

      // ── Write & Share ───────────────────────────────────────────────────
      const wbout  = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const shopSlug = (settings.shop_name || 'FoodPOS').replace(/\s+/g, '_');
      const fileName = `${shopSlug}_Sales_${fromDate}_to_${toDate}.xlsx`;
      const filePath = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(filePath, wbout, { encoding: 'base64' });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Save or Share Sales Report',
          UTI: 'com.microsoft.excel.xlsx',
        });
      } else {
        Alert.alert('Exported', `File saved to:\n${filePath}`);
      }
    } catch (e) {
      console.warn('Export error:', e.message);
      Alert.alert('Export Failed', e.message);
    } finally {
      setIsExporting(false);
    }
  };

  const canExport = fromDate && toDate && fromDate <= toDate;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: surfBg, borderBottomWidth: 1, borderBottomColor: borderC }}>
        <TouchableOpacity onPress={onClose} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isDark ? '#27272A' : '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="arrow-back" size={20} color={textPri} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: textPri }}>Export Sales</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>

        {/* What's included */}
        <View style={cardStyle}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: textPri, marginBottom: 10 }}>Export includes</Text>
          {[
            { icon: 'bar-chart-outline',    label: 'Sales Summary + Daily Breakdown' },
            { icon: 'restaurant-outline',   label: 'Item Sales — Qty + Revenue' },
            { icon: 'card-outline',         label: 'Payment Method Breakdown' },
            { icon: 'receipt-outline',      label: 'Full Orders List' },
          ].map((r, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
              <Ionicons name={r.icon} size={16} color="#F97316" />
              <Text style={{ fontSize: 13, color: textPri }}>{r.label}</Text>
            </View>
          ))}
          <View style={{ marginTop: 8, padding: 10, backgroundColor: isDark ? '#27272A' : '#F9FAFB', borderRadius: 10 }}>
            <Text style={{ fontSize: 12, color: textMut }}>📊 Exported as Excel (.xlsx) — 3 sheets in one file</Text>
          </View>
        </View>

        {/* Quick presets */}
        <View style={cardStyle}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: textPri, marginBottom: 10 }}>Quick Select</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {PRESETS.map((p) => {
              const { from, to } = p.getDates();
              const active = fromDate === from && toDate === to;
              return (
                <TouchableOpacity
                  key={p.label}
                  onPress={() => { setFromDate(from); setToDate(to); }}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: active ? '#F97316' : isDark ? '#3F3F46' : '#E5E7EB', backgroundColor: active ? '#F97316' : isDark ? '#27272A' : '#FFFFFF' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: active ? '#FFFFFF' : textMut }}>{p.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Date range selectors */}
        <View style={cardStyle}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: textPri, marginBottom: 12 }}>Custom Date Range</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            {[{ key: 'from', label: 'From', val: fromDate }, { key: 'to', label: 'To', val: toDate }].map((item) => (
              <TouchableOpacity
                key={item.key}
                onPress={() => setSelecting(item.key)}
                style={{ flex: 1, padding: 12, borderRadius: 12, borderWidth: 2, borderColor: selecting === item.key ? '#F97316' : isDark ? '#3F3F46' : '#E5E7EB', backgroundColor: selecting === item.key ? '#FFF7ED' : isDark ? '#27272A' : '#F9FAFB' }}
              >
                <Text style={{ fontSize: 10, fontWeight: '700', color: selecting === item.key ? '#F97316' : textMut, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{item.label}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: item.val ? textPri : textMut }}>{formatDisplay(item.val)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={{ fontSize: 12, color: textMut, textAlign: 'center', marginBottom: 14 }}>
            {selecting === 'from' ? 'Tap a date to set start' : 'Now tap a date to set end'}
          </Text>
          <MiniCalendar
            selectedFrom={fromDate}
            selectedTo={toDate}
            onSelectDate={handleSelectDate}
            isDark={isDark}
          />
        </View>

        {/* Export button */}
        <TouchableOpacity
          onPress={handleExport}
          disabled={!canExport || isExporting}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16, backgroundColor: canExport ? '#F97316' : isDark ? '#27272A' : '#F3F4F6', opacity: !canExport || isExporting ? 0.6 : 1 }}
        >
          {isExporting
            ? <ActivityIndicator color="white" />
            : <Ionicons name="download-outline" size={22} color={canExport ? 'white' : textMut} />
          }
          <Text style={{ fontSize: 16, fontWeight: '700', color: canExport ? 'white' : textMut }}>
            {isExporting ? 'Generating Excel…' : 'Export to Excel'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}