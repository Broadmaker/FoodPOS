import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  getDailySummary, getWeeklySalesDetails,
  getMonthlySummary, getTopItemsRange, getSalesSummaryRange,
} from '../../database';
import { useApp } from '../../context/AppContext';
import { Card, StatCard, SectionHeader } from '../../components/common';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── PERIOD TABS ──────────────────────────────────────────────────────────────
const PERIODS = [
  { id: 'today',  label: 'Today' },
  { id: 'week',   label: 'Week'  },
  { id: 'month',  label: 'Month' },
];

const getRange = (period) => {
  const today = new Date();
  const fmt = (d) => d.toISOString().slice(0, 10);
  if (period === 'today') return { from: fmt(today), to: fmt(today) };
  if (period === 'week') {
    const from = new Date(today); from.setDate(today.getDate() - 6);
    return { from: fmt(from), to: fmt(today) };
  }
  const from = new Date(today.getFullYear(), today.getMonth(), 1);
  return { from: fmt(from), to: fmt(today) };
};

// ─── BAR CHART ────────────────────────────────────────────────────────────────
const BarChart = ({ data, formatCurrency, isDark, labelKey, valueKey = 'sales' }) => {
  if (!data || data.length === 0) return (
    <View style={{ alignItems: 'center', paddingVertical: 32 }}>
      <Ionicons name="bar-chart-outline" size={36} color={isDark ? '#3F3F46' : '#E5E7EB'} />
      <Text style={{ fontSize: 13, color: isDark ? '#52525B' : '#9CA3AF', marginTop: 8 }}>No data for this period</Text>
    </View>
  );

  const maxVal = Math.max(...data.map(d => d[valueKey] || 0), 1);
  const barW = Math.max(20, Math.min(40, (SCREEN_WIDTH - 80) / data.length - 8));

  return (
    <View>
      {/* Bars */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 6, paddingHorizontal: 4 }}>
        {data.map((item, i) => {
          const h = Math.max(4, ((item[valueKey] || 0) / maxVal) * 110);
          const isMax = item[valueKey] === maxVal;
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
              {item[valueKey] > 0 && (
                <Text style={{ fontSize: 8, color: isMax ? '#F97316' : isDark ? '#71717A' : '#9CA3AF', marginBottom: 3, textAlign: 'center' }} numberOfLines={1}>
                  {formatCurrency(item[valueKey]).replace('₱', '')}
                </Text>
              )}
              <View style={{
                width: '100%',
                height: h,
                borderRadius: 6,
                backgroundColor: isMax ? '#F97316' : isDark ? '#3F3F46' : '#E5E7EB',
              }} />
            </View>
          );
        })}
      </View>
      {/* Labels */}
      <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 4, marginTop: 6 }}>
        {data.map((item, i) => {
          const raw = item[labelKey] || '';
          let label = raw;
          if (labelKey === 'date') {
            const d = new Date(raw);
            label = d.toLocaleDateString('en-PH', { weekday: 'short' }).slice(0, 3);
          } else if (labelKey === 'month') {
            label = new Date(raw + '-01').toLocaleDateString('en-PH', { month: 'short' });
          } else if (labelKey === 'hour') {
            const h = parseInt(raw);
            label = h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
          }
          return (
            <Text key={i} style={{ flex: 1, fontSize: 9, color: isDark ? '#71717A' : '#9CA3AF', textAlign: 'center' }} numberOfLines={1}>
              {label}
            </Text>
          );
        })}
      </View>
    </View>
  );
};

// ─── LINE CHART (weekly trend) ───────────────────────────────────────────────
const LineChart = ({ data, formatCurrency, isDark }) => {
  if (!data || data.length === 0) return (
    <View style={{ alignItems: 'center', paddingVertical: 32 }}>
      <Ionicons name="trending-up-outline" size={36} color={isDark ? '#3F3F46' : '#E5E7EB'} />
      <Text style={{ fontSize: 13, color: isDark ? '#52525B' : '#9CA3AF', marginTop: 8 }}>No data yet</Text>
    </View>
  );

  const maxVal = Math.max(...data.map(d => d.sales || 0), 1);
  const H = 100; // chart height
  const W = SCREEN_WIDTH - 80;
  const pts = data.map((d, i) => ({
    x: data.length === 1 ? W / 2 : (i / (data.length - 1)) * W,
    y: H - Math.max(4, ((d.sales || 0) / maxVal) * (H - 10)),
    val: d.sales || 0,
    label: new Date(d.date).toLocaleDateString('en-PH', { weekday: 'short' }).slice(0, 3),
  }));

  // Build SVG polyline points
  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <View>
      {/* SVG Line */}
      <View style={{ height: H + 4, marginHorizontal: 4 }}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map((pct) => (
            <View key={pct} style={{ position: 'absolute', left: 0, right: 0, top: H - pct * (H - 10), height: 1, backgroundColor: isDark ? '#27272A' : '#F3F4F6' }} />
          ))}
        </View>
        {/* Bars as thin lines to simulate line chart */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: H, gap: 4 }}>
          {pts.map((p, i) => {
            const barH = H - p.y;
            const isMax = p.val === maxVal;
            return (
              <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: H }}>
                {p.val > 0 && isMax && (
                  <Text style={{ fontSize: 8, color: '#F97316', marginBottom: 2 }} numberOfLines={1}>
                    {formatCurrency(p.val).replace('₱', '')}
                  </Text>
                )}
                <View style={{ width: '60%', height: barH, borderRadius: 4, backgroundColor: isMax ? '#F97316' : isDark ? '#3F3F46' : '#E5E7EB' }} />
              </View>
            );
          })}
        </View>
        {/* Dot at peak */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'flex-end' }}>
          {pts.map((p, i) => {
            const barH = H - p.y;
            const isMax = p.val === maxVal;
            return (
              <View key={i} style={{ flex: 1, height: H, justifyContent: 'flex-end', alignItems: 'center' }}>
                <View style={{ position: 'absolute', bottom: barH - 4, width: 8, height: 8, borderRadius: 4, backgroundColor: isMax ? '#F97316' : isDark ? '#52525B' : '#D1D5DB', borderWidth: 2, borderColor: isDark ? '#18181B' : '#FFFFFF' }} />
              </View>
            );
          })}
        </View>
      </View>
      {/* Labels */}
      <View style={{ flexDirection: 'row', gap: 4, marginTop: 6, marginHorizontal: 4 }}>
        {pts.map((p, i) => (
          <Text key={i} style={{ flex: 1, fontSize: 9, textAlign: 'center', color: isDark ? '#71717A' : '#9CA3AF' }}>
            {p.label}
          </Text>
        ))}
      </View>
      {/* Summary row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: isDark ? '#27272A' : '#F3F4F6' }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 11, color: isDark ? '#71717A' : '#9CA3AF' }}>Days tracked</Text>
          <Text style={{ fontSize: 16, fontWeight: '800', color: isDark ? '#FFFFFF' : '#111827' }}>{data.length}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 11, color: isDark ? '#71717A' : '#9CA3AF' }}>Total</Text>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#F97316' }}>
            {formatCurrency(data.reduce((s, d) => s + (d.sales || 0), 0))}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 11, color: isDark ? '#71717A' : '#9CA3AF' }}>Best day</Text>
          <Text style={{ fontSize: 16, fontWeight: '800', color: isDark ? '#FFFFFF' : '#111827' }}>
            {formatCurrency(maxVal)}
          </Text>
        </View>
      </View>
    </View>
  );
};

// ─── TOP ITEMS LIST ───────────────────────────────────────────────────────────
const TopItemsList = ({ items, formatCurrency, isDark }) => {
  if (!items || items.length === 0) return (
    <Text style={{ fontSize: 13, color: isDark ? '#52525B' : '#9CA3AF', textAlign: 'center', paddingVertical: 16 }}>
      No sales in this period
    </Text>
  );
  const maxSales = Math.max(...items.map(i => i.total_sales || 0), 1);

  return (
    <View style={{ gap: 10 }}>
      {items.map((item, i) => {
        const pct = Math.round(((item.total_sales || 0) / maxSales) * 100);
        const medals = ['🥇', '🥈', '🥉'];
        return (
          <View key={i}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
              <Text style={{ fontSize: 14, width: 28 }}>{medals[i] || `#${i + 1}`}</Text>
              <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: isDark ? '#FFFFFF' : '#111827' }} numberOfLines={1}>{item.name}</Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#F97316' }}>{formatCurrency(item.total_sales)}</Text>
                <Text style={{ fontSize: 11, color: isDark ? '#71717A' : '#9CA3AF' }}>{item.qty_sold} sold</Text>
              </View>
            </View>
            <View style={{ height: 4, backgroundColor: isDark ? '#3F3F46' : '#F3F4F6', borderRadius: 999 }}>
              <View style={{ height: 4, width: `${pct}%`, backgroundColor: i === 0 ? '#F97316' : isDark ? '#52525B' : '#D1D5DB', borderRadius: 999 }} />
            </View>
          </View>
        );
      })}
    </View>
  );
};

// ─── PAYMENT BREAKDOWN ────────────────────────────────────────────────────────
const PaymentBreakdown = ({ data, totalSales, formatCurrency, isDark }) => {
  if (!data || data.length === 0) return (
    <Text style={{ fontSize: 13, color: isDark ? '#52525B' : '#9CA3AF', textAlign: 'center', paddingVertical: 16 }}>
      No data for this period
    </Text>
  );
  const icons = { cash: 'cash-outline', gcash: 'phone-portrait-outline', split: 'git-branch-outline' };

  return (
    <View style={{ gap: 12 }}>
      {data.map((p) => {
        const pct = totalSales > 0 ? Math.round((p.total / totalSales) * 100) : 0;
        return (
          <View key={p.payment_method}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: isDark ? '#27272A' : '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={icons[p.payment_method] || 'card-outline'} size={15} color={isDark ? '#9CA3AF' : '#6B7280'} />
                </View>
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? '#FFFFFF' : '#111827', textTransform: 'capitalize' }}>{p.payment_method}</Text>
                  <Text style={{ fontSize: 11, color: isDark ? '#71717A' : '#9CA3AF' }}>{p.count} transactions</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#FFFFFF' : '#111827' }}>{formatCurrency(p.total)}</Text>
                <Text style={{ fontSize: 11, color: '#F97316', fontWeight: '600' }}>{pct}%</Text>
              </View>
            </View>
            <View style={{ height: 5, backgroundColor: isDark ? '#3F3F46' : '#F3F4F6', borderRadius: 999 }}>
              <View style={{ height: 5, width: `${pct}%`, backgroundColor: '#F97316', borderRadius: 999, opacity: 0.8 }} />
            </View>
          </View>
        );
      })}
    </View>
  );
};

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { formatCurrency, settings, isDark, toggleTheme } = useApp();
  const [period, setPeriod] = useState('today');
  const [summaryData, setSummaryData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [weeklyTrend, setWeeklyTrend] = useState([]);

  const bg = isDark ? '#000000' : '#F2F2F7';
  const surfBg = isDark ? '#18181B' : '#FFFFFF';
  const borderC = isDark ? '#27272A' : '#F3F4F6';
  const textPri = isDark ? '#FFFFFF' : '#111827';
  const textMut = isDark ? '#71717A' : '#9CA3AF';

  useEffect(() => { loadData(); }, [period]);

  const loadData = useCallback(() => {
    setRefreshing(true);
    try {
      const { from, to } = getRange(period);

      if (period === 'today') {
        const daily = getDailySummary();
        setSummaryData({ summary: daily.summary, byPayment: daily.byPayment });
        setChartData(daily.hourlySales || []);
        setTopItems(daily.topItems || []);
      } else {
        const rangeData = getSalesSummaryRange(from, to);
        setSummaryData({ summary: rangeData.summary, byPayment: rangeData.byPayment });
        setChartData(rangeData.byDay || []);
        setTopItems(getTopItemsRange(from, to, 10));
      }
      // Always load 7-day trend
      setWeeklyTrend(getWeeklySalesDetails());
    } catch (e) { console.warn(e); }
    finally { setRefreshing(false); }
  }, [period]);

  const summary = summaryData?.summary || {};
  const totalSales = summary.total_sales || 0;

  const chartLabelKey = period === 'today' ? 'hour' : 'date';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: surfBg, borderBottomWidth: 1, borderBottomColor: borderC }}>
        <View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: textPri }}>Dashboard</Text>
          <Text style={{ fontSize: 12, color: textMut, marginTop: 2 }}>{settings.shop_name}</Text>
        </View>
        <TouchableOpacity
          onPress={toggleTheme}
          style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: isDark ? '#27272A' : '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={isDark ? '#F59E0B' : '#6B7280'} />
        </TouchableOpacity>
      </View>

      {/* Period Tabs */}
      <View style={{ flexDirection: 'row', backgroundColor: surfBg, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: borderC, gap: 8 }}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.id}
            onPress={() => setPeriod(p.id)}
            style={{
              flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: 'center',
              backgroundColor: period === p.id ? '#F97316' : isDark ? '#27272A' : '#F3F4F6',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: period === p.id ? '#FFFFFF' : textMut }}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor="#F97316" />}
      >
        {/* Key Stats */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StatCard label="Sales" value={formatCurrency(totalSales)} iconName="cash-outline" iconBg="bg-orange-100" iconColor="#F97316" />
          <StatCard label="Orders" value={String(summary.total_orders || 0)} iconName="receipt-outline" iconBg="bg-blue-100" iconColor="#3B82F6" />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StatCard label="Avg Order" value={formatCurrency(summary.avg_order_value || 0)} iconName="trending-up-outline" iconBg="bg-green-100" iconColor="#22C55E" />
          <StatCard label="Discounts" value={formatCurrency(summary.total_discounts || 0)} iconName="pricetag-outline" iconBg="bg-amber-100" iconColor="#F59E0B" />
        </View>

        {/* Sales Chart */}
        <Card>
          <SectionHeader title={`Sales — ${PERIODS.find(p => p.id === period)?.label}`} />
          <BarChart
            data={chartData}
            formatCurrency={formatCurrency}
            isDark={isDark}
            labelKey={chartLabelKey}
          />
        </Card>

        {/* Weekly Trend */}
        <Card>
          <SectionHeader title="7-Day Trend" />
          <LineChart data={weeklyTrend} formatCurrency={formatCurrency} isDark={isDark} />
        </Card>

        {/* Top Items */}
        <Card>
          <SectionHeader title="Top Items" />
          <TopItemsList items={topItems} formatCurrency={formatCurrency} isDark={isDark} />
        </Card>

        {/* Payment Breakdown */}
        <Card>
          <SectionHeader title="Payment Methods" />
          <PaymentBreakdown
            data={summaryData?.byPayment}
            totalSales={totalSales}
            formatCurrency={formatCurrency}
            isDark={isDark}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}