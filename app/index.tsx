// app/index.tsx — HomeScreen

import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, StatusBar, Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, CATEGORIES } from '../constants';
import { useColorTheme } from '../hooks/useColorTheme';
import { useAuth } from '../lib/AuthContext';
import { Category } from '../types';
import { TabBar } from '../components/TabBar';
import { CategoryIcon } from '../components/CategoryIcon';
import { ContentContainer } from '../components/ContentContainer';

// ── Your contact number ───────────────────────────────────────────────────────
const CONTACT_WHATSAPP = '+1 646 478 6515'; // 👈 Replace with your real number
const CONTACT_MESSAGE  = 'Bonjour! Je souhaite référencer mon entreprise sur BurkinaBizz 🇧🇫';
// ─────────────────────────────────────────────────────────────────────────────

// ── Hero banner image URL ─────────────────────────────────────────────────────
const HERO_IMAGE_URL = 'https://animated-pavlova-672217.netlify.app/images/image-app.png'; // 👈 Replace with your image URL
// ─────────────────────────────────────────────────────────────────────────────

// Grows by 100 every month starting from June 2026 baseline of 500
const LAUNCH_YEAR = 2026;
const LAUNCH_MONTH = 6; // June (1-indexed)
const now = new Date();
const monthsElapsed = (now.getFullYear() - LAUNCH_YEAR) * 12 + (now.getMonth() + 1 - LAUNCH_MONTH);
const DAILY_USERS = 500 + Math.max(0, monthsElapsed) * 100;

export default function HomeScreen() {
  const router = useRouter();
  const { theme, isDark } = useColorTheme();
  const { user, userProfile } = useAuth();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* HEADER */}
      <View style={styles.header}>
        <ContentContainer maxWidth={600} style={{ paddingHorizontal: 10 }}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.flag}></Text>
              <Text style={styles.appTitle}>BurkinaBizz</Text>
              <Text style={styles.tagline}>L'annuaire des entreprises viables</Text>
            </View>
  
          </View>
        </ContentContainer>
      </View>

      <LinearGradient
        colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
        <ContentContainer maxWidth={600} style={{ paddingHorizontal: 6, paddingTop: 20 }}>
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
            <Text style={styles.statNum}>+{DAILY_USERS}</Text>
            <Text style={[styles.statLbl, { color: theme.textSecondary }]}>Utilisateurs/jour</Text>
          </View>
        </View>

        {/* LOGIN / MON ESPACE CTA */}
        {!user ? (
          <LinearGradient
            colors={['#1B5E20', '#2E7D32', '#388E3C']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.authCard}
          >
            {/* Headline */}
            <Text style={styles.authCardTitle}>Rejoignez BurkinaBizz</Text>
            <Text style={styles.authCardSub}>La plateforme des entreprises viables du Burkina Faso</Text>

            {/* Benefits */}
            <View style={styles.authBenefits}>
              {[
                { icon: 'favorite', text: 'Sauvegardez vos favoris' },
                { icon: 'storefront', text: 'Référencez votre entreprise' },
                //{ icon: 'visibility', text: 'Accédez à tout l\'annuaire' },
              ].map(b => (
                <View key={b.icon} style={styles.authBenefitRow}>
                  <View style={styles.authBenefitIcon}>
                    <MaterialCommunityIcons name={b.icon === 'storefront' ? 'storefront' : b.icon === 'favorite' ? 'heart' : 'eye'} size={15} color={Colors.cta} />
                  </View>
                  <Text style={styles.authBenefitText}>{b.text}</Text>
                </View>
              ))}
            </View>

            {/* Primary CTA */}
            <TouchableOpacity
              style={styles.authSignupBtn}
              onPress={() => router.push('/auth')}
              activeOpacity={0.85}
            >
              <Ionicons name="person-add" size={18} color="#1A1A1A" />
              <Text style={styles.authSignupText}>Créer un compte gratuit</Text>
            </TouchableOpacity>

            {/* Secondary CTA */}
            <TouchableOpacity
              style={styles.authLoginBtn}
              onPress={() => router.push('/auth')}
              activeOpacity={0.85}
            >
              <Text style={styles.authLoginText}>J'ai déjà un compte  →</Text>
            </TouchableOpacity>
          </LinearGradient>
        ) : (
          <LinearGradient
            colors={['#5C6BC0', '#283593']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.userCard}
          >
            {/* Avatar + name row */}
            <View style={styles.userCardTop}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {(userProfile?.name || user?.email || 'U')[0].toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userCardName} numberOfLines={1}>
                  {userProfile?.name || 'Mon compte'}
                </Text>
                <Text style={styles.userCardEmail} numberOfLines={1}>
                  {user?.email}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <TouchableOpacity
              style={styles.userCardBtn}
              onPress={() => router.push('/vendor/dashboard')}
              activeOpacity={0.85}
            >
              <Ionicons name="person" size={17} color="#283593" />
              <Text style={styles.userCardBtnText}>Mon espace</Text>
            </TouchableOpacity>
          </LinearGradient>
        )}

        {/* HERO BANNER IMAGE */}
        <View style={styles.heroBanner}>
          <Image
            source={{ uri: HERO_IMAGE_URL }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          {/* OVERLAY GRADIENT */}
          <LinearGradient
            colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.6)']}
            style={styles.heroOverlay}
          >
            <Text style={styles.heroTitle}>Découvrez vos entreprises locales</Text>
            <Text style={styles.heroSubtitle}>Partout au Burkina Faso 🇧🇫</Text>
          </LinearGradient>
        </View>

        {/* BROWSE ALL */}
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => router.push('/annuaire')}
          activeOpacity={0.85}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="search" size={20} color="#1A1A1A" />
            <Text style={styles.ctaBtnText}>Parcourir l'annuaire</Text>
          </View>
        </TouchableOpacity>

        {/* CATEGORIES */}
        <Text style={[styles.sectionTitle, { color: theme.text }, { textAlign: 'center' }]}>Par Catégorie</Text>
        <View style={styles.grid}>
          {Array.from({ length: Math.ceil(CATEGORIES.length / 2) }, (_, i) =>
            CATEGORIES.slice(i * 2, i * 2 + 2)
          ).map((row, rowIndex) => (
            <View key={rowIndex} style={styles.catRow}>
              {row.map((cat) => (
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
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
              {row.length === 1 && <View style={styles.catCard} />}
            </View>
          ))}
        </View>

        {/* SUBMIT BUSINESS CTA */}
        <TouchableOpacity
          onPress={() => router.push(user ? '/vendor/add-business' : '/auth')}
          activeOpacity={0.85}
          style={styles.submitCtaWrap}
        >
          <LinearGradient
            colors={['#5C6BC0', '#283593']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.submitCta}
          >
            <View style={styles.submitCtaIconCircle}>
              <MaterialCommunityIcons name="storefront" size={30} color="#5C6BC0" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.submitCtaTitle}>Vous avez une entreprise?</Text>
              <Text style={styles.submitCtaSub}>Référencez-la gratuitement dans l'annuaire</Text>
            </View>
            <View style={styles.submitCtaArrow}>
              <Text style={{ color: '#5C6BC0', fontWeight: '900', fontSize: 18 }}>→</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* WHATSAPP CONTACT */}
        <TouchableOpacity
          style={styles.waBtn}
          onPress={() => {
            const num = CONTACT_WHATSAPP.replace(/\D/g, '');
            Linking.openURL(`https://wa.me/${num}?text=${encodeURIComponent(CONTACT_MESSAGE)}`);
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="logo-whatsapp" size={32} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={styles.waTitle}>Nous contacter sur WhatsApp</Text>
            <Text style={styles.waSub}>Questions? On vous répond rapidement</Text>
          </View>
          <Text style={styles.waArrow}>→</Text>
        </TouchableOpacity>

        {/* HOW IT WORKS */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Comment ça marche?</Text>
        {[
          { iconName: 'search', title: 'Chercher', desc: 'Trouvez une entreprise par catégorie ou ville' },
          { iconName: 'call', title: 'Contacter', desc: 'Appelez ou écrivez sur WhatsApp ou Facebook directement' },
          { iconName: 'heart', title: 'Sauvegarder', desc: 'Ajoutez vos entreprises préférées aux favoris' },
        ].map((step, i) => (
          <View key={step.title} style={[styles.stepCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.stepAccent} />
            <View style={[styles.stepNum, { backgroundColor: Colors.cta }]}>
              <Text style={styles.stepNumText}>{i + 1}</Text>
            </View>
            <View style={[styles.stepIconContainer, { backgroundColor: Colors.cta + '22', borderRadius: 20 }]}>
              <Ionicons name={step.iconName as any} size={22} color={Colors.cta} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.stepTitle, { color: theme.text }]}>{step.title}</Text>
              <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>{step.desc}</Text>
            </View>
          </View>
        ))}


        <View style={{ height: 32 }} />
        </ContentContainer>
      </ScrollView>
      </LinearGradient>
      
      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { backgroundColor: Colors.primary, paddingHorizontal: 6, paddingTop: 62, paddingBottom: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  flag: { fontSize: 32 },
  appTitle: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5, marginTop: 2 },
  tagline: { fontSize: 13, color: '#A5D6A7', marginTop: 2 },
  dashPill: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginTop: 10, height:65, justifyContent:'center', alignItems:'center' },
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
  userCard: { borderRadius: 20, padding: 20, marginBottom: 20, elevation: 6, shadowColor: '#283593', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12 },
  userCardTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  userAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  userAvatarText: { fontSize: 22, fontWeight: '900', color: '#fff' },
  userCardName: { fontSize: 16, fontWeight: '900', color: '#fff', marginBottom: 2 },
  userCardEmail: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  userCardBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.95)', paddingVertical: 13, borderRadius: 12 },
  userCardBtnText: { fontSize: 15, fontWeight: '900', color: '#283593' },
  authCard: { borderRadius: 20, padding: 22, marginBottom: 20, elevation: 6, shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12 },
  authCardTitle: { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 4 },
  authCardSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 16, lineHeight: 18 },
  authBenefits: { gap: 8, marginBottom: 20 },
  authBenefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  authBenefitIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  authBenefitText: { fontSize: 13, color: '#fff', fontWeight: '500' },
  authSignupBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.cta, paddingVertical: 14, borderRadius: 12, marginBottom: 10, elevation: 2, shadowColor: Colors.cta, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6 },
  authSignupText: { fontSize: 15, fontWeight: '900', color: '#1A1A1A' },
  authLoginBtn: { alignItems: 'center', paddingVertical: 10 },
  authLoginText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  loginBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginBottom: 8, elevation: 2, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 6 },
  loginBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  loginHint: { fontSize: 12, textAlign: 'center', lineHeight: 17, paddingHorizontal: 8 },
  
  // Hero banner with image
  heroBanner: { 
    height: 200, 
    borderRadius: 16, 
    overflow: 'hidden', 
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    justifyContent: 'flex-end',
  },
  heroTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  
  ctaBtn: { backgroundColor: Colors.cta, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginBottom: 24, elevation: 3, shadowColor: Colors.cta, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  ctaBtnText: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 14 },
  grid: { marginBottom: 24, gap: 12 },
  catRow: { flexDirection: 'row', gap: 12 },
  catCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1.5, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  catIconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  catIcon: { fontSize: 24 },
  catLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center', lineHeight: 16 },
  submitCtaWrap: { marginBottom: 24, borderRadius: 16, elevation: 6, shadowColor: '#283593', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 10 },
  submitCta: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 18, gap: 14 },
  submitCtaIconCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  submitCtaTitle: { fontSize: 16, fontWeight: '900', color: '#fff', marginBottom: 3 },
  submitCtaSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 17 },
  submitCtaArrow: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  stepCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingRight: 14, paddingLeft: 0, borderRadius: 12, borderWidth: 1, marginBottom: 10, gap: 12, overflow: 'hidden' },
  stepAccent: { width: 5, alignSelf: 'stretch', backgroundColor: Colors.cta, borderTopLeftRadius: 12, borderBottomLeftRadius: 12, marginRight: 8 },
  stepNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  stepIconContainer: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  stepTitle: { fontSize: 14, fontWeight: '800' },
  stepDesc: { fontSize: 12, marginTop: 2 },
  waBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 16, marginBottom: 24, gap: 12, backgroundColor: '#2d7647' },
  waIcon: { fontSize: 28 },
  waTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  waSub: { fontSize: 12, marginTop: 2, color: 'rgba(255,255,255,0.85)' },
  waArrow: { color: '#fff', fontWeight: '700', fontSize: 18 },
  
});
