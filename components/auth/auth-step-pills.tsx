import { StyleSheet, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing } from '@/constants/design';

type AuthStepPillsProps = {
    totalSteps: number;
    activeIndex: number; // zero-based
};

/** Slim segmented progress indicator (e.g. 1 · 2) shown at the top of multi-step auth flows. */
export function AuthStepPills({ totalSteps, activeIndex }: AuthStepPillsProps) {
    return (
        <View style={styles.row} accessibilityRole="progressbar">
            {Array.from({ length: totalSteps }, (_, index) => (
                <View
                    key={index}
                    style={[styles.pill, index === activeIndex ? styles.pillActive : styles.pillInactive]}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: DesignSpacing.sm,
        marginBottom: DesignSpacing.xs,
    },
    pill: {
        height: 4,
        borderRadius: DesignRadius.full,
        width: 28,
    },
    pillActive: {
        backgroundColor: DesignColors.primaryBright,
    },
    pillInactive: {
        backgroundColor: DesignColors.surfaceContainerHighest,
    },
});
