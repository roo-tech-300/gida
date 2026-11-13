import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors } from '@/constants/design';
import { formatNaira } from '@/utils/format-naira';
import type { AdminLodgeDetail, AdminLodgeMember } from '@/services/admin-lodge-verification-service';
import { styles } from './lodge-reservation-detail-screen.styles';

export function PropertyCard({ detail }: { detail: AdminLodgeDetail }) {
  const listing = detail.listing;

  return (
    <View style={[styles.card, styles.propertyCard]}>
      {listing?.primaryImage ? (
        <Image source={{ uri: listing.primaryImage }} style={styles.propertyImage} />
      ) : (
        <View style={styles.propertyImageFallback}>
          <Ionicons name="home-outline" size={30} color={DesignColors.primaryBright} />
        </View>
      )}
      <View style={styles.propertyBody}>
        <Text style={styles.propertyTitle} numberOfLines={2}>
          {listing?.title ?? 'Unnamed property'}
        </Text>
        {listing?.location ? (
          <Text style={styles.propertyMeta} numberOfLines={1}>
            {listing.location}
          </Text>
        ) : null}
        {listing ? <Text style={styles.propertyPrice}>{formatNaira(listing.priceAmount)}/yr</Text> : null}
      </View>
    </View>
  );
}

export function PodInfoCard({ detail }: { detail: AdminLodgeDetail }) {
  const pod = detail.pod;
  const ref = `GIDA-POD-${pod.id.slice(-4).toUpperCase()}`;

  return (
    <View style={styles.card}>
      <InfoRow icon="ticket-outline" label="Reference" value={ref} />
      <InfoRow icon="people-outline" label="Target occupancy" value={`${pod.targetOccupancy} ${pod.targetOccupancy === 1 ? 'person' : 'people'}`} />
      <InfoRow icon="person-outline" label="Members applied" value={`${pod.memberCount} of ${pod.targetOccupancy}`} />
      <InfoRow icon="time-outline" label="Submitted" value={formatCreatedDate(pod.createdAt)} />
    </View>
  );
}

export function MembersCard({ members, targetOccupancy }: { members: AdminLodgeMember[]; targetOccupancy: number }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Members ({members.length} of {targetOccupancy})</Text>
      {members.length === 0 ? (
        <Text style={styles.emptyMembers}>No members yet</Text>
      ) : (
        members.map((member) => (
          <MemberRow key={member.userId} member={member} />
        ))
      )}
    </View>
  );
}

export function MemberRow({ member }: { member: AdminLodgeMember }) {
  const name = member.userName ?? 'Unknown';
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <View style={styles.memberRow}>
      <View style={styles.memberAvatar}>
        <Text style={styles.memberAvatarText}>{initial}</Text>
      </View>
      <View style={styles.memberBody}>
        <Text style={styles.memberName}>{name}</Text>
        {member.amountPaid != null && (
          <Text style={styles.memberAmount}>{formatNaira(member.amountPaid)}</Text>
        )}
      </View>
    </View>
  );
}

export function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={16} color={DesignColors.onSurfaceVariant} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function formatCreatedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
