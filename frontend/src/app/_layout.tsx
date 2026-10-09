import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  usePathname,
  useRouter,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { supabase } from '../lib/supabase';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider
      value={
        colorScheme === 'dark'
          ? DarkTheme
          : DefaultTheme
      }
    >
      <AuthGate />

      <AnimatedSplashOverlay />
    </ThemeProvider>
  );
}

function AuthGate() {
  const router = useRouter();
  const pathname = usePathname();

  const [session, setSession] = useState<
    Awaited<
      ReturnType<typeof supabase.auth.getSession>
    >['data']['session']
  >(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted) {
        setSession(session);
        setLoading(false);
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          setSession(session);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    const isAuthScreen =
      pathname === '/login' ||
      pathname === '/signup' ||
      pathname === '/onboarding';

    if (!session && !isAuthScreen) {
      router.replace('/login');
      return;
    }

    if (session && pathname === '/login') {
      router.replace('/');
      return;
    }

    if (session && pathname === '/signup') {
      router.replace('/');
      return;
    }

    // Authenticated users are allowed to stay on
    // the onboarding screen until they complete setup.
  }, [
    loading,
    session,
    pathname,
    router,
  ]);

  if (loading) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="log-meal" />
      <Stack.Screen name="edit-meal" />
    </Stack>
  );
}