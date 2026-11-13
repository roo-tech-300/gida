import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors } from '@/constants/design';
import type { FeedListing } from '@/types/feed-listing';
import { formatNaira } from '@/utils/format-naira';

import { styles } from './property-details-screen.styles';

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function PropertySummary({ property }: { property: FeedListing }) {
  return (
    <>
      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>{property.status.toUpperCase()}</Text>
      </View>

      <Text style={styles.title}>{property.title}</Text>

      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={16} color={DesignColors.onSurfaceVariant} />
        <Text style={styles.location}>{property.location}</Text>
      </View>

      <View style={styles.priceSection}>
        <Text style={styles.price}>{formatNaira(property.pricePerPerson)}</Text>
        <Text style={styles.priceNote}>
          {(property.propertyTier ?? 1) > 1
            ? `per person, per year · ${formatNaira(property.priceAmount)} for the whole place`
            : 'per year'}
        </Text>
      </View>
      <View style={styles.statsRow}>
        {property.beds ? <StatItem label="BEDROOMS" value={property.beds} /> : null}
        {property.baths ? <StatItem label="BATHROOMS" value={property.baths} /> : null}
        {property.size ? <StatItem label="INTERIOR" value={property.size} /> : null}
        {property.floor ? <StatItem label="FLOOR" value={property.floor} /> : null}
      </View>
    </>
  );
}
