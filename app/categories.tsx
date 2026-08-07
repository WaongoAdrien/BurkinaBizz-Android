// app/categories.tsx — All categories

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, CATEGORIES } from '../constants';
import { useColorTheme } from '../hooks/useColorTheme';
import { CategoryIcon } from '../components/CategoryIcon';
import { ContentContainer } from '../components/ContentContainer';
import { AppHeader } from '../components/AppHeader';
import { useTranslation, registerTranslations } from '../lib/LanguageContext';

registerTranslations({
  "Parcourir l'annuaire": 'Browse directory',
  'Shopping': 'Shopping',
  'Restauration': 'Restaurants',
  'Hôtellerie': 'Hotels',
  'Sport-Gym': 'Sports & Gym',
  'Résidence meublée': 'Furnished Apartments',
  'Electroniques': 'Electronics',
  'Coiffure & Beauté': 'Hair & Beauty',
  'Pharmacies': 'Pharmacies',
  'Produits Locaux': 'Local Products',
  'Soirées': 'Nightlife',
  'Attractions': 'Attractions',
  'Immobilier': 'Real Estate',
  'Alimentation': 'Groceries',
  'Services': 'Services',
  'Automobile': 'Automotive',
  'Autres': 'Other',
});

export default function CategoriesScreen() {
  const router = useRouter();
  const { theme, isDark } = useColorTheme();
  const { t } = useTranslation();

  return (
    <LinearGradient
      colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
      style={styles.container}
    >
      <AppHeader title={t('Catégories')} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <ContentContainer maxWidth={600} style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32 }}>
          <View style={styles.grid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.label}
                style={[styles.catCard, {
                  backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                  borderColor: cat.color + '40',
                }]}
                onPress={() => router.push({ pathname: '/annuaire', params: { category: cat.label } })}
                activeOpacity={0.8}
              >
                <View style={[styles.catIconCircle, { backgroundColor: cat.color + '22' }]}>
                  <CategoryIcon iconName={cat.icon} iconFamily={cat.iconFamily} size={28} color={cat.color} />
                </View>
                <Text style={[styles.catLabel, { color: theme.text }]} numberOfLines={2}>
                  {t(cat.label)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* BROWSE ALL */}
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.push('/annuaire')}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="search" size={20} color="#1A1A1A" />
              <Text style={styles.ctaBtnText}>{t("Parcourir l'annuaire")}</Text>
            </View>
          </TouchableOpacity>
        </ContentContainer>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  appTitle: { fontSize: 26, fontWeight: '400', letterSpacing: -0.5, marginBottom: 20, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  catCard: { width: '47%', borderRadius: 8, paddingVertical: 18, paddingHorizontal: 10, alignItems: 'center', borderWidth: 1.5, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  catIconCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  catLabel: { fontSize: 13, fontWeight: '400', textAlign: 'center', lineHeight: 17 },
  ctaBtn: { backgroundColor: Colors.cta, paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginTop: 20, elevation: 3, shadowColor: Colors.cta, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 5 },
  ctaBtnText: { fontSize: 17, fontWeight: '400', color: '#1A1A1A' },
});
