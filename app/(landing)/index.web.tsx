import { View, Text, StyleSheet } from 'react-native';

export default function LandingIndexScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0e10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#e5e1e4',
    fontSize: 18,
  },
});
