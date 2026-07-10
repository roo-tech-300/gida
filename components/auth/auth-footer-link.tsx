import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type AuthFooterLinkProps = {
  prompt: string;
  actionLabel: string;
  href: '/login' | '/signup';
};

export function AuthFooterLink({ prompt, actionLabel, href }: AuthFooterLinkProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.prompt}>{prompt}</Text>
      <Link href={href} asChild>
        <Pressable accessibilityRole="link" hitSlop={8}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: DesignSpacing.xs,
  },
  prompt: {
    ...DesignTypography.bodyMd,
    color: DesignColors.textSecondary,
    fontFamily,
  },
  action: {
    ...DesignTypography.bodyMd,
    color: DesignColors.primaryBright,
    fontWeight: '600',
    fontFamily,
  },
});
