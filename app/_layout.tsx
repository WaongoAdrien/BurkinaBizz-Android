import { Stack } from 'expo-router';
import { useColorScheme, View } from 'react-native';
import { AuthProvider } from '../lib/AuthContext';
import { LanguageProvider, useTranslation, registerTranslations } from '../lib/LanguageContext';
import { Colors } from '../constants';
import { TabBar } from '../components/TabBar';

registerTranslations({
  'Annuaire 🔍': 'Directory 🔍',
  'Catégories': 'Categories',
  'Découvrir': 'Discover',
  'Sites touristiques': 'Tourist sites',
  'À propos du Burkina Faso': 'About Burkina Faso',
  'Entreprise': 'Business',
  'Connexion': 'Sign in',
  'Mot de passe oublié': 'Forgot password',
  'Favoris ❤️': 'Favorites ❤️',
  'Paramètres': 'Settings',
  'Mon espace': 'My space',
  'Ajouter une entreprise': 'Add a business',
  "Modifier l'entreprise": 'Edit business',
  'Admin Panel': 'Admin Panel',
  'Événements': 'Events',
});

function RootStack() {
  const isDark = useColorScheme() === 'dark';
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDark ? Colors.dark.background : Colors.light.background },
      }}>
        <Stack.Screen name="index" options={{ title: t('Accueil') }} />
        <Stack.Screen name="annuaire" options={{ title: t('Annuaire 🔍') }} />
        <Stack.Screen name="categories" options={{ title: t('Catégories') }} />
        <Stack.Screen name="more" options={{ title: t('Découvrir') }} />
        <Stack.Screen name="tourism-sites" options={{ title: t('Sites touristiques') }} />
        <Stack.Screen name="about-burkina" options={{ title: t('À propos du Burkina Faso') }} />
        <Stack.Screen name="business/[id]" options={{ title: t('Entreprise') }} />
        <Stack.Screen name="tourism/[id]" options={{ title: t('Sites touristiques') }} />
        <Stack.Screen name="evenement/[id]" options={{ title: t('Événements') }} />
        <Stack.Screen name="auth" options={{ title: t('Connexion') }} />
        <Stack.Screen name="forgot-password" options={{ title: t('Mot de passe oublié'), presentation: 'modal' }} />
        <Stack.Screen name="liked" options={{ title: t('Favoris ❤️') }} />
        <Stack.Screen name="settings" options={{ title: t('Paramètres') }} />
        <Stack.Screen name="vendor/dashboard" options={{ title: t('Mon espace') }} />
        <Stack.Screen name="vendor/add-business" options={{ title: t('Ajouter une entreprise') }} />
        <Stack.Screen name="vendor/edit-business" options={{ title: t("Modifier l'entreprise") }} />
        <Stack.Screen name="vendor/pending" options={{ title: t('Mon espace') }} />
        <Stack.Screen name="admin/index" options={{ title: t('Admin Panel') }} />
        <Stack.Screen name="evenement" options={{ title: t('Événements') }} />
      </Stack>
      <TabBar />
    </View>
  );
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <RootStack />
      </AuthProvider>
    </LanguageProvider>
  );
}
