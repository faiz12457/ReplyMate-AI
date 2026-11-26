import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

// Keep the native splash screen visible until our root layout mounts cleanly.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = useTheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.primary,
          headerTitleStyle: { fontWeight: '700', color: theme.text },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.background },
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen
          name="input"
          options={{
            title: 'Conversation Input',
            headerBackTitle: 'Home',
          }}
        />
        <Stack.Screen
          name="suggestions"
          options={{
            title: 'Reply Suggestions',
            headerBackTitle: 'Input',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: 'Preferences',
            headerBackTitle: 'Home',
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
