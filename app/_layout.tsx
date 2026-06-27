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
        <Stack.Screen name="annuaire" options={{ title: "Annuaire 🔍", headerBackVisible: false }} />
        <Stack.Screen name="business/[id]" options={{ title: 'Entreprise' }} />
        <Stack.Screen name="auth" options={{ title: 'Connexion', presentation: 'modal' }} />
        <Stack.Screen name="forgot-password" options={{ title: 'Mot de passe oublié', presentation: 'modal' }} />
        <Stack.Screen name="liked" options={{ title: 'Favoris ❤️', headerBackVisible: false }} />
        <Stack.Screen name="settings" options={{ title: 'Paramètres ⚙️', headerBackVisible: false }} />
        <Stack.Screen name="vendor/dashboard" options={{ title: 'Mon espace', headerBackVisible: false }} />
        <Stack.Screen name="vendor/add-business" options={{ title: 'Ajouter une entreprise' }} />
        <Stack.Screen name="vendor/edit-business" options={{ title: "Modifier l'entreprise" }} />
        <Stack.Screen name="vendor/pending" options={{ headerShown: false }} />
        <Stack.Screen name="admin/index" options={{ title: 'Admin Panel' }} />
      </Stack>
    </AuthProvider>
  );
}
