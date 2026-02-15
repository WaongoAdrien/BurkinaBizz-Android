import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { AuthProvider } from '../lib/AuthContext';
import { Colors } from '../constants';

export default function RootLayout() {
  const isDark = useColorScheme() === 'dark';
  return (
    <AuthProvider>
      <Stack screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        contentStyle: { backgroundColor: isDark ? Colors.dark.background : Colors.light.background },
      }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="annuaire" options={{ title: "Annuaire 🔍" }} />
        <Stack.Screen name="business/[id]" options={{ title: 'Entreprise' }} />
        <Stack.Screen name="auth" options={{ title: 'Connexion', presentation: 'modal' }} />
        <Stack.Screen name="vendor/dashboard" options={{ title: 'Mon espace' }} />
        <Stack.Screen name="vendor/add-business" options={{ title: 'Ajouter une entreprise' }} />
        <Stack.Screen name="vendor/pending" options={{ headerShown: false }} />
        <Stack.Screen name="admin/index" options={{ title: 'Admin Panel' }} />
      </Stack>
    </AuthProvider>
  );
}
