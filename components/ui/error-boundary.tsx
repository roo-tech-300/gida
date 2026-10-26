import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo.componentStack);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              An unexpected error occurred. We logged it so our team can take a look.
            </Text>
            {__DEV__ && this.state.error ? (
              <Text style={styles.devError} numberOfLines={6}>
                {this.state.error.message}
              </Text>
            ) : null}
            <Pressable onPress={this.reset} style={styles.button}>
              <Text style={styles.buttonText}>Try again</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.surfaceContainerLowest,
    paddingHorizontal: DesignSpacing.marginMobile,
  },
  content: {
    alignItems: 'center',
    gap: DesignSpacing.md,
    maxWidth: 320,
  },
  title: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
    lineHeight: 22,
  },
  devError: {
    ...DesignTypography.bodySm,
    color: DesignColors.error,
    fontFamily,
    textAlign: 'center',
    backgroundColor: DesignColors.surfaceContainerHigh,
    padding: DesignSpacing.sm,
    borderRadius: 8,
    width: '100%',
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: DesignColors.primary,
    marginTop: DesignSpacing.sm,
  },
  buttonText: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onPrimary,
    fontFamily,
    fontWeight: '700',
  },
});
