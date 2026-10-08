import { Image, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { BackButton } from '@/components/ui/back-button';
import { DesignColors } from '@/constants/design';
import { formatNaira } from '@/utils/format-naira';
import { styles } from './payment-checkout.styles';

export function CheckoutTopBar({ title }: { title: string }) {
  return (
    <View style={styles.topBar}>
      <BackButton hasBackground={false} />
      <Text style={styles.topBarTitle}>{title}</Text>
    </View>
  );
}

export function CheckoutHeroCard({
  estateName,
  imageUri,
  intentSize,
  targetOccupancy,
}: {
  estateName: string;
  imageUri?: string | null;
  intentSize: number;
  targetOccupancy: number;
}) {
  return (
    <View style={styles.heroCard}>
      {imageUri ? (
        <>
          <Image source={{ uri: imageUri }} style={styles.heroImage} />
          <View style={styles.heroGradient}>
            <Svg height="100%" width="100%">
              <Defs>
                <LinearGradient id="heroMask" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={DesignColors.surface} stopOpacity="0" />
                  <Stop offset="50%" stopColor={DesignColors.surface} stopOpacity="0.5" />
                  <Stop offset="100%" stopColor={DesignColors.surface} stopOpacity="0.95" />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#heroMask)" />
            </Svg>
          </View>
        </>
      ) : (
        <View style={styles.heroFallback}>
          <Ionicons name="business-outline" size={28} color={DesignColors.primaryBright} />
        </View>
      )}
      <View style={styles.heroInfo}>
        <Text style={styles.heroLabel}>RESIDENCE</Text>
        <Text style={styles.heroTitle} numberOfLines={1}>{estateName}</Text>
        <View style={styles.heroMeta}>
          <View style={styles.heroMetaItem}>
            <Ionicons name="layers-outline" size={13} color={DesignColors.onSurfaceVariant} />
            <Text style={styles.heroMetaText}>Buying {intentSize} of {targetOccupancy}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export function CheckoutAmountCard({ amount }: { amount: number }) {
  return (
    <View style={styles.amountCard}>
      <View style={styles.amountHeader}>
        <View style={styles.amountBar} />
        <Text style={styles.amountLabel}>TOTAL DUE TODAY</Text>
      </View>
      <Text style={styles.amountValue} testID="checkout-amount">{formatNaira(amount)}</Text>
      <View style={styles.amountDivider} />
      <Text style={styles.amountNote}>Covers your share of rent.</Text>
    </View>
  );
}
