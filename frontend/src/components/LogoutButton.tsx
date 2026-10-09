import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';

import { supabase } from '../lib/supabase';

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) {
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      setLoading(false);
      return;
    }

    setLoading(false);

    // AuthGate will also detect the session disappearing,
    // but this makes the navigation immediate.
    router.replace('/login');
  };

  return (
    <TouchableOpacity
      style={styles.button}
      activeOpacity={0.8}
      disabled={loading}
      onPress={handleLogout}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color="#8E4566"
        />
      ) : (
        <Text style={styles.text}>Log out</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#FDF0F4',
    borderWidth: 1,
    borderColor: '#E8CBD7',
  },

  text: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8E4566',
  },
});