import { useWindowDimensions } from 'react-native';

import { DesignLayout, DesignSpacing } from '@/constants/design';

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= DesignLayout.desktopBreakpoint;
  const horizontalMargin = isDesktop ? DesignSpacing.marginDesktop : DesignSpacing.marginMobile;
  const contentWidth = Math.min(width - horizontalMargin * 2, DesignLayout.maxContentWidth);

  return {
    width,
    height,
    isDesktop,
    horizontalMargin,
    contentWidth,
    authCardWidth: Math.min(contentWidth, DesignLayout.authCardMaxWidth),
  };
}
