import { StyleSheet } from 'react-native';
import { DesignColors, DesignRadius, DesignSpacing } from '@/constants/design';

export const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFill,
    zIndex: 200,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: DesignColors.surfaceContainerLowest,
    zIndex: 201,
    borderTopLeftRadius: DesignRadius.lg,
    borderTopRightRadius: DesignRadius.lg,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: DesignSpacing.marginMobile,
  },
  dragHandleRow: {
    alignItems: 'center',
    paddingTop: DesignSpacing.sm,
    paddingBottom: DesignSpacing.xs,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: DesignColors.outlineVariant,
  },
  tabsRow: {
    marginBottom: DesignSpacing.md,
  },
  body: {
    flex: 1,
  },
  scrollBody: {
    paddingBottom: DesignSpacing.xl * 2,
    gap: DesignSpacing.lg,
  },
});
