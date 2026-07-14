import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';
import { useCreateLandlord } from '@/hooks/use-create-landlord';
import { useAppToast } from '@/components/ui/toast-card';

export function CreateLandlordScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const { mutateAsync, isPending } = useCreateLandlord();
  const { showToast } = useAppToast();

  const handleSave = async () => {
    const trimmedName = fullName.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      showToast({ message: 'Full name is required.', type: 'error' });
      return;
    }
    if (!trimmedPhone) {
      showToast({ message: 'Phone number is required.', type: 'error' });
      return;
    }

    const payoutDetails: Record<string, string> | null =
      bankName.trim() || accountNumber.trim() || accountName.trim()
        ? {
            bank_name: bankName.trim(),
            account_number: accountNumber.trim(),
            account_name: accountName.trim(),
          }
        : null;

    try {
      await mutateAsync({
        full_name: trimmedName,
        phone_number: trimmedPhone,
        email: email.trim() || null,
        payout_details: payoutDetails,
      });
      showToast({ message: 'Landlord added successfully.', type: 'success' });
      router.back();
    } catch (error: any) {
      const msg = error?.message || error?.error_description || JSON.stringify(error);
      console.log('CreateLandlord error:', msg);
      showToast({ message: msg || 'Failed to save landlord. Please try again.', type: 'error' });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: '#0e0e10' }}
      >
        <View style={styles.topBar}>
          <BackButton hasBackground={false} />
          <Text style={styles.topBarTitle}>Add Landlord</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Landlord Information</Text>
            <Text style={styles.heroSub}>Add a new landlord to your property network</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.glassInput}>
              <BlurView intensity={25} tint="dark" style={styles.glassBlur} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. John Doe"
                placeholderTextColor="rgba(199,196,216,0.4)"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email Address <Text style={styles.optional}>(Optional)</Text></Text>
            <View style={styles.glassInput}>
              <BlurView intensity={25} tint="dark" style={styles.glassBlur} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. john@example.com"
                placeholderTextColor="rgba(199,196,216,0.4)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.glassInput}>
              <BlurView intensity={25} tint="dark" style={styles.glassBlur} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. +234 800 000 0000"
                placeholderTextColor="rgba(199,196,216,0.4)"
                value={phone}
                onChangeText={(text) => setPhone(text.replace(/[^+\d]/g, ''))}
                keyboardType="default"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Pressable style={styles.payoutHeader} onPress={() => setPayoutOpen(!payoutOpen)}>
              <Text style={styles.label}>Payout Details <Text style={styles.optional}>(Optional)</Text></Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={DesignColors.onSurfaceVariant}
                style={{ transform: [{ rotate: payoutOpen ? '90deg' : '0deg' }] }}
              />
            </Pressable>
            {payoutOpen && (
              <View style={styles.payoutBody}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.subLabel}>Bank Name</Text>
                  <View style={styles.glassInput}>
                    <BlurView intensity={25} tint="dark" style={styles.glassBlur} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. GTBank"
                      placeholderTextColor="rgba(199,196,216,0.4)"
                      value={bankName}
                      onChangeText={setBankName}
                    />
                  </View>
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.subLabel}>Account Number</Text>
                  <View style={styles.glassInput}>
                    <BlurView intensity={25} tint="dark" style={styles.glassBlur} />
                    <TextInput
                      style={styles.textInput}
                        placeholder="e.g. 0123456789"
                        placeholderTextColor="rgba(199,196,216,0.4)"
                        value={accountNumber}
                        onChangeText={(text) => setAccountNumber(text.replace(/\D/g, ''))}
                        keyboardType="default"
                    />
                  </View>
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.subLabel}>Account Name</Text>
                  <View style={styles.glassInput}>
                    <BlurView intensity={25} tint="dark" style={styles.glassBlur} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. John Doe"
                      placeholderTextColor="rgba(199,196,216,0.4)"
                      value={accountName}
                      onChangeText={setAccountName}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.ctaRow}>
          <Pressable style={[styles.saveBtn, isPending && styles.saveBtnDisabled]} onPress={handleSave} disabled={isPending}>
            {isPending ? (
              <ActivityIndicator color={DesignColors.onPrimaryContainer} />
            ) : (
              <Text style={styles.saveText}>Save Landlord</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0e0e10' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 8,
  },
  topBarTitle: { fontSize: 18, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  glassBlur: { ...StyleSheet.absoluteFillObject, borderRadius: 12 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, gap: 24, paddingBottom: 120 },
  hero: { paddingTop: 8 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: DesignColors.onSurface, fontFamily, letterSpacing: -0.5 },
  heroSub: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, marginTop: 4 },
  fieldGroup: { gap: 8 },
  label: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily },
  subLabel: { fontSize: 13, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily },
  optional: { fontSize: 11, fontWeight: '400', color: 'rgba(199,196,216,0.5)', fontFamily },
  glassInput: {
    borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(24,24,28,0.65)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  textInput: {
    paddingHorizontal: 16, paddingVertical: 14,
    color: DesignColors.onSurface, fontSize: 16, fontFamily,
  },
  payoutHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 4,
  },
  payoutBody: { gap: 16, paddingTop: 8 },
  ctaRow: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 24 },
  saveBtn: {
    width: '100%', height: 56, borderRadius: 28,
    backgroundColor: DesignColors.primaryContainer,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: DesignColors.primaryContainer,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { fontSize: 16, fontWeight: '700', color: DesignColors.onPrimaryContainer, fontFamily },
});
