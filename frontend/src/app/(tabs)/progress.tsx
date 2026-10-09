import { StyleSheet, Text, View } from 'react-native';

export default function ProgressScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progress</Text>
      <Text style={styles.subtitle}>
        Your progress over time.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8FA',
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#302229',
  },

  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#806C75',
  },
});