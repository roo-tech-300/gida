import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { fontFamily } from '@/constants/design';

const VIEWS = [
  { label: 'Super Admin View', route: '/admin/super-dashboard', icon: 'globe-outline', color: '#364736', desc: 'Full platform oversight, region management, team control' },
  { label: 'Regional Admin View', route: '/admin/regional-dashboard', icon: 'business-outline', color: '#4f46e5', desc: 'State/region oversight, field staff, zone inventory' },
  { label: 'Field Admin View', route: '/admin/field-dashboard', icon: 'location-outline', color: '#0891b2', desc: 'Property ops, inspections, day-to-day field tasks' },
];

export default function DevAdminViewsRoute() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color="#e5e1e4" />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.badge}>DEV TOOLS</Text>
            <Text style={styles.title}>Admin View Switcher</Text>
            <Text style={styles.sub}>Preview each admin role's dashboard</Text>
          </View>
        </View>

        {VIEWS.map((v) => (
          <Pressable key={v.route} style={styles.card} onPress={() => router.push(v.route as any)}>
            <View style={[styles.iconWrap, { backgroundColor: `${v.color}20` }]}>
              <Ionicons name={v.icon as any} size={28} color={v.color} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardLabel}>{v.label}</Text>
              <Text style={styles.cardDesc}>{v.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#c7c4d8" />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000000' },
  content: { padding: 16, gap: 12, paddingTop: 24 },
  header: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(24,24,28,0.7)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  headerText: { flex: 1, gap: 4 },
  badge: { fontSize: 10, fontWeight: '700', color: '#364736', fontFamily, letterSpacing: 1.5 },
  title: { fontSize: 22, fontWeight: '700', color: '#e5e1e4', fontFamily, letterSpacing: -0.3 },
  sub: { fontSize: 13, color: '#c7c4d8', fontFamily },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, backgroundColor: 'rgba(24,24,28,0.7)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1, gap: 3 },
  cardLabel: { fontSize: 15, fontWeight: '700', color: '#e5e1e4', fontFamily },
  cardDesc: { fontSize: 11, color: '#c7c4d8', fontFamily, lineHeight: 16 },
});
