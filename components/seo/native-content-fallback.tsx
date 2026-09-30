import { StyleSheet, Text, View } from 'react-native';

type NativeContentFallbackProps = {
  title: string;
};

export function NativeContentFallback({ title }: NativeContentFallbackProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>This information page is available on the Gida website.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#10100f' },
  title: { color: '#d9ad60', fontSize: 24, fontWeight: '600', marginBottom: 12 },
  message: { color: '#f4efe6', fontSize: 16, lineHeight: 24 },
});
