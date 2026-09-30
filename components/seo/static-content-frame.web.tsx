import type { CSSProperties } from 'react';
import { StyleSheet, View } from 'react-native';

type StaticContentFrameProps = {
  source: string;
  title: string;
};

const frameStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  height: '100%',
  border: 'none',
};

export function StaticContentFrame({ source, title }: StaticContentFrameProps) {
  return (
    <View style={styles.container}>
      <iframe title={title} src={source} style={frameStyle} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
