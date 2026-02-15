// app/index.tsx — HomeScreen

import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, CATEGORIES } from '../constants';
import { useColorTheme } from '../hooks/useColorTheme';
import { useAuth } from '../lib/AuthContext';
import { Category } from '../types';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 48) / 2;

export default function HomeScreen() {
  const router = useRouter();
  const { theme, isDark } = useColorTheme();
  const { user } = useAuth();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: Colors.primary }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.flag}>🇧🇫</Text>
            <Text style={styles.appTitle}>BurkinaBizz</Text>
            <Text style={styles.tagline}>Répertoire des entreprises du Burkina Faso</Text>
          </View>
          {user && (
            <TouchableOpacity
              style={styles.dashPill}
              onPress={() => router.push('/vendor/dashboard')}
            >
              <Text style={styles.dashPillText}>Mon espace</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={[styles.scroll, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* STATS BANNER */}
        <View style={[styles.statsBanner, { backgroundColor: isDark ? '#1a2e1a' : '#E8F5E9' }]}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>🇧🇫</Text>
            <Text style={[styles.statLbl, { color: theme.textSecondary }]}>Burkina Faso</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>100%</Text>
            <Text style={[styles.statLbl, { color: theme.textSecondary }]}>Local</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>📱</Text>
            <Text style={[styles.statLbl, { color: theme.textSecondary }]}>WhatsApp</Text>
          </View>
        </View>

        {/* LOGIN / FAVORITE CTA */}
        {!user && (
          <View style={styles.loginBlock}>
            <TouchableOpacity
              style={[styles.loginBtn, { backgroundColor: Colors.primary }]}
              onPress={() => router.push('/auth')}
              activeOpacity={0.85}
            >
              <Text style={styles.loginBtnText}>Connexion / Inscription</Text>
            </TouchableOpacity>
            <Text style={[styles.loginHint, { color: theme.textSecondary }]}>
              Connectez-vous pour sauvegarder vos entreprises favorites
            </Text>
          </View>
        )}

        {/* BROWSE ALL */}
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => router.push('/annuaire')}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaBtnText}>🔍  Parcourir l'annuaire</Text>
        </TouchableOpacity>

        {/* CATEGORIES */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Par catégorie</Text>
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
                <Text style={styles.catIcon}>{cat.icon}</Text>
              </View>
              <Text style={[styles.catLabel, { color: theme.text }]} numberOfLines={2}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* SUBMIT BUSINESS CTA */}
        <TouchableOpacity
          style={[styles.submitCta, { borderColor: Colors.primary }]}
          onPress={() => router.push(user ? '/vendor/add-business' : '/auth')}
          activeOpacity={0.85}
        >
          <Text style={styles.submitCtaIcon}>🏪</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.submitCtaTitle, { color: theme.text }]}>
              Vous avez une entreprise?
            </Text>
            <Text style={[styles.submitCtaSub, { color: theme.textSecondary }]}>
              Référencez-la gratuitement dans l'annuaire
            </Text>
          </View>
          <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 18 }}>→</Text>
        </TouchableOpacity>

        {/* HOW IT WORKS */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Comment ça marche?</Text>
        {[
          { icon: '🔍', title: 'Chercher', desc: 'Trouvez une entreprise par catégorie ou ville' },
          { icon: '📞', title: 'Contacter', desc: 'Appelez ou écrivez sur WhatsApp directement' },
          { icon: '❤️', title: 'Sauvegarder', desc: 'Ajoutez vos entreprises préférées aux favoris' },
        ].map((step, i) => (
          <View key={step.title} style={[styles.stepCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.stepNum, { backgroundColor: Colors.primary }]}>
              <Text style={styles.stepNumText}>{i + 1}</Text>
            </View>
            <Text style={styles.stepIcon}>{step.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.stepTitle, { color: theme.text }]}>{step.title}</Text>
              <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>{step.desc}</Text>
            </View>
          </View>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  flag: { fontSize: 32 },
  appTitle: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5, marginTop: 2 },
  tagline: { fontSize: 13, color: '#A5D6A7', marginTop: 2 },
  dashPill: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginTop: 19 },
  dashPillText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },
  statsBanner: {
    flexDirection: 'row', borderRadius: 14, padding: 16,
    marginBottom: 16, alignItems: 'center', justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  statLbl: { fontSize: 11, marginTop: 2, fontWeight: '500' },
  statDivider: { width: 1, height: 32, opacity: 0.4 },
  loginBlock: { marginBottom: 12 },
  loginBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginBottom: 8, elevation: 2, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 6 },
  loginBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  loginHint: { fontSize: 12, textAlign: 'center', lineHeight: 17, paddingHorizontal: 8 },
  ctaBtn: { backgroundColor: Colors.cta, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginBottom: 24, elevation: 3, shadowColor: Colors.cta, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  ctaBtnText: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24, gap: 12, justifyContent: 'center' },
  catCard: { width: CARD_SIZE, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1.5, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  catIconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  catIcon: { fontSize: 24 },
  catLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center', lineHeight: 16 },
  submitCta: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 2, padding: 16, marginBottom: 24, gap: 12 },
  submitCtaIcon: { fontSize: 28 },
  submitCtaTitle: { fontSize: 15, fontWeight: '700' },
  submitCtaSub: { fontSize: 12, marginTop: 2, lineHeight: 17 },
  stepCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10, gap: 12 },
  stepNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  stepIcon: { fontSize: 22 },
  stepTitle: { fontSize: 14, fontWeight: '700' },
  stepDesc: { fontSize: 12, marginTop: 2 },
});
