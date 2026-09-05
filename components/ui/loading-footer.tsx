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
    <View
      style={
        hideWhenIdle
          ? StyleSheet.absoluteFillObject
          : {
              padding: 20,
              textAlign: 'center',
              color: 'gray',
            }
      }
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#4F46E5" />
      ) : (
        <Text>{text}</Text>
      )}
    </View>
  );
};