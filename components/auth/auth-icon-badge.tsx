import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { DesignColors, DesignRadius } from '@/constants/design';

type AuthIconBadgeProps = {
    name: keyof typeof Ionicons.glyphMap;
};

/** Gold gradient badge used at the top of the recovery flow screens. */
export function AuthIconBadge({ name }: AuthIconBadgeProps) {
    return (
        <View style={styles.wrapper}>
            <LinearGradient
                colors={[DesignColors.primaryTintMid, DesignColors.primaryTint]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.badge}>
                <Ionicons name={name} size={28} color={DesignColors.primaryFixed} />
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        borderRadius: DesignRadius.full,
        borderWidth: 1,
        borderColor: DesignColors.primaryTintBorder,
        padding: 4,
        alignSelf: 'center',
    },
    badge: {
        width: 64,
        height: 64,
        borderRadius: DesignRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
