import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

type LoadingFooterProps = {
  isLoading: boolean;
  hideWhenIdle?: boolean;
  text?: string;
};

export const LoadingFooter = ({
  isLoading,
  hideWhenIdle = false,
  text = 'Loading more…',
}: LoadingFooterProps) => {
  if (!isLoading || hideWhenIdle) {
    return null;
  }

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="small" color="#4F46E5" />
      ) : (
        <Text style={styles.text}>{text}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
    color: 'gray',
  },
});