import React, { useState, useRef, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';
import { buildReceiptText } from '../../utils/receiptFormatter';
import { useApp } from '../../context/AppContext';
import { createOrder } from '../../database';
import { Button, Card, Divider } from '../../components/common';

const PAYMENT_METHODS = [
  { id: 'cash',  label: 'Cash',  icon: 'cash-outline' },
  { id: 'gcash', label: 'GCash', icon: 'phone-portrait-outline' },
];

// ─── RECEIPT MODAL ────────────────────────────────────────────────────────────
const ReceiptModal = ({ visible, order, cartItems, onClose, formatCurrency, isDark, shopName, shopAddress, shopPhone, receiptFooter }) => {
  const [isPrinting, setIsPrinting] = useState(false);

  if (!order) return null;

  const handlePrint = async () => {
    if (isPrinting) return; // prevent double tap
    console.log('=== HANDLE PRINT CLICKED ===');
    if (!order) return;
    setIsPrinting(true);
    try {
      const { BLEPrinter } = require('react-native-thermal-receipt-printer-image-qr');
      const { getSetting } = require('../../database');
      const address = getSetting('printer_address');
      console.log('Printer address:', address);
      if (!address) {
        Alert.alert('No Printer Set Up', 'Go to Settings → Bluetooth Printer → Connect first.');
        return;
      }
      const text = buildReceiptText({
        order, cartItems,
        settings: { shop_name: shopName, shop_address: shopAddress, shop_phone: shopPhone, receipt_footer: receiptFooter },
        formatCurrency
      });
      console.log('Text built, length:', text?.length);
      await BLEPrinter.init();
      await BLEPrinter.connectPrinter(address);
      BLEPrinter.printBill(text, {});
      console.log('=== PRINT SENT ===');
      setTimeout(() => setIsPrinting(false), 3000); // keep disabled 3s after print
    } catch (e) {
      console.warn('Print error:', e.message);
      // Try printing without reconnect in case already connected
      try {
        const { BLEPrinter } = require('react-native-thermal-receipt-printer-image-qr');
        const text = buildReceiptText({
          order, cartItems,
          settings: { shop_name: shopName, shop_address: shopAddress, shop_phone: shopPhone, receipt_footer: receiptFooter },
          formatCurrency
        });
        BLEPrinter.printBill(text, {});
        console.log('=== PRINT SENT (retry) ===');
      } catch (e2) {
        Alert.alert('Print Failed', 'Could not print. Make sure printer is on and go to Settings → Bluetooth Printer to reconnect.');
      }
    } finally {
      // Always re-enable after 3 seconds max
      setTimeout(() => setIsPrinting(false), 3000);
    }
  };

  const bg       = isDark ? '#18181B' : '#FFFFFF';
  const receiptBg = isDark ? '#27272A' : '#F9FAFB';
  const borderC  = isDark ? '#3F3F46' : '#E5E7EB';
  const textPri  = isDark ? '#FFFFFF' : '#111827';
  const textMut  = isDark ? '#71717A' : '#9CA3AF';

  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });



  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: borderC }}>
          <View style={{ width: 40 }} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: textPri }}>Order Complete</Text>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="checkmark" size={22} color="#22C55E" />
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          {/* Receipt Paper */}
          <View style={{ backgroundColor: receiptBg, borderRadius: 16, borderWidth: 1, borderColor: borderC, overflow: 'hidden', marginBottom: 16 }}>

            {/* Shop Header */}
            <View style={{ alignItems: 'center', paddingTop: 24, paddingBottom: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: borderC }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: textPri, letterSpacing: -0.5 }}>{shopName || 'My Food Shop'}</Text>
              {shopAddress ? <Text style={{ fontSize: 12, color: textMut, marginTop: 2 }}>{shopAddress}</Text> : null}
              {shopPhone  ? <Text style={{ fontSize: 12, color: textMut }}>{shopPhone}</Text> : null}
              <View style={{ marginTop: 10, flexDirection: 'row', gap: 10 }}>
                <Text style={{ fontSize: 11, color: textMut }}>{dateStr}</Text>
                <Text style={{ fontSize: 11, color: textMut }}>·</Text>
                <Text style={{ fontSize: 11, color: textMut }}>{timeStr}</Text>
              </View>
              <View style={{ marginTop: 8, backgroundColor: isDark ? '#3F3F46' : '#E5E7EB', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: textMut, letterSpacing: 1 }}>{order.orderNumber}</Text>
              </View>
            </View>

            {/* Items */}
            <View style={{ padding: 16, gap: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: textMut, letterSpacing: 1, marginBottom: 4 }}>ITEMS ORDERED</Text>
              {cartItems.map((item) => (
                <View key={item.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                  <Text style={{ fontSize: 13, color: textMut, width: 24 }}>{item.quantity}×</Text>
                  <Text style={{ flex: 1, fontSize: 13, color: textPri }}>{item.name}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: textPri }}>{formatCurrency(item.price * item.quantity)}</Text>
                </View>
              ))}
            </View>

            {/* Totals */}
            <View style={{ marginHorizontal: 16, borderTopWidth: 1, borderTopColor: borderC, paddingTop: 12, paddingBottom: 16, gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: textMut }}>Subtotal</Text>
                <Text style={{ fontSize: 13, color: textPri }}>{formatCurrency(order.subtotal)}</Text>
              </View>
              {order.discountAmount > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: '#22C55E' }}>Discount</Text>
                  <Text style={{ fontSize: 13, color: '#22C55E' }}>-{formatCurrency(order.discountAmount)}</Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: borderC, marginTop: 2 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: textPri }}>TOTAL</Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#F97316' }}>{formatCurrency(order.total)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: textMut }}>
                  {order.paymentMethod === 'cash' ? 'Cash tendered' : 'GCash'}
                </Text>
                <Text style={{ fontSize: 12, color: textPri }}>{formatCurrency(order.amountTendered)}</Text>
              </View>
              {order.changeAmount > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#F97316' }}>Change</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#F97316' }}>{formatCurrency(order.changeAmount)}</Text>
                </View>
              )}
            </View>

            {/* Footer */}
            <View style={{ alignItems: 'center', paddingVertical: 16, borderTopWidth: 1, borderTopColor: borderC }}>
              <Text style={{ fontSize: 12, color: textMut }}>{receiptFooter || 'Salamat! Come back soon 🙏'}</Text>
              <Text style={{ fontSize: 10, color: isDark ? '#52525B' : '#D1D5DB', marginTop: 8 }}>— FoodPOS —</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ gap: 10 }}>
            <TouchableOpacity
              onPress={handlePrint}
              activeOpacity={0.8}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: isDark ? '#27272A' : '#F3F4F6', borderWidth: 1.5, borderColor: isDark ? '#3F3F46' : '#E5E7EB' }}
            >
              <Ionicons name="print-outline" size={20} color={isDark ? '#D4D4D8' : '#374151'} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: isDark ? '#D4D4D8' : '#374151' }}>Print Receipt</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.85}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: '#F97316' }}
            >
              <Ionicons name="add-circle-outline" size={20} color="white" />
              <Text style={{ fontSize: 15, fontWeight: '700', color: 'white' }}>New Order</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function CheckoutScreen({ navigation }) {
  const { items, subtotal, discountAmount, taxAmount, total,
    paymentMethod, setPaymentMethod, setDiscount, clearCart } = useCart();
  const { formatCurrency, settings, isDark } = useApp();


  const [cashTendered, setCashTendered] = useState('0');
  const [discountInput, setDiscountInput] = useState('');
  const [discountType, setDiscountType] = useState('flat');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  const cashNum = parseFloat(cashTendered) || 0;

  const canCheckout = useMemo(() => {
    if (items.length === 0) return false;
    if (paymentMethod === 'cash') return cashNum >= total;
    if (paymentMethod === 'gcash') return true;
    return false;
  }, [paymentMethod, cashNum, total, items]);

  const handleCheckout = async () => {
    if (!canCheckout) return;
    setIsProcessing(true);
    try {
      let payload = {
        subtotal, discount: discountAmount, tax: taxAmount,
        taxAmount, discountAmount,
        total, paymentMethod, notes,
        cashier: settings.cashier_name || 'Staff',
        cashAmount: 0, gcashAmount: 0,
      };
      if (paymentMethod === 'cash') {
        payload = { ...payload, amountTendered: cashNum, changeAmount: Math.max(0, cashNum - total), cashAmount: cashNum };
      } else {
        payload = { ...payload, amountTendered: total, changeAmount: 0, gcashAmount: total };
      }
      const result = createOrder(payload, items);
      setCompletedOrder({ ...payload, orderNumber: result.orderNumber });
      setReceiptVisible(true);
    } catch (e) {
      Alert.alert('Error', 'Could not process order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const bg      = isDark ? '#000000' : '#F2F2F7';
  const surfBg  = isDark ? '#18181B' : '#FFFFFF';
  const borderC = isDark ? '#27272A' : '#F3F4F6';
  const textPri = isDark ? '#FFFFFF' : '#111827';
  const textMut = isDark ? '#71717A' : '#9CA3AF';
  const inputStyle = {
    borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 20, fontWeight: '700', textAlign: 'center',
    borderColor: isDark ? '#3F3F46' : '#E5E7EB',
    backgroundColor: isDark ? '#27272A' : '#FFFFFF',
    color: isDark ? '#FFFFFF' : '#111827',
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: surfBg, borderBottomWidth: 1, borderBottomColor: borderC }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#111827'} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: textPri }}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>

        {/* Order Summary */}
        <Card>
          <Text style={{ fontSize: 13, fontWeight: '700', color: textPri, marginBottom: 10 }}>Order Summary</Text>
          {items.map((item) => (
            <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5, gap: 8 }}>
              <Text style={{ fontSize: 13, color: textMut, width: 24 }}>×{item.quantity}</Text>
              <Text style={{ flex: 1, fontSize: 13, color: textPri }} numberOfLines={1}>{item.name}</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: textPri }}>{formatCurrency(item.price * item.quantity)}</Text>
            </View>
          ))}
          <Divider />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontSize: 13, color: textMut }}>Subtotal</Text>
            <Text style={{ fontSize: 13, color: textPri }}>{formatCurrency(subtotal)}</Text>
          </View>
          {discountAmount > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 13, color: '#22C55E' }}>Discount</Text>
              <Text style={{ fontSize: 13, color: '#22C55E' }}>-{formatCurrency(discountAmount)}</Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, marginTop: 4, borderTopWidth: 1, borderTopColor: borderC }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: textPri }}>Total</Text>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#F97316' }}>{formatCurrency(total)}</Text>
          </View>
          {taxAmount > 0 && (
            <View style={{ marginTop: 6, padding: 8, backgroundColor: isDark ? '#27272A' : '#F9FAFB', borderRadius: 8, gap: 3 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 11, color: textMut }}>VAT Inclusive ({settings.tax_rate}%)</Text>
                <Text style={{ fontSize: 11, color: textMut }}>{formatCurrency(taxAmount)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 11, color: textMut }}>Net of VAT</Text>
                <Text style={{ fontSize: 11, color: textMut }}>{formatCurrency(total - taxAmount)}</Text>
              </View>
            </View>
          )}
        </Card>

        {/* Discount */}
        <Card>
          <Text style={{ fontSize: 13, fontWeight: '700', color: textPri, marginBottom: 10 }}>Discount</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
            {['flat', 'percent'].map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setDiscountType(t)}
                style={{ flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: 'center', borderWidth: 1.5, borderColor: discountType === t ? '#F97316' : isDark ? '#3F3F46' : '#E5E7EB', backgroundColor: discountType === t ? '#F97316' : 'transparent' }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: discountType === t ? '#FFFFFF' : textMut }}>
                  {t === 'flat' ? '₱ Fixed' : '% Percent'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              value={discountInput}
              onChangeText={setDiscountInput}
              placeholder={discountType === 'flat' ? '0.00' : '0'}
              keyboardType="decimal-pad"
              placeholderTextColor={textMut}
              style={{ flex: 1, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, borderColor: isDark ? '#3F3F46' : '#E5E7EB', backgroundColor: isDark ? '#27272A' : '#FFFFFF', color: isDark ? '#FFFFFF' : '#111827' }}
            />
            <Button title="Apply" onPress={() => setDiscount(parseFloat(discountInput) || 0, discountType)} size="sm" />
          </View>
        </Card>

        {/* Payment Method */}
        <Card>
          <Text style={{ fontSize: 13, fontWeight: '700', color: textPri, marginBottom: 10 }}>Payment Method</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {PAYMENT_METHODS.map((m) => (
              <TouchableOpacity
                key={m.id}
                onPress={() => setPaymentMethod(m.id)}
                activeOpacity={0.8}
                style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, gap: 6, borderColor: paymentMethod === m.id ? '#F97316' : isDark ? '#3F3F46' : '#E5E7EB', backgroundColor: paymentMethod === m.id ? '#FFF7ED' : isDark ? '#27272A' : '#F9FAFB' }}
              >
                <Ionicons name={m.icon} size={24} color={paymentMethod === m.id ? '#F97316' : isDark ? '#52525B' : '#9CA3AF'} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: paymentMethod === m.id ? '#F97316' : textMut }}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Cash Input */}
        {paymentMethod === 'cash' && (
          <Card>
            <Text style={{ fontSize: 13, fontWeight: '700', color: textPri, marginBottom: 10 }}>Cash Tendered</Text>
            {/* Exact amount chip */}
            <TouchableOpacity
              onPress={() => setCashTendered(String(total))}
              activeOpacity={0.75}
              style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1.5, borderColor: '#F97316', backgroundColor: isDark ? '#27272A' : '#FFF7ED', marginBottom: 12 }}
            >
              <Ionicons name="checkmark-circle-outline" size={14} color="#F97316" />
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#F97316' }}>Exact Amount  {formatCurrency(total)}</Text>
            </TouchableOpacity>
            {/* Input */}
            <TextInput
              value={cashTendered === '0' ? '' : cashTendered}
              onChangeText={(v) => setCashTendered(v || '0')}
              placeholder={`Enter amount (min. ${formatCurrency(total)})`}
              placeholderTextColor={textMut}
              keyboardType="decimal-pad"
              style={{ ...inputStyle, borderColor: cashNum >= total ? '#F97316' : isDark ? '#3F3F46' : '#E5E7EB', marginBottom: 8 }}
            />
            {/* Change */}
            {cashNum >= total && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: '#F0FDF4', borderRadius: 14 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#16A34A' }}>Change</Text>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#16A34A' }}>{formatCurrency(Math.max(0, cashNum - total))}</Text>
              </View>
            )}
          </Card>
        )}

        {/* GCash */}
        {paymentMethod === 'gcash' && (
          <Card>
            <Text style={{ fontSize: 13, fontWeight: '700', color: textPri, marginBottom: 10 }}>GCash Payment</Text>

            {/* Amount */}
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 32, fontWeight: '800', color: '#F97316' }}>{formatCurrency(total)}</Text>
              <Text style={{ fontSize: 13, color: textMut, marginTop: 2 }}>Send via GCash</Text>
            </View>

            {/* QR Code */}
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              {settings.gcash_qr_uri ? (
                <View style={{ alignItems: 'center', gap: 8 }}>
                  <Image source={{ uri: settings.gcash_qr_uri }} style={{ width: 200, height: 200, borderRadius: 16, borderWidth: 1, borderColor: isDark ? '#3F3F46' : '#E5E7EB' }} resizeMode="contain" />
                  {settings.gcash_name ? (
                    <Text style={{ fontSize: 14, fontWeight: '700', color: textPri }}>{settings.gcash_name}</Text>
                  ) : null}
                  {settings.gcash_number ? (
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#007DFF', letterSpacing: 1 }}>{settings.gcash_number}</Text>
                  ) : null}
                </View>
              ) : settings.gcash_number ? (
                // No QR but has number — show number prominently
                <View style={{ alignItems: 'center', padding: 24, borderRadius: 16, backgroundColor: isDark ? '#1E3A5F' : '#EFF6FF', width: '100%', gap: 6 }}>
                  <Ionicons name="phone-portrait-outline" size={36} color="#007DFF" />
                  {settings.gcash_name ? (
                    <Text style={{ fontSize: 14, fontWeight: '700', color: textPri }}>{settings.gcash_name}</Text>
                  ) : null}
                  <Text style={{ fontSize: 22, fontWeight: '800', color: '#007DFF', letterSpacing: 1 }}>{settings.gcash_number}</Text>
                  <Text style={{ fontSize: 12, color: isDark ? '#93C5FD' : '#2563EB', marginTop: 4 }}>Send {formatCurrency(total)} to this number</Text>
                </View>
              ) : (
                // Nothing configured
                <View style={{ alignItems: 'center', padding: 20, borderRadius: 16, borderWidth: 1.5, borderColor: isDark ? '#3F3F46' : '#E5E7EB', borderStyle: 'dashed', width: '100%', gap: 8 }}>
                  <Ionicons name="qr-code-outline" size={36} color={isDark ? '#52525B' : '#9CA3AF'} />
                  <Text style={{ fontSize: 13, color: isDark ? '#52525B' : '#9CA3AF', textAlign: 'center' }}>
                    {'Configure GCash in\nSettings → GCash Payment'}
                  </Text>
                </View>
              )}
            </View>

            {/* Steps */}
            <View style={{ gap: 10, padding: 14, backgroundColor: isDark ? '#1E3A5F' : '#EFF6FF', borderRadius: 14 }}>
              {[
                settings.gcash_qr_uri ? 'Ask customer to scan the QR code' : 'Ask customer to send to the GCash number',
                'Enter the exact amount: ' + formatCurrency(total),
                'Confirm payment received before tapping Complete'
              ].map((s, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 999, backgroundColor: '#007DFF', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFFFFF' }}>{i + 1}</Text>
                  </View>
                  <Text style={{ fontSize: 12, flex: 1, color: isDark ? '#93C5FD' : '#2563EB' }}>{s}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Notes */}
        <Card>
          <Text style={{ fontSize: 13, fontWeight: '700', color: textPri, marginBottom: 10 }}>Order Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. No onions, extra spicy, dine-in..."
            placeholderTextColor={textMut}
            multiline numberOfLines={3}
            style={{ borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, borderColor: isDark ? '#3F3F46' : '#E5E7EB', backgroundColor: isDark ? '#27272A' : '#FFFFFF', color: isDark ? '#FFFFFF' : '#111827', textAlignVertical: 'top', minHeight: 80 }}
          />
        </Card>
      </ScrollView>

      {/* Footer */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 28, paddingTop: 12, backgroundColor: surfBg, borderTopWidth: 1, borderTopColor: borderC }}>
        {paymentMethod === 'cash' && cashNum > 0 && cashNum < total && (
          <Text style={{ fontSize: 12, color: '#F59E0B', textAlign: 'center', marginBottom: 8 }}>
            Cash tendered is less than total ({formatCurrency(total)})
          </Text>
        )}
        <Button
          title={`Complete Order  ·  ${formatCurrency(total)}`}
          onPress={handleCheckout}
          loading={isProcessing}
          disabled={!canCheckout}
          size="lg"
          iconName="checkmark-circle-outline"
        />
      </View>

      <ReceiptModal
        visible={receiptVisible}
        order={completedOrder}
        cartItems={items}
        onClose={() => { setReceiptVisible(false); clearCart(); navigation.navigate('POS'); }}
        formatCurrency={formatCurrency}
        isDark={isDark}
        shopName={settings.shop_name}
        shopAddress={settings.shop_address}
        shopPhone={settings.shop_phone}
        receiptFooter={settings.receipt_footer}

      />
    </SafeAreaView>
  );
}