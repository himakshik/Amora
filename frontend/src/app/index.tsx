import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function HomeScreen() {
  console.log('Supabase client:', !!supabase);
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.brand}>AMORA</Text>
        <Text style={styles.sparkle}>✦</Text>

        <Text style={styles.title}>
          Your everyday AI{'\n'}wellness companion
        </Text>

        <Text style={styles.description}>
          Nutrition, movement and progress — personalized around you.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.8}
          onPress={() => console.log('Get Started')}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          activeOpacity={0.7}
          onPress={() => console.log('Login')}
        >
          <Text style={styles.loginText}>
            Already have an account?{' '}
            <Text style={styles.loginHighlight}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        Your everyday AI wellness companion
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8FA',
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  brand: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 6,
    color: '#743D59',
  },

  sparkle: {
    marginTop: 10,
    fontSize: 24,
    color: '#B86B8B',
  },

  title: {
    marginTop: 36,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '700',
    textAlign: 'center',
    color: '#302229',
  },

  description: {
    marginTop: 20,
    maxWidth: 320,
    fontSize: 16,
    lineHeight: 25,
    textAlign: 'center',
    color: '#77636C',
  },

  primaryButton: {
    width: '100%',
    marginTop: 50,
    backgroundColor: '#9B4F70',
    paddingVertical: 17,
    borderRadius: 18,
    alignItems: 'center',
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  loginButton: {
    marginTop: 18,
    padding: 10,
  },

  loginText: {
    color: '#79646D',
    fontSize: 15,
  },

  loginHighlight: {
    color: '#8E4566',
    fontWeight: '700',
  },

  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#AD969F',
  },
});